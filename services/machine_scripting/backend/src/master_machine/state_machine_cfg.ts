import * as fs from "fs";
import { WatchDirectoryFlags } from "typescript";
import { ExtractByType, MachineStatus, MM_address } from "~shared/types/types";
import {
  iFsmConfig,
  iData,
  iMethods,
  ExcludeTypeProp,
  iCycleExecutorProps,
  iStateMachine,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { graph } from "./transitions";


type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MASTER"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MASTER">, "type">
  & iStateMachine;


type my_type = `on${string}`;
type OnMethodsName = {
  [key in my_type]
};
type OnMethods = {
  [key in keyof OnMethodsName]: (
    ...args: any
  ) => Promise<boolean | void> | void | boolean;
};
const init: string = "init";

function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MASTER">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MASTER">, "type"> & OnMethods;
  } = {
    init: init,
    transitions: graph.transitions,
    data: {
      type: "MASTER",
      init: init,
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
        const this_t: ThisType = (this as undefined) as ThisType;
        const machine_status: Extract<MachineStatus, { type: "MASTER" }> = {
          type: this_t.type,
          state: this_t.state,
          cycle_step: undefined,
          status_message: undefined,
        };
        return machine_status;
      },

      onAfterTransition: function (lifecycle) {
        return true;
      },
    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
// Stick_adress
// Stick_socket
