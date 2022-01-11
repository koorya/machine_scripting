import { ExtractByType } from "~shared/types/types";
import {
  iFsmConfig,
  iData,
  iMethods,
  ExcludeTypeProp,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { graph, States, Transitions } from "./transitions";
import { OnMethods } from "~shared/types/utils"


function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MASTER">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MASTER">, "type"> & OnMethods<"MASTER", States, Transitions>;
  } = {
    init: graph.init,
    transitions: graph.transitions,
    data: {
      type: "MASTER",
      init: graph.init,
      is_test: false,
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
