import { ExtractByType } from "~shared/types/utils"
import {
  iFsmConfig,
  iData,
  FSMMethods,
  MachineData,
  ExtConfig,
} from "../fsm_types";
import { graph, States, Transitions } from "./transitions";
import { API } from "~shared/api/api";
import { RequestMatching } from "~shared/types/types";

async function waitForCondition<T>(req: () => Promise<T>, cond: (resp: T) => boolean, interval: number = 1000) {
  return new Promise<void>((resolve, reject) => {
    const run = async () => {
      const resp = await req();
      if (cond(resp)) {
        resolve();
      } else {
        setTimeout(run, interval);
      }
    }
    run();
  })
}
async function waitForConditionTerminated<T>(abort_signal: AbortSignal, req: () => Promise<T>, cond: (resp: T) => boolean) {
  return new Promise<void>(async (resolve, reject) => {
    let finish = false;
    const interval = setInterval(() => {
      if (finish) {
        clearInterval(interval);
        resolve();
      }
      if (abort_signal.aborted)
        reject();
    }, 200);
    waitForCondition(req, cond).then(() => finish = true).catch(() => {
      clearInterval(interval);
      reject()
    });
  });
}

async function checkCondition<T>(req: () => Promise<T>, cond: (resp: T) => boolean) {
  const resp = await req();
  if (!cond(resp))
    throw new Error(`checkCondition | condition is false | resp: ${JSON.stringify(resp)}`);
}
const MD_MAX_STEP = 4
const LINK_COUNT = 3//12
const COLUMN_COUNT = 2//4

