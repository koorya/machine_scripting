import * as zmq from "zeromq";


export const md_vault: { name: string; value: unknown }[] = [
  { name: "status_message", value: "no mess" },
  { name: "Y19", value: false },
  { name: "PP1", value: false },
  { name: "Y20", value: false },
  { name: "PP2", value: false },
  { name: "FC1_reset_error", value: false },
  { name: "BP3", value: false },
  { name: "PP4", value: false },
  { name: "Y22", value: false },
  { name: "BP4", value: false },
  { name: "Y21", value: false },
  { name: "PP3", value: false },
  { name: "FC2_reset_error", value: false },
  { name: "BP1", value: false },
  { name: "BP2", value: false },
  { name: "RK_STATE", value: false },
  { name: "HPV1_OK", value: false },
  { name: "HPV2_OK", value: false },
  { name: "HPV3_OK", value: false },
  { name: "HPV4_OK", value: false },
  { name: "K5", value: false },
  { name: "K1", value: false },
  { name: "K2", value: false },
  { name: "K3", value: false },
  { name: "K4", value: false },
  { name: "H2", value: false },
  { name: "H3", value: false },
  { name: "H4", value: false },
  { name: "H5", value: false },
  { name: "RK_V_plus", value: false },
  { name: "FC1_command", value: 0 },
  { name: "FC1_out_curr", value: 0 },
  { name: "FC1_freq", value: 0 },
  { name: "FC1_out_freq", value: 0 },
  { name: "FC2_command", value: 0 },
  { name: "FC2_out_curr", value: 0 },
  { name: "FC2_freq", value: 0 },
  { name: "FC2_out_freq", value: 0 },
  { name: "SQ1", value: false },
  { name: "SQ2", value: true },
  { name: "SQ3", value: false },
  { name: "SQ4", value: true },
  { name: "SQ5", value: false },
  { name: "SQ6", value: false },
  { name: "SQ7", value: false },
  { name: "SQ8", value: false },
  { name: "SQ9", value: false },
  { name: "SQ10", value: false },
  { name: "SQ11", value: false },
  { name: "SQ12", value: false },
  { name: "SQ13", value: false },
  { name: "SQ14", value: false },
  { name: "SQ15", value: false },
  { name: "SQ16", value: false },
  { name: "SQ17", value: false },
  { name: "SQ18", value: false },
  { name: "SQ19", value: false },
  { name: "SQ20", value: true },
  { name: "SQ21", value: false },
  { name: "SQ22", value: false },
  { name: "SQ23", value: false },
  { name: "SQ24", value: false },
  { name: "SQ25", value: false },
  { name: "SQ26", value: false },
  { name: "SQ27", value: false },
  { name: "SQ28", value: false },
  { name: "SQ29", value: false },
  { name: "SQ30", value: false },
  { name: "SQ31", value: false },
  { name: "SQ32", value: false },
  { name: "SQ33", value: false },
  { name: "SQ34", value: false },
  { name: "SQ35", value: false },
  { name: "SQ36", value: false },
  { name: "SQ37", value: false },
  { name: "SQ38", value: false },
  { name: "SQ39", value: false },
  { name: "SQ40", value: false },
  { name: "SQ41", value: false },
  { name: "SQ42", value: false },
  { name: "SQ43", value: false },
  { name: "SQ44", value: false },
  { name: "SQ45", value: false },
  { name: "SQ46", value: false },
  { name: "SQ47", value: false },
  { name: "SQ48", value: false },
  { name: "SQ50", value: false },
  { name: "SQ51", value: false },
  { name: "SP1", value: false },
  { name: "SP2", value: false },
  { name: "SP3", value: false },
  { name: "SP4", value: false },
  { name: "SP5", value: false },
  { name: "SP6", value: false },
  { name: "SP7", value: false },
  { name: "SP8", value: false },
  { name: "SP9", value: false },
  { name: "SP10", value: false },
  { name: "SP11", value: false },
  { name: "SP12", value: false },
  { name: "SL1", value: false },
  { name: "YPP1_Iref", value: 0 },
  { name: "YPP2_Iref", value: 0 },
  { name: "YPP3_Iref", value: 0 },
  { name: "YPP4_Iref", value: 0 },
  { name: "HPV1_EN", value: false },
  { name: "HPV1_RAMP", value: false },
  { name: "HPV2_EN", value: false },
  { name: "HPV2_RAMP", value: false },
  { name: "HPV3_EN", value: false },
  { name: "HPV3_RAMP", value: false },
  { name: "HPV4_EN", value: false },
  { name: "HPV4_RAMP", value: false },
  { name: "Y1", value: true },
  { name: "Y2", value: false },
  { name: "Y3", value: false },
  { name: "Y4", value: false },
  { name: "Y5", value: false },
  { name: "Y6", value: false },
  { name: "Y7", value: false },
  { name: "Y8", value: false },
  { name: "Y9", value: false },
  { name: "Y10", value: false },
  { name: "Y11", value: false },
  { name: "Y12", value: false },
  { name: "Y13", value: false },
  { name: "Y14", value: false },
  { name: "Y15", value: false },
  { name: "Y16", value: false },
  { name: "Y17", value: false },
  { name: "Y18", value: false },
  { name: "BB1", value: 700 },
  { name: "BB2", value: 700 },
  { name: "BB3", value: 700 },
  { name: "BB4", value: 700 },
  { name: "BB5", value: 700 },
  { name: "BB6", value: 700 },
  { name: "BB7", value: 700 },
  { name: "BB8", value: 700 },
  { name: "BB13", value: 700 },
  { name: "BB9", value: 700 },
  { name: "BB10", value: 700 },
  { name: "BB11", value: 700 },
  { name: "BB12", value: 700 },
  { name: "start_handle", value: false },
  { name: "continue_handle", value: false },
  { name: "main_state", value: false },
  { name: "stop_hanlde", value: false }
];

