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
        };
      },
      onLeaveState: async function () {
        // console.log(this.ext_config);
      },
      onAfterTransition: function (lifecycle) {
        return true;
      },
      async onBeforeLiftUpOneLevel(lifecycle) {
        const md_status = await this.ext_config.md.getByAPI_get("controller_status");
        if (md_status.state != "available" || md_status.machine_status.state != "on_pins_support")
          throw new Error("onBeforeLiftUpOneLevel | MD in incorrect state")

      },
      async onLeaveLiftingOneLevel(lifecycle) {
        const md_status = await this.ext_config.md.getByAPI_get("controller_status");
        if (md_status.state != "available" || md_status.machine_status.state != "on_pins_support")
          throw new Error("onBeforeLiftUpOneLevel | MD in incorrect state")
        console.log("Запуск сценария поъема на 3 ступеней");
        await this.ext_config.md.getByAPI_post("exec_scenario", { name: "liftup 3 step", commands: ["liftUpFrame", "liftUpFrame", "liftUpFrame"] });

        await new Promise<void>((resolve, reject) => {
          const run = async () => {
            const md_status = await this.ext_config.md.getByAPI_get("controller_status");
            if (md_status.machine_status.type != "MD")
              return;

            if (md_status.state == "available" && md_status.machine_status.state == "on_pins_support"
              && md_status.machine_status.level == 3
            ) {
              console.log('level 3');
              resolve();
            } else {
              setTimeout(run, 1000);
            }
          }
          run();
        })
      }
    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
// Stick_adress
// Stick_socket
