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
        await this.plc.waitForPlcVar("FC1_State", 5, this.abort_controller.signal);
      },
      onBeforeMoveUp: async function () {
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (FC1_State != 1) {
          throw new Error("onBeforeMoveDown | FC1_State != 1");
        }
        await this.plc.writeVar({ FC1_State: 2 });
        await this.plc.waitForPlcVar("FC1_State", 2, this.abort_controller.signal);
      },
      onLeaveLiftingDown: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        const FC1_State = (await this.plc.readVarToObj(["FC1_State"]))["FC1_State"]
        if (lifecycle.transition === "step") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 5, 1")

          await this.plc.writeVar({ FC1_State: 5 });
          await this.plc.waitForPlcVar("FC1_State", 5, this.abort_controller.signal);
          const result = await this.plc.waitForPlcVarByArray("FC1_State", [1, 8], this.abort_controller.signal);
          if (result == 8)
            throw new Error("onLeaveLiftingDown | internal plc error");
        } else if (lifecycle.transition === "moveUpEXTRA") {
          if (FC1_State != 2 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingDown | FC1_State != 2, 1")

          await this.plc.writeVar({ FC1_State: 2 });
          await this.plc.waitForPlcVar("FC1_State", 2, this.abort_controller.signal);
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
          await this.plc.waitForPlcVar("FC1_State", 2, this.abort_controller.signal);

          const result = await this.plc.waitForPlcVarByArray("FC1_State", [1, 8], this.abort_controller.signal);
          if (result == 8)
            throw new Error("onLeaveLiftingUp | internal plc error");
        } else if (lifecycle.transition === "moveDownEXTRA") {
          if (FC1_State != 5 &&
            FC1_State != 1)
            throw new Error("onLeaveLiftingUp | FC1_State != 5, 1");

          await this.plc.writeVar({ FC1_State: 5 });
          await this.plc.waitForPlcVar("FC1_State", 5, this.abort_controller.signal);
        }

      },
      async onTensionControl() {
        await this.plc.writeVar({ SVU_MD_ViewWork: true });
        await this.plc.waitForPlcVar("SVU_MD_ViewWork", true, this.abort_controller.signal);

      },
      async onLeaveTensionControl() {
        await this.plc.writeVar({ SVU_MD_ViewWork: false });
        await this.plc.waitForPlcVar("SVU_MD_ViewWork", false, this.abort_controller.signal);
      },
      AbortSignalListener() {
        this.plc.writeVarByName("emergency_stop", true);
      },
      onBeforeTransition: async function (lifecycle) {
        this.abort_controller = new AbortController();
        this.abort_controller.signal.addEventListener("abort", () => this.AbortSignalListener());
        return true;
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
