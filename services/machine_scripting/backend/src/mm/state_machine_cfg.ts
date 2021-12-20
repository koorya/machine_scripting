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
  LifeCycle,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { checkCam } from "./check_cam";

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/mm/transitions.json").toString()
);
type P200_Conf = {
  skip: number[];
};

async function executeProgram(
  { cycle_name, config, plc_connector }: Omit<Extract<iCycleExecutorProps, { type: "MM" }>, "type">
) {

  await plc_connector.writeVarByName(`${cycle_name}[0].Reset`, true);
  await plc_connector.waitForPlcVar(`${cycle_name}[0].Reset`, false);

  const plc_vars = {};
  for (var step_number of config.skip) {
    plc_vars[`${cycle_name}[${step_number}].Skip`] = true;
  }
  await plc_connector.writeVar(plc_vars);

  console.log(`!!! ${cycle_name} STARTED !!!`);
  await plc_connector.writeVarByName(`${cycle_name}[0].Start`, true);
}
type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MM"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MM">, "type">
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

const init: string = "standby";

function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MM">;
    methods: ExcludeTypeProp<ExtractByType<iMethods, "MM">, "type"> & OnMethods;
  } = {
    init: init,
    transitions: transitions,
    data: {
      type: "MM",
      init: init,
      current_address: { cassete: 0, pos: 0 },
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
    },
    methods: {
      getMachineStatus: function () {
        const this_t: ThisType = (this as undefined) as ThisType;
        const machine_status: Extract<MachineStatus, { type: "MM" }> = {
          type: this_t.type,
          state: this_t.state,
          cycle_step: this_t.cycle_state,
          status_message: this_t.status_message,
          address: this_t.current_address,
        };
        return machine_status;
      },

      isAddressValid: function (address: MM_address) {
        console.log(`address validation: ${JSON.stringify(address, null, 2)}`);
        if (address != null) {
          return true;
        }
        console.log("not valid");
        return false;
      },
      onBeforeSetAddres: async function (lifecycle: LifeCycle, address: MM_address) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (!this_t.isAddressValid(address)) return false;

        if (this_t.is_test) return true;
        console.log(address);
        await this_t.plc.writeVar({
          Stick_adress: address.pos,
          Stick_socket: address.cassete,
        });

        return new Promise((resolve, reject) => {
          const mon = async () => {
            const plc_vars = (await this_t.plc.readVarToObj([
              "Stick_adress",
              "Stick_socket",
            ])) as {
              Stick_adress: number;
              Stick_socket: number;
            };
            console.log(plc_vars);
            if (
              plc_vars.Stick_adress == address.pos &&
              plc_vars.Stick_socket == address.cassete
            ) {
              this_t.current_address = address;
              resolve(true);
            } else reject();
          };
          setTimeout(mon, 100);
        });
      },

      onAfterP200Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P200", config: config, plc_connector: this_t.plc });
        return true;
      },
      onLeaveP200: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P200[0].Done", true);
        await this_t.plc.writeVar({ "P200[0].Reset": true });
        return true;
      },

      onAfterP300Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P300", config: config, plc_connector: this_t.plc });
        return true;
      },
      onLeaveP300: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P300[0].Done", true);
        await this_t.plc.writeVar({ "P300[0].Reset": true });
        return true;
      },

      onAfterP500Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P500", config: config, plc_connector: this_t.plc });
        return true;
      },
      onLeaveP500: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P500[0].Done", true);
        await this_t.plc.writeVar({ "P500[0].Reset": true });
        return true;
      },

      onBeforeP600Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P600", config: config, plc_connector: this_t.plc });
        return true;
      },

      // can cancel only in
      // 
      // onBeforeTransition
      // onBefore<TRANSITION>
      // onLeaveState
      // onLeave<STATE>
      // onTransition

      onLeaveP600Near: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P600[7].Run", true);

        const check_cam = await checkCam();
        if (!check_cam) throw new Error("I want to cancel leaving p600near");

        await this_t.plc.writeVar({ CHECK_CAMERA: true });
        return true;
      },

      onLeaveP600Far: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        console.log("waitForPlcVar(P600[8].Run)")
        await this_t.plc.waitForPlcVar("P600[8].Run", true);

        const check_cam = await checkCam();
        if (!check_cam) throw new Error("I want to cancel leaving p600far");

        await this_t.plc.writeVar({ CHECK_CAMERA: true });
        return true;
      },
      onBeforeP600Finish: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P600[0].Done", true);
      },

      onAfterP700Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P700", config: config, plc_connector: this_t.plc });
        return true;
      },
      onLeaveP700: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P700[0].Done", true);
        await this_t.plc.writeVar({ "P700[0].Reset": true });
        return true;
      },

      onAfterP800Start: async function (
        lifecycle: LifeCycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await executeProgram({ cycle_name: "P800", config: config, plc_connector: this_t.plc });
        return true;
      },
      onLeaveP800: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (lifecycle.transition === "goto") return true;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P800[0].Done", true);
        await this_t.plc.writeVar({ "P800[0].Reset": true });
        return true;
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
