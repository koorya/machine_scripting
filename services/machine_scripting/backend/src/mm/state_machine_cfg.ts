import * as fs from "fs";
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
    onBeforeMount: async function (lifecycle) {
      if (this.is_test) return true;

      console.log("!!! P200 STARTED !!!");
      await plc.writeVar({
        "P200[0].Start": true,
      });
      return true;
    },
    onLeaveMountingSt1: async function () {
      if (this.is_test) return true;
      return new Promise((resolve, reject) => {
        let mon: NodeJS.Timeout;
        const run = async () => {
          const plc_variables = await plc.readVarToObj([`P500[0].Done`]);
          if (plc_variables[`P500[0].Done`] != true) mon = setTimeout(run, 200);
          else resolve();
        };
        run();
      });
    },
    onBeforeCamOk: async function () {
      if (this.is_test) return true;
      await plc.writeVar({
        "P600[0].Start": true,
      });
      return true;
    },
    onLeaveMountingSt2: async function () {
      if (this.is_test) return true;
      return new Promise((resolve, reject) => {
        let mon: NodeJS.Timeout;
        const run = async () => {
          const plc_variables = await plc.readVarToObj([`P800[0].Done`]);
          if (plc_variables[`P800[0].Done`] != true) mon = setTimeout(run, 200);
          else resolve();
        };
        run();
      });
    },
    onAfterTransition: function (lifecycle) {
      return true;
    },
  },
};
export { fsm_config, transitions };
// Stick_adress
// Stick_socket
