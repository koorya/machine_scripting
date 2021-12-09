import * as fs from "fs";
import { WatchDirectoryFlags } from "typescript";
import { ExtractByType, MachineStatus, MM_address } from "~shared/types/types";
import {
  iFsmConfig,
  iTransition,
  iData,
  iMethods,
  ExcludeTypeProp,
  iCycleExecutorProps,
  iStateMachine,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";

const { transitions, init_state }: { transitions: iTransition[]; init_state: string } = JSON.parse(
  fs.readFileSync("src/mp/transitions.json").toString()
);
type P200_Conf = {
  skip: number[];
};

type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MP"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MP">, "type">
  & iStateMachine;

type OnMethodsName = {
  onLeaveLiftingDown;
  onLeaveLiftingUp;
};
type OnMethods = {
  [key in keyof OnMethodsName]: (
    ...args: any
  ) => Promise<boolean | void> | void | boolean;
};
const init: string = init_state;

function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MP">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MP">, "type"> & OnMethods;
  } = {
    init: init,
    transitions: transitions,
    data: {
      type: "MP",
      init: init,
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
      length: 0,
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
        const machine_status: Extract<MachineStatus, { type: "MP" }> = {
          type: this_t.type,
          state: this_t.state,
          cycle_step: this_t.cycle_state,
          status_message: this_t.status_message,
          lenght: this_t.length,
        };
        return machine_status;
      },
      onLeaveLiftingDown: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition == 'step')
          if (this_t.length < 30) {
            this_t.length += 1;
            throw new Error(`onLeaveLiftingDown | this_t.length: ${this_t.length} <30`);
          }
        // this_t.length = 0;
      },
      onLeaveLiftingUp: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition == 'step')
          if (this_t.length > 0) {
            this_t.length -= 1;
            throw new Error(`onLeaveLiftingUp | this_t.length: ${this_t.length} >0`);
          }
        // this_t.length = 0;
      },
      onAfterTransition: function (lifecycle) {
        return true;
      },
    },
  };

  return fsm_config;
}
export { createFSMConfig, transitions };
// Stick_adress
// Stick_socket