export function doFakePlcLogic() {
  function doMDLogic() {
    const start_reg = /^start_(\w+)_handle$/;
    const state_reg = /(w+)_state$/;

    md_vault.forEach((element_start) => {
      const name = start_reg.exec(element_start.name)?.[1];
      if (name != null && element_start.value) {
        element_start.value = false;
        const element_state = md_vault.find((element) =>
          RegExp(`${name}_state$`).exec(element.name)
        ) as { name: string; value: number };
        if (element_state == undefined) return;
        element_state.value = 0;
        const cycle_interval = setInterval(() => {
          if (element_state.value < 20) {
            element_state.value += 1;
            md_vault[
              "status_message"
            ] = `Cycle ${name} in ${element_state.value}.`;
          } else {
            md_vault["status_message"] = `Cycle ${name} complete.`;
            element_state.value = 99;
            clearInterval(cycle_interval);
          }
          console.log(element_state);
        }, 200);
      }
    });
  }

  doMDLogic();
  // console.log(md_vault);
}

export class SocketServer {
  stop: boolean = false;
  constructor(port: number, mess_callback: (mess: string) => string) {
    var my_sock = new zmq.Reply();
    my_sock.bind(`tcp://*:${port}`).then(async () => {
      // will return a rejected promise immediately if there is no message to receive.
      my_sock.receiveTimeout = 2000;
      function sendAfterTime(callback: () => Promise<void>) {
        return new Promise((resolve) => { setTimeout(async () => { await callback(); resolve(null) }, 500) });
      }
      while (!this.stop) {
        const mes = await my_sock.receive().catch((reason) => { if (reason.code != "EAGAIN") console.log(reason) });
        if (mes) {
          // await sendAfterTime(async () => {
          await my_sock.send(mess_callback(mes.toString())).catch((reason) => { if (reason.code != "EAGAIN") console.log(reason); })
          // })
        }
      }

    });
  }
}