function createFSMConfig(ext_config: Extract<ExtConfig, { type: "MASTER" }>["ext_config"]) {
  const ext_config_init: Extract<MachineData, { type: "MASTER" }>["ext_config"] = {
    md: new API<RequestMatching>("http://localhost", ext_config.md),
    mm: new API<RequestMatching>("http://localhost", ext_config.mm),
    mp: new API<RequestMatching>("http://localhost", ext_config.mp),
  }


  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MASTER">;
    methods: FSMMethods<"MASTER", States, Transitions>;
  } = {
    init: graph.init,
    transitions: graph.transitions,
    data: {
      type: "MASTER",
      init: graph.init,
      is_test: false,
      ext_config: ext_config_init,
      current_element: { type: "link", address: { cassete: 0, pos: 0 } },
      current_level: [],
      abort_controller: new AbortController(),
    },
    methods: {
      // can cancel only in
      // 
      // onBeforeTransition
      // onBefore<TRANSITION>
      // onLeaveState
      // onLeave<STATE>
      // onTransition
      getMachineStatus: function () {
        return {
          type: this.type,
          state: this.state,
          cycle_step: undefined,
          status_message: undefined,
          current_element: this.current_element,
          current_level: this.current_level,
        };
      },
      onLeaveState: async function () {
        // console.log(this.ext_config);
      },
      AbortSignalListener() {
        // this.plc.writeVarByName("alarm", true);
        this.ext_config.md.getByAPI_post("exec_controller_command", { command: "stop" });
        this.ext_config.mp.getByAPI_post("exec_controller_command", { command: "stop" });
        this.ext_config.mm.getByAPI_post("exec_controller_command", { command: "stop" });
        this.ext_config.md.getByAPI_post("exec_controller_command", { command: "abortExecCommand" });
        this.ext_config.mp.getByAPI_post("exec_controller_command", { command: "abortExecCommand" });
        this.ext_config.mm.getByAPI_post("exec_controller_command", { command: "abortExecCommand" });

      },
      onBeforeTransition: async function (lifecycle) {
        this.abort_controller = new AbortController();
        this.abort_controller.signal.addEventListener("abort", () => this.AbortSignalListener());
        return true;
      },
      onAfterTransition: function (lifecycle) {
        return true;
      },
      async onBeforeLiftUpOneLevel(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await checkCondition(() => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            md_status.machine_status.level == 0 &&
            md_status.state == "available" &&
            md_status.machine_status.state == "on_pins_support");
        await checkCondition(() => this.ext_config.mp.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MP" &&
            md_status.state == "available" &&
            md_status.machine_status.state == "bottom");
      },
      async onLeaveLiftingOneLevel(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await this.onBeforeLiftUpOneLevel(lifecycle);

        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "tension", commands: ["tensionEnable"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" && mp_status.machine_status.state == "tension_control");

        console.log(`Запуск сценария подъема на ${MD_MAX_STEP} ступеней`);
        await this.ext_config.md.getByAPI_post("exec_scenario", { name: `liftup ${MD_MAX_STEP} step`, commands: [...Array(MD_MAX_STEP).fill(0).map(() => "liftUpFrame")] });

        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            md_status.state == "available" && md_status.machine_status.state == "on_pins_support" &&
            md_status.machine_status.level == MD_MAX_STEP);

        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "tension", commands: ["tensionDisable"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" && mp_status.machine_status.state == "bottom");
      },
      async onBeforeStartMountCycle(lifecycle, p) {
        if (lifecycle.transition === "goto") return true;
        if (p.pos >= COLUMN_COUNT || p.pos < 0)
          throw new Error(`onBeforeStartMountCycle | column position has invalid value: ${p.pos} (0-3)`)
        const mounted_col_list = this.current_level.filter(el => el.type == "column").map(col => col.address.pos)
        if (mounted_col_list.find(m => m == p.pos) != undefined)
          throw new Error(`onBeforeStartMountCycle | Column already mounted | ${p.pos} in ${mounted_col_list}`)
        this.current_element = { type: "column", address: p };
      },
      async onLeaveLiftingCassetteColumn(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "lift cassete up", commands: ["moveUp"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "top")
      },
      async onBeforeHoldColumn(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "top")

      },
      async onLeaveColumnInCassetteOnLevel(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // сценарий захвата колонны
        // await окончания захвата монтажником

        await this.ext_config.mm.getByAPI_post("exec_scenario", {
          name: "hold_column",
          commands: [
            `setColumnAdress({"pos": ${this.current_element.address.pos}})`,
            "next"
          ]
        });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mm.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MM" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "p20");
      },

      async onBeforeMountColumnInPlace(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await checkCondition(() => this.ext_config.mm.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MM" &&
            md_status.state == "available" &&
            md_status.machine_status.state == "p20");
      },

      async onLeaveColumnHolded(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // отправляем кассету вниз
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "lift cassete down", commands: ["moveDown"] });
        // монтажник продолжает установку колонны
        await this.ext_config.mm.getByAPI_post("exec_scenario", {
          name: "moun column",
          commands: [
            "next", "next", "next", "next", "next",
          ]
        });
      },

      async onLeaveColumnMounting(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // Выходим из состояния установки колонны только по завершении работы обеих машин
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mm.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MM" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "standby");

        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "bottom");

        this.current_level.push(this.current_element);
      },
      async onBeforePrepareToHorizontal(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        const mounted_col_list = this.current_level.filter(el => el.type == "column").map(col => col.address.pos);
        if (mounted_col_list.length != COLUMN_COUNT)
          throw new Error(`onBeforePrepareToHorizontal | column mounting does not complete ${mounted_col_list}`);
      },
      async onLeaveHorizontalPrepareing1(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // подъемник переходит в состояние поддержки натяжения
        // в нашем случае стоит на полу. Олег говорит, что так он тоже может
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "tension", commands: ["tensionEnable"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" && mp_status.machine_status.state == "tension_control"
        );


      },
      async onLeaveHorizontalPrepareing2(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // домкрат переходит в состояние частичной нагрузки колонн
        await checkCondition(() => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            // md_status.machine_status.level == 0 &&
            md_status.state == "available" &&
            md_status.machine_status.state == "on_pins_support");

        await this.ext_config.md.getByAPI_post("exec_scenario",
          { name: "hold columns", commands: ["prepareToLinkMounting"] });

        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            md_status.state == "available" &&
            md_status.machine_status.state == "ready_to_link_mounting");
      },
      async onLeaveHorizontalPrepareing3(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // парковка подъемника
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "tension", commands: ["tensionDisable"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" && mp_status.machine_status.state == "bottom"
        );
      },
      async onMoveHorizontal(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        console.log("Horizontal positioning is not allowed")
      },
      async onBeforeStartMountLinksCycle(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level.filter(el => el.type == "link").length >= LINK_COUNT)
          throw new Error(`onBeforeStartMountLinksCycle | Every Link already mounted`)
      },
      async onLeaveLiftingCassetteLinks(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // подъем кассеты со связями на этаж
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "lift cassete up", commands: ["moveUp"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "top")
      },

      async onBeforeMountLinkByAddress(lifecycle, p) {
        if (lifecycle.transition === "goto") return true;
        await checkCondition(() => this.ext_config.mm.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MM" &&
            md_status.state == "available" &&
            (md_status.machine_status.state == "standby" || md_status.machine_status.state == "ready_to_mount"));

        if (p.pos >= LINK_COUNT || p.pos < 0 || p.cassete >= 6 || p.cassete < 0)
          throw new Error(`onMountLinkByAddress | Link addres has invalid value: pos - ${p.pos} (0-${LINK_COUNT - 1}), cas - ${p.cassete} (0-6)`)
        const mounted_link_list = this.current_level.filter(el => el.type == "link").map(l => l.address.pos)
        if (mounted_link_list.find(l => l == p.pos) != undefined)
          throw new Error(`onMountLinkByAddress | Link already mounted | ${p.pos} in ${mounted_link_list}`)
        this.current_element = { type: "link", address: p };
      },
      async onAfterMountLinkByAddress(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_element.type != "link")
          throw new Error(`onAfterMountLinkByAddress | current element is not a link`);
        await this.ext_config.mm.getByAPI_post("exec_scenario", {
          name: `moun link "cassete": ${this.current_element.address.cassete}, "pos": ${this.current_element.address.pos}}`,
          commands: [
            `setAddres({"cassete": ${this.current_element.address.cassete}, "pos": ${this.current_element.address.pos}})`,
            "p200Start",
            "p300Start",
            "p500Start",
            "p600Start",
            "p700Start",
            "p800Start",
          ]
        });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mm.getByAPI_get("controller_status"),
          mm_status =>
            mm_status.machine_status.type == "MM" &&
            mm_status.state == "available" &&
            mm_status.machine_status.state == "standby");

        this.current_level.push(this.current_element);
      },
      async onBeforeCassteReleaseDown(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await checkCondition(() => this.ext_config.mm.getByAPI_get("controller_status"),
          mm_status =>
            mm_status.machine_status.type == "MM" &&
            mm_status.state == "available" &&
            mm_status.machine_status.state == "standby");
      },
      async onLeaveMpParking(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        // спускаем кассету вниз

        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "lift cassete down", commands: ["moveDown"] });
        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "bottom");
      },
      async onBeforeParkMD(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        const mounted_links = this.current_level.filter(el => el.type == "link");
        if (mounted_links.length < LINK_COUNT)
          throw new Error(`onBeforeParkMD | Some Link did not mounted: ${mounted_links.map(p => p)}`)

        await checkCondition(() => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            // md_status.machine_status.level == 0 &&
            md_status.state == "available" &&
            md_status.machine_status.state == "ready_to_link_mounting");
      },
      async onLeaveMdParking(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        await this.ext_config.md.getByAPI_post("exec_scenario",
          {
            name: "park md", commands: [
              "releaseFrame",
              "holdFrame",
              "liftUpFrame",
              "prepareToLiftingBottomFrame",
              "pushinCrab",
              ...Array(MD_MAX_STEP).fill(0).map(() => "liftUpBottomFrame"),
              "pushoutCrab",
              "landBottomFrameToPins",
            ]
          });

        await waitForConditionTerminated(this.abort_controller.signal, () => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            md_status.state == "available" && md_status.machine_status.state == "on_pins_support" &&
            md_status.machine_status.level == 0);

      },
      async onInit(lifecycle) {
        if (lifecycle.transition === "goto") return true;
        this.current_level = []

      }
    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
// Stick_adress
// Stick_socket
