import { ExtractByType } from "~shared/types/utils"
import {
  iFsmConfig,
  iData,
  FSMMethods,
  ExtConfig,
} from "../fsm_types";
import { graph, States, Transitions } from "./transitions";

function createFSMConfig(ext_config: Extract<ExtConfig, { type: "MASTER" }>["ext_config"]) {

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
      ext_config: ext_config,
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
      onLeaveState: function () {
        console.log(this.ext_config);
      },
      onAfterTransition: function (lifecycle) {
        return true;
      },
      onBeforeParkMD: function () {

      },
      onLeaveLiftingOneLevel: function (lifecycle) {
        return true;
      }
    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
// Stick_adress
// Stick_socket
