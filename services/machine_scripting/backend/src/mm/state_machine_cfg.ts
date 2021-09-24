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
import * as plc from "../zmq_network";

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/mm/transitions.json").toString()
);
type P200_Conf = {
  skip: number[];
};

async function executeProgram(name: string, config: { skip: number[] }) {
  await plc.writeVarByName(`${name}[0].Reset`, true);
  await plc.waitForPlcVar(`${name}[0].Reset`, false);

  const plc_vars = {};
  for (var step_number of config.skip) {
    plc_vars[`${name}[${step_number}].Skip`] = true;
  }
  await plc.writeVar(plc_vars);

  console.log(`!!! ${name} STARTED !!!`);
  await plc.writeVarByName(`${name}[0].Start`, true);
}

const init: string = "standby";
const fsm_config: iFsmConfig & {
  data: ExtractByType<iData, "MM">;
  methods: ExcludeTypeProp<ExtractByType<iMethods, "MM">, "type">;
} = {
  init: init,
  transitions: transitions,
  data: {
    type: "MM",
    init: init,
    current_address: { cassete: 0, pos: 0 },
    cycle_state: 0,
    status_message: "no",
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
      if (!this.isAddressValid(address)) return false;
      if (this.is_test) return true;
      console.log(address);
      await plc.writeVar({
        Stick_adress: address.pos,
        Stick_socket: address.cassete,
      });

      return new Promise((resolve, reject) => {
        const mon = async () => {
          const plc_vars = (await plc.readVarToObj([
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
            this.current_address = address;
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
      if (this.is_test) return true;
      await executeProgram("P200", config);
      return true;
    },
    onLeaveP200: async function (lifecycle) {
      if (this.is_test) return true;
      await plc.waitForPlcVar("P200[0].Done", true);
      await plc.writeVar({ "P200[0].Reset": true });
      return true;
    },

    onAfterP300Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P300", config);
      return true;
    },
    onLeaveP300: async function (lifecycle) {
      if (this.is_test) return true;

      await plc.waitForPlcVar("P300[0].Done", true);
      await plc.writeVar({ "P300[0].Reset": true });
      return true;
    },

    onAfterP400Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P400", config);
      return true;
    },
    onLeaveP400: async function (lifecycle) {
      if (this.is_test) return true;
      await plc.waitForPlcVar("P400[0].Done", true);
      await plc.writeVar({ "P400[0].Reset": true });
      return true;
    },

    onAfterP500Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P500", config);
      return true;
    },
    onLeaveP500: async function (lifecycle) {
      if (this.is_test) return true;
      await plc.waitForPlcVar("P500[0].Done", true);
      await plc.writeVar({ "P500[0].Reset": true });
      return true;
    },

    onAfterP600Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P600", config);
      return true;
    },
    onLeaveP600: async function (lifecycle) {
      if (this.is_test) return true;

      await plc.waitForPlcVar("P600[0].Done", true);
      await plc.writeVar({ "P600[0].Reset": true });
      return true;
    },

    onLeaveCamInspection: async function () {
      if (this.is_test) return true;
      var exec = require("child_process").exec;
      async function execute(command) {
        return new Promise((resolve, reject) => {
          exec(command, function (error, stdout, stderr) {
            resolve(stdout);
          });
        });
      }
      let ok = (await execute("node ./src/is_cam_ok.js")) as string;
      console.log("executed process");
      console.log(ok);
      if (!/^Ok/.exec(ok)) {
        console.log("Cam check failed");
        return false;
      }
      return true;
    },

    onAfterP700Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P700", config);
      return true;
    },
    onLeaveP700: async function (lifecycle) {
      if (this.is_test) return true;

      await plc.waitForPlcVar("P700[0].Done", true);
      await plc.writeVar({ "P700[0].Reset": true });
      return true;
    },

    onAfterP800Start: async function (
      lifecycle,
      config: P200_Conf = { skip: [] }
    ) {
      if (this.is_test) return true;
      await executeProgram("P800", config);
      return true;
    },
    onLeaveP800: async function (lifecycle) {
      if (this.is_test) return true;

      await plc.waitForPlcVar("P800[0].Done", true);
      await plc.writeVar({ "P800[0].Reset": true });
      return true;
    },

    onAfterTransition: function (lifecycle) {
      return true;
    },
  },
};
export { fsm_config, transitions };
// Stick_adress
// Stick_socket
