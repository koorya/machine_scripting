import { graph, States, Transitions } from "./transitions";
import { MachineStatus } from "~shared/types/types";
import {
  iFsmConfig,
  iData,
  iCycleExecutorProps,
  FSMMethods,
  LifeCycle,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { ExtractByType } from "~shared/types/utils";


async function executeProgram(abort_signal: AbortSignal, plc_connector: IPlcConnector, cycle_name: string, lifecycle: LifeCycle, cycle_state: number) {

  console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
  const var_obj = {};
  var_obj[`${cycle_name}_state`] = 0;
  var_obj[`start_${cycle_name}_handle`] = true;
  await plc_connector.writeVar(var_obj);

  // plc_fsm.fsm.cycle_state
  // plc_fsm.fsm.status_message
  // требуется обновлять значения внутри объета, который эту функцию использует


  await new Promise<void>((resolve, reject) => {
    const run = async () => {
      const plc_variables = await plc_connector.readVarToObj([
        `${cycle_name}_state`,
      ]);
      cycle_state = plc_variables[`${cycle_name}_state`];
      if (cycle_state == 98 || abort_signal.aborted) {
        console.log("ошибка при исполнении цикла " + lifecycle.from);
        reject();
        return;
      }
      if (cycle_state != 99) {
        setTimeout(run, 100);
        return;
      }
      console.log("подождали пока манипулятор исполнит цикл " + lifecycle.from);
      resolve();
    }
    run();
  })

};


function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MD">;
    methods: FSMMethods<"MD", States, Transitions>;
  } = {
    init: graph.init,
    transitions: graph.transitions,
    data: {
      type: "MD",
      init: graph.init,
      current_level: 0,
      top_level: 5,
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
      abort_controller: new AbortController(),
    },
    methods: {
      getMachineStatus: function () {
        const machine_status: Extract<MachineStatus, { type: "MD" }> = {
          type: this.type,
          state: this.state,
          cycle_step: this.cycle_state,
          level: this.current_level,
        };
        return machine_status;
      },

      onBeforeLiftUpFrame: function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level >= this.top_level) return false;
        return true;
      },
      onBeforeLiftDownFrame: function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level <= 0) return false;
        return true;
      },
      onLeaveLiftingUpFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "up_frame_cycle",
            lifecycle,
            this.cycle_state,
          )

        this.current_level += 1;

      },

      onLeaveLiftingDownFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "down_frame_cycle",
            lifecycle,
            this.cycle_state,
          );

        this.current_level -= 1;
      },

      onLeaveHoldingFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "init_to_hold",
            lifecycle,
            this.cycle_state,
          );
      },

      onLeavePrepareingToLiftingBottomFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "from_hold_to_lift_crab",
            lifecycle,
            this.cycle_state,
          );
      },

      onLeavePrepareingToTopFrameMoveingVertical: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "from_hold_to_init",
            lifecycle,
            this.cycle_state,
          );
      },

      onLeaveLandingBottomFrameToPins: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "from_upcrcyc_to_init",
            lifecycle,
            this.cycle_state,
          );
      },
      onLeavePushingInCrabCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "pushin_crab",
            lifecycle,
            this.cycle_state,
          );
      },
      onLeavePushingOutCrabCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "pushout_crab",
            lifecycle,
            this.cycle_state,
          );
      },

      onBeforeLiftUpBottomFrame: function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level <= 0) return false;
        return true;
      },
      onBeforeLiftDownBottomFrame: function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level >= this.top_level) return false;
        return true;
      },

      onLeaveLiftingUpBottomFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "up_crab_cycle",
            lifecycle,
            this.cycle_state,
          );
        this.current_level -= 1;
      },
      onLeaveLiftingDownBottomFrameCycle: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "down_crab_cycle",
            lifecycle,
            this.cycle_state,
          );
        this.current_level += 1;
      },
      onLeaveLiftUpFrameByPressure: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "lift_up_frame_by_pressure",
            lifecycle,
            this.cycle_state,
          );
      },
      onLeaveLinkMountingToInit: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram(
            this.abort_controller.signal,
            this.plc,
            "link_mounting_to_init",
            lifecycle,
            this.cycle_state,
          );
      },
      onBeforeTransition: async function (lifecycle) {
        this.abort_controller = new AbortController();
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
