import * as fs from "fs";
import { WatchDirectoryFlags } from "typescript";
import { ExtractByType, MachineStatus, MM_address } from "~shared/types/types";
import {
  iFsmConfig,
  GraphOfStates,
  iData,
  iMethods,
  ExcludeTypeProp,
  iCycleExecutorProps,
  iStateMachine,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";

import { graph } from "./transitions";


type P200_Conf = {
  skip: number[];
};

type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MP"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MP">, "type">
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
const init: string = "bottom";

function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MP">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MP">, "type"> & OnMethods;
  } = {
    init: init,
    transitions: graph.transitions,
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
      onMoveUp: async function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        return new Promise((resolve) => {

          const run = () => {
            if (this_t.length < 20) {
              setTimeout(run, 300);
              this_t.length += 1;
            } else
              resolve();
          }
          run();
        })
      },
      onMoveDown: async function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        return new Promise((resolve) => {

          const run = () => {
            if (this_t.length > 1) {
              setTimeout(run, 300);
              this_t.length -= 1;
            } else
              resolve();
          }
          run();
        })
      },

      onBeforeMoveDown: async function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        const FC1_State = (await this_t.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (FC1_State != 1) {
          throw new Error("onBeforeMoveDown | FC1_State != 1");
        }
        await this_t.plc.writeVar({ FC1_State: 5 });
        await this_t.plc.waitForPlcVar("FC1_State", 5);
      },
      onBeforeMoveUp: async function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        const FC1_State = (await this_t.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (FC1_State != 1) {
          throw new Error("onBeforeMoveDown | FC1_State != 1");
        }
        await this_t.plc.writeVar({ FC1_State: 2 });
        await this_t.plc.waitForPlcVar("FC1_State", 2);
      },
      onLeaveLiftingDown: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        const FC1_State = (await this_t.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (lifecycle.transition === "step") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 5, 1")

          await this_t.plc.writeVar({ FC1_State: 5 });
          await this_t.plc.waitForPlcVar("FC1_State", 5);
          const result = await this_t.plc.waitForPlcVarByArray("FC1_State", [1, 8]);
          if (result == 8)
            throw new Error("onLeaveLiftingDown | internal plc error");
        } else if (lifecycle.transition === "moveUpEXTRA") {
          if (FC1_State != 2 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 2, 1")

          await this_t.plc.writeVar({ FC1_State: 2 });
          await this_t.plc.waitForPlcVar("FC1_State", 2);
        }

      },
      onLeaveLiftingUp: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        const FC1_State = (await this_t.plc.readVarToObj(["FC1_State"]))["FC1_State"];
        console.log(`onLeaveLiftingUp | FC1_State: ${FC1_State}`);
        if (lifecycle.transition === "step") {
          if (FC1_State != 2 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingUp | FC1_State != 2, 1");

          await this_t.plc.writeVar({ FC1_State: 2 });
          await this_t.plc.waitForPlcVar("FC1_State", 2);

          const result = await this_t.plc.waitForPlcVarByArray("FC1_State", [1, 8]);
          if (result == 8)
            throw new Error("onLeaveLiftingUp | internal plc error");
        } else if (lifecycle.transition === "moveDownEXTRA") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingUp | FC1_State != 5, 1");

          await this_t.plc.writeVar({ FC1_State: 5 });
          await this_t.plc.waitForPlcVar("FC1_State", 5);
        }

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
