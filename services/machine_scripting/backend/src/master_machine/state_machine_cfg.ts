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
// import fetch from "node-fetch";
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
async function checkCondition<T>(req: () => Promise<T>, cond: (resp: T) => boolean) {
  const resp = await req();
  if (!cond(resp))
    throw new Error("checkCondition | condition is false");
}

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
      onAfterTransition: function (lifecycle) {
        return true;
      },
      async onBeforeLiftUpOneLevel(lifecycle) {
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
        await this.onBeforeLiftUpOneLevel(lifecycle);

        console.log("Запуск сценария поъема на 3 ступеней");
        await this.ext_config.md.getByAPI_post("exec_scenario", { name: "liftup 3 step", commands: ["liftUpFrame", "liftUpFrame", "liftUpFrame"] });

        await waitForCondition(() => this.ext_config.md.getByAPI_get("controller_status"),
          md_status =>
            md_status.machine_status.type == "MD" &&
            md_status.state == "available" && md_status.machine_status.state == "on_pins_support" &&
            md_status.machine_status.level == 3);
      },
      async onLeaveLiftingCassetteColumn() {
        await this.ext_config.mp.getByAPI_post("exec_scenario", { name: "lift cassete", commands: ["moveUp"] });
        await waitForCondition(() => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "top")
      },
      async onBeforeHoldColumn() {
        await waitForCondition(() => this.ext_config.mp.getByAPI_get("controller_status"),
          mp_status =>
            mp_status.machine_status.type == "MP" &&
            mp_status.state == "available" &&
            mp_status.machine_status.state == "top")

      },
      async onLeaveColumnInCassetteOnLevel() {
        // сценарий захвата колонны
        // await окончания захвата монтажником
      },


    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
// Stick_adress
// Stick_socket
