import { MachineStatus, MM_address } from "~shared/types/types";
import { ExtractByType } from "~shared/types/utils";
import {
  iFsmConfig,
  iData,
  iCycleExecutorProps,
  FSMMethods,
} from "../fsm_types";
import { IPlcConnector } from "../zmq_network";
import { checkCam } from "./check_cam";
import { graph, States, Transitions } from "./transitions";


type P_Conf = {
  skip: number[];
};

async function executeProgram(abort_signal: AbortSignal, cycle_name: string, config: P_Conf, plc_connector: IPlcConnector) {

  await plc_connector.writeVarByName(`${cycle_name}[0].Reset`, true);
  await plc_connector.waitForPlcVar(`${cycle_name}[0].Reset`, false, abort_signal);

  const plc_vars = {};
  for (var step_number of config.skip) {
    plc_vars[`${cycle_name}[${step_number}].Skip`] = true;
  }
  await plc_connector.writeVar(plc_vars);

  console.log(`!!! ${cycle_name} STARTED !!!`);
  await plc_connector.writeVarByName(`${cycle_name}[0].Start`, true);
}


function createFSMConfig(plc: IPlcConnector) {
  const fsm_config: iFsmConfig & {
    data: ExtractByType<iData, "MM">;
    methods: FSMMethods<"MM", States, Transitions>;
  } = {
    init: graph.init,
    transitions: graph.transitions,
    data: {
      type: "MM",
      init: graph.init,
      address: {
        link: { cassete: 0, pos: 0 },
        column: { pos: 0 },
      },
      cycle_state: 0,
      status_message: "no",
      plc: plc,
      is_test: false,
      abort_controller: new AbortController(),

    },
    methods: {
      getMachineStatus: function () {
        const machine_status: Extract<MachineStatus, { type: "MM" }> = {
          type: this.type,
          state: this.state,
          cycle_step: this.cycle_state,
          address: this.address,
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
      onBeforeSetAddres: async function (lifecycle, address) {
        if (!this.isAddressValid(address)) throw new Error("Link address invalid");

        if (this.is_test) return true;
        console.log(address);
        await this.plc.writeVar({
          Stick_adress: address.pos,
          Stick_socket: address.cassete,
        });

        return new Promise<boolean>((resolve, reject) => {
          const mon = async () => {
            const plc_vars = (await this.plc.readVarToObj([
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
              this.address.link = address;
              resolve(true);
            } else reject();
          };
          setTimeout(mon, 100);
        });
      },
      async onBeforeSetColumnAdress(lifecycle, column_address) {
        if (column_address.pos > 4) throw new Error("Link address invalid");

        this.address.column = column_address;
        if (this.is_test) return true;

        await this.plc.writeVar({
          Column_adress: column_address.pos
        });

        return new Promise<boolean>((resolve, reject) => {
          const mon = async () => {
            const plc_vars = (await this.plc.readVarToObj([
              "Column_adress"
            ])) as {
              Column_adress: number;
            };
            console.log(plc_vars);
            if (
              plc_vars.Column_adress == column_address.pos
            ) {
              resolve(true);
            } else reject();
          };
          setTimeout(mon, 100);
        });

      },
      onAfterP200Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P200", config, this.plc);
        return true;
      },
      onLeaveP200: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P200[0].Done", true, this.abort_controller.signal);
        await this.plc.writeVar({ "P200[0].Reset": true });
        return true;
      },

      onAfterP300Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P300", config, this.plc);
        return true;
      },
      onLeaveP300: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P300[0].Done", true, this.abort_controller.signal);
        await this.plc.writeVar({ "P300[0].Reset": true });
        return true;
      },

      onAfterP500Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P500", config, this.plc);
        return true;
      },
      onLeaveP500: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P500[0].Done", true, this.abort_controller.signal);
        await this.plc.writeVar({ "P500[0].Reset": true });
        return true;
      },

      onBeforeP600Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P600", config, this.plc);
        return true;
      },

      // can cancel only in
      // 
      // onBeforeTransition
      // onBefore<TRANSITION>
      // onLeaveState
      // onLeave<STATE>
      // onTransition

      async onBeforeNext(lifecycle, config: P_Conf = { skip: [] }) {
        if (this.is_test) return true;
        const execProgram = async (p_name: string) => {
          await executeProgram(this.abort_controller.signal, p_name, config, this.plc);
          await this.plc.waitForPlcVar(`${p_name}[0].Done`, true, this.abort_controller.signal);
          await this.plc.writeVarByName(`${p_name}[0].Reset`, true);
        };
        await execProgram(lifecycle.to.toUpperCase());
      },

      onLeaveP600Near: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P600[7].Run", true, this.abort_controller.signal);

        const check_cam = await checkCam();
        if (!check_cam) throw new Error("I want to cancel leaving p600near");

        await this.plc.writeVar({ CHECK_CAMERA: true });
        return true;
      },

      onLeaveP600Far: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        console.log("waitForPlcVar(P600[8].Run)")
        await this.plc.waitForPlcVar("P600[8].Run", true, this.abort_controller.signal);

        const check_cam = await checkCam();
        if (!check_cam) throw new Error("I want to cancel leaving p600far");

        await this.plc.writeVar({ CHECK_CAMERA: true });
        return true;
      },
      onBeforeP600Finish: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P600[0].Done", true, this.abort_controller.signal);
      },

      onAfterP700Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P700", config, this.plc);
        return true;
      },
      onLeaveP700: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P700[0].Done", true, this.abort_controller.signal);
        await this.plc.writeVar({ "P700[0].Reset": true });
        return true;
      },

      onAfterP800Start: async function (
        lifecycle,
        config: P_Conf = { skip: [] }
      ) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await executeProgram(this.abort_controller.signal, "P800", config, this.plc);
        return true;
      },
      onLeaveP800: async function (lifecycle) {
        if (lifecycle.transition === "goto") return true;
        if (this.is_test) return true;
        await this.plc.waitForPlcVar("P800[0].Done", true, this.abort_controller.signal);
        await this.plc.writeVar({ "P800[0].Reset": true });
        return true;
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
