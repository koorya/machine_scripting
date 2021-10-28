import * as fs from "fs";
import { WatchDirectoryFlags } from "typescript";
import { ExtractByType, MM_address } from "~shared/types/types";
import {
  iFsmConfig,
  iTransition,
  iData,
  iMethods,
  ExcludeTypeProp,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/mm/transitions.json").toString()
);
type P200_Conf = {
  skip: number[];
};

async function executeProgram(
  name: string,
  config: { skip: number[] },
  plc_connector: IPlcConnector
) {
  await plc_connector.writeVarByName(`${name}[0].Reset`, true);
  await plc_connector.waitForPlcVar(`${name}[0].Reset`, false);

  const plc_vars = {};
  for (var step_number of config.skip) {
    plc_vars[`${name}[${step_number}].Skip`] = true;
  }
  await plc_connector.writeVar(plc_vars);

  console.log(`!!! ${name} STARTED !!!`);
  await plc_connector.writeVarByName(`${name}[0].Start`, true);
}
type ThisType = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, "MM"> &
  ExcludeTypeProp<ExtractByType<iMethods, "MM">, "type">;
type OnMethodsName = {
  onAfterP200Start;
  onLeaveP200;
  onAfterP300Start;
  onLeaveP300;
  onAfterP500Start;
  onLeaveP500;
  onAfterP600Start;
  onLeaveP600Near;
  onLeaveP600Far;
  onAfterP700Start;
  onLeaveP700;
  onAfterP800Start;
  onLeaveP800;
  onBeforeP600Finish;
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
      cycleExecutor: function (props) {
        props.resolve();
      },
      isAddressValid: function (address: MM_address) {
        console.log(`address validation: ${JSON.stringify(address, null, 2)}`);
        if (address != null) {
          return true;
        }
        console.log("not valid");
        return false;
      },
      onBeforeSetAddres: async function (lifecycle, address: MM_address) {
        const this_t: ThisType = (this as undefined) as ThisType;

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
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P200", config, this_t.plc);
        return true;
      },
      onLeaveP200: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P200[0].Done", true);
        await this_t.plc.writeVar({ "P200[0].Reset": true });
        return true;
      },

      onAfterP300Start: async function (
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P300", config, this_t.plc);
        return true;
      },
      onLeaveP300: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P300[0].Done", true);
        await this_t.plc.writeVar({ "P300[0].Reset": true });
        return true;
      },

      onAfterP500Start: async function (
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P500", config, this_t.plc);
        return true;
      },
      onLeaveP500: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P500[0].Done", true);
        await this_t.plc.writeVar({ "P500[0].Reset": true });
        return true;
      },

      onAfterP600Start: async function (
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P600", config, this_t.plc);
        return true;
      },
      onLeaveP600Near: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P600[7].Run", true);
        var exec = require("child_process").exec;
        async function execute(command) {
          return new Promise((resolve, reject) => {
            exec(command, function (error, stdout, stderr) {
              resolve(stdout);
            });
          });
        }
        let ok = (await execute("npx ts-node ./src/is_cam_ok.ts")) as string;
        console.log("executed process");
        console.log(ok);
        if (!/^Ok/.exec(ok)) {
          console.log("Cam check failed");
          return false;
        }
        await this_t.plc.writeVar({ "CHECK_CAMERA": true });
        return true;
      },

      onLeaveP600Far: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P600[8].Run", true);
        var exec = require("child_process").exec;
        async function execute(command) {
          return new Promise((resolve, reject) => {
            exec(command, function (error, stdout, stderr) {
              resolve(stdout);
            });
          });
        }
        let ok = (await execute("npx ts-node ./src/is_cam_ok.ts")) as string;
        console.log("executed process");
        console.log(ok);
        if (!/^Ok/.exec(ok)) {
          console.log("Cam check failed");
          return false;
        }
        await this_t.plc.writeVar({ "CHECK_CAMERA": true });
        return true;
      },
      onBeforeP600Finish: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P600[0].Done", true);
      },
      // не срабатывает
      // onLeaveCamInspection: async function () {
      //   const this_t: ThisType = (this as undefined) as ThisType;
      //   if (this_t.is_test) return true;
      //   var exec = require("child_process").exec;
      //   async function execute(command) {
      //     return new Promise((resolve, reject) => {
      //       exec(command, function (error, stdout, stderr) {
      //         resolve(stdout);
      //       });
      //     });
      //   }
      //   let ok = (await execute("npx ts-node ./src/is_cam_ok.ts")) as string;
      //   console.log("executed process");
      //   console.log(ok);
      //   if (!/^Ok/.exec(ok)) {
      //     console.log("Cam check failed");
      //     return false;
      //   }
      //   return true;
      // },

      onAfterP700Start: async function (
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P700", config, this_t.plc);
        return true;
      },
      onLeaveP700: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await this_t.plc.waitForPlcVar("P700[0].Done", true);
        await this_t.plc.writeVar({ "P700[0].Reset": true });
        return true;
      },

      onAfterP800Start: async function (
        lifecycle,
        config: P200_Conf = { skip: [] }
      ) {
        const this_t: ThisType = (this as undefined) as ThisType;
        if (this_t.is_test) return true;
        await executeProgram("P800", config, this_t.plc);
        return true;
      },
      onLeaveP800: async function (lifecycle) {
        const this_t: ThisType = (this as undefined) as ThisType;
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
