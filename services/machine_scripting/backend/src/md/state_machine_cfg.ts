import * as fs from "fs";
import { ExtractByType, MachineStatus } from "~shared/types/types";
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

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/md/transitions.json").toString()
);

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

type OnMethodsName = {
  onBeforeLiftUpFrame;
  onBeforeLiftDownFrame;
  onLeaveLiftingUpFrameCycle;
  onLeaveLiftingDownFrameCycle;
  onLeaveHoldingFrameCycle;
  onLeavePrepareingToLiftingBottomFrameCycle;
  onLeavePrepareingToTopFrameMoveingVertical;
  onLeaveLandingBottomFrameToPins;
  onLeavePushingInCrabCycle;
  onLeavePushingOutCrabCycle;
  onBeforeLiftUpBottomFrame;
  onBeforeLiftDownBottomFrame;
  onLeaveLiftingUpBottomFrameCycle;
  onLeaveLiftingDownBottomFrameCycle;
};
type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MD"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MD">, "type">
  & iStateMachine;

type OnMethods = {
  [key in keyof OnMethodsName]: (
    ...args: any
  ) => Promise<boolean | void> | void | boolean;
};
const init: string = "on_pins_support";

function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MD">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MD">, "type"> & OnMethods;
  } = {
    init: init,
    transitions: transitions,
    data: {
      type: "MD",
      init: init,
      current_level: 0,
      top_level: 4,
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
    },
    methods: {
      getMachineStatus: function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        const machine_status: Extract<MachineStatus, { type: "MD" }> = {
          type: this_t.type,
          state: this_t.state,
          cycle_step: this_t.cycle_state,
          status_message: this_t.status_message,
          level: this_t.current_level,
        };
        return machine_status;
      },

      onBeforeLiftUpFrame: function () {
        if (this.current_level >= this.top_level) return false;
        return true;
      },
      onBeforeLiftDownFrame: function () {
        if (this.current_level <= 0) return false;
        return true;
      },
      onLeaveLiftingUpFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "up_frame_cycle",
            lifecycle: lifecycle,
            data: this_t,
          })

        this.current_level += 1;

      },

      onLeaveLiftingDownFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "down_frame_cycle",
            lifecycle: lifecycle,
            data: this_t,
          });

        this.current_level -= 1;
      },

      onLeaveHoldingFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "init_to_hold",
            lifecycle: lifecycle,
            data: this_t,
          });
      },

      onLeavePrepareingToLiftingBottomFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "from_hold_to_lift_crab",
            lifecycle: lifecycle,
            data: this_t,
          });
      },

      onLeavePrepareingToTopFrameMoveingVertical: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "from_hold_to_init",
            lifecycle: lifecycle,
            data: this_t,
          });
      },

      onLeaveLandingBottomFrameToPins: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "from_upcrcyc_to_init",
            lifecycle: lifecycle,
            data: this_t,
          });
      },
      onLeavePushingInCrabCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "pushin_crab",
            lifecycle: lifecycle,
            data: this_t,
          });
      },
      onLeavePushingOutCrabCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "pushout_crab",
            lifecycle: lifecycle,
            data: this_t,
          });
      },

      onBeforeLiftUpBottomFrame: function () {
        if (this.current_level <= 0) return false;
        return true;
      },
      onBeforeLiftDownBottomFrame: function () {
        if (this.current_level >= this.top_level) return false;
        return true;
      },

      onLeaveLiftingUpBottomFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "up_crab_cycle",
            lifecycle: lifecycle,
            data: this_t,
          });
        this.current_level -= 1;
      },
      onLeaveLiftingDownBottomFrameCycle: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (!this_t.is_test)
          await executeProgram({
            plc_connector: this_t.plc,
            cycle_name: "down_crab_cycle",
            lifecycle: lifecycle,
            data: this_t,
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
export { createFSMConfig, transitions };
