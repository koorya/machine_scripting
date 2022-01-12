import { graph, States, Transitions } from "./transitions";
import { MachineStatus } from "~shared/types/types";
import {
  iFsmConfig,
  iData,
  iCycleExecutorProps,
  LifeCycle,
  FSMMethods,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { ExtractByType } from "~shared/types/utils";


async function executeProgram({ cycle_name, lifecycle, plc_connector, data }: Omit<Extract<iCycleExecutorProps, { type: "MD" }>, "type">) {

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
        "status_message",
      ]);
      data.cycle_state = plc_variables[`${cycle_name}_state`];
      data.status_message = plc_variables["status_message"];

      if (data.cycle_state == 98) {
        console.log("ошибка при исполнении цикла " + lifecycle.from);
        reject();
        return;
      }
      if (data.cycle_state != 99) {
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
      top_level: 4,
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
    },
    methods: {
      getMachineStatus: function () {
        const machine_status: Extract<MachineStatus, { type: "MD" }> = {
          type: this.type,
          state: this.state,
          cycle_step: this.cycle_state,
          status_message: this.status_message,
          level: this.current_level,
        };
        return machine_status;
      },

      onBeforeLiftUpFrame: function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level >= this.top_level) return false;
        return true;
      },
      onBeforeLiftDownFrame: function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level <= 0) return false;
        return true;
      },
      onLeaveLiftingUpFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "up_frame_cycle",
            lifecycle: lifecycle,
            data: this,
          })

        this.current_level += 1;

      },

      onLeaveLiftingDownFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "down_frame_cycle",
            lifecycle: lifecycle,
            data: this,
          });

        this.current_level -= 1;
      },

      onLeaveHoldingFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "init_to_hold",
            lifecycle: lifecycle,
            data: this,
          });
      },

      onLeavePrepareingToLiftingBottomFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "from_hold_to_lift_crab",
            lifecycle: lifecycle,
            data: this,
          });
      },

      onLeavePrepareingToTopFrameMoveingVertical: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "from_hold_to_init",
            lifecycle: lifecycle,
            data: this,
          });
      },

      onLeaveLandingBottomFrameToPins: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "from_upcrcyc_to_init",
            lifecycle: lifecycle,
            data: this,
          });
      },
      onLeavePushingInCrabCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "pushin_crab",
            lifecycle: lifecycle,
            data: this,
          });
      },
      onLeavePushingOutCrabCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "pushout_crab",
            lifecycle: lifecycle,
            data: this,
          });
      },

      onBeforeLiftUpBottomFrame: function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level <= 0) return false;
        return true;
      },
      onBeforeLiftDownBottomFrame: function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.current_level >= this.top_level) return false;
        return true;
      },

      onLeaveLiftingUpBottomFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "up_crab_cycle",
            lifecycle: lifecycle,
            data: this,
          });
        this.current_level -= 1;
      },
      onLeaveLiftingDownBottomFrameCycle: async function (lifecycle: LifeCycle) {
        if (lifecycle.transition === "goto") return true;
        if (!this.is_test)
          await executeProgram({
            plc_connector: this.plc,
            cycle_name: "down_crab_cycle",
            lifecycle: lifecycle,
            data: this,
          });
        this.current_level += 1;
      },
      onAfterTransition: function (lifecycle) {
        return true;
      },
    },
  };

  return fsm_config;
}
export { createFSMConfig, graph };
