import { States, Transitions } from "./transitions";
import { MachineStatus } from "~shared/types/types";
import {
  iData,
  FSMMethods,
  iFsmConfig,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";

import { graph } from "./transitions";
import { ExtractByType } from "~shared/types/utils";


function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MP">;
    methods: FSMMethods<"MP", States, Transitions>;
  } = {
    init: graph.init,
    transitions: graph.transitions,
    data: {
      type: "MP",
      init: graph.init,
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
        const machine_status: Extract<MachineStatus, { type: "MP" }> = {
          type: this.type,
          state: this.state,
          cycle_step: this.cycle_state,
          lenght: this.length,
        };
        return machine_status;
      },
      onMoveUp: async function () {
        return new Promise((resolve) => {

          const run = () => {
            if (this.length < 20) {
              setTimeout(run, 300);
              this.length += 1;
            } else
              resolve();
          }
          run();
        })
      },
      onMoveDown: async function () {
        return new Promise((resolve) => {

          const run = () => {
            if (this.length > 1) {
              setTimeout(run, 300);
              this.length -= 1;
            } else
              resolve();
          }
          run();
        })
      },

      onBeforeMoveDown: async function () {
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (FC1_State != 1) {
          throw new Error("onBeforeMoveDown | FC1_State != 1");
        }
        await this.plc.writeVar({ FC1_State: 5 });
        await this.plc.waitForPlcVar("FC1_State", 5);
      },
      onBeforeMoveUp: async function () {
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (FC1_State != 1) {
          throw new Error("onBeforeMoveDown | FC1_State != 1");
        }
        await this.plc.writeVar({ FC1_State: 2 });
        await this.plc.waitForPlcVar("FC1_State", 2);
      },
      onLeaveLiftingDown: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (lifecycle.transition === "step") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 5, 1")

          await this.plc.writeVar({ FC1_State: 5 });
          await this.plc.waitForPlcVar("FC1_State", 5);
          const result = await this.plc.waitForPlcVarByArray("FC1_State", [1, 8]);
          if (result == 8)
            throw new Error("onLeaveLiftingDown | internal plc error");
        } else if (lifecycle.transition === "moveUpEXTRA") {
          if (FC1_State != 2 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 2, 1")

          await this.plc.writeVar({ FC1_State: 2 });
          await this.plc.waitForPlcVar("FC1_State", 2);
        }

      },
      onLeaveLiftingUp: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"];
        console.log(`onLeaveLiftingUp | FC1_State: ${FC1_State}`);
        if (lifecycle.transition === "step") {
          if (FC1_State != 2 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingUp | FC1_State != 2, 1");

          await this.plc.writeVar({ FC1_State: 2 });
          await this.plc.waitForPlcVar("FC1_State", 2);

          const result = await this.plc.waitForPlcVarByArray("FC1_State", [1, 8]);
          if (result == 8)
            throw new Error("onLeaveLiftingUp | internal plc error");
        } else if (lifecycle.transition === "moveDownEXTRA") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingUp | FC1_State != 5, 1");

          await this.plc.writeVar({ FC1_State: 5 });
          await this.plc.waitForPlcVar("FC1_State", 5);
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
