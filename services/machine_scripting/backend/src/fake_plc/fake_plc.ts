import * as zmq from "zeromq";


export const md_vault: { name: string; value: unknown }[] = [
  { name: "status_message", value: "no mess" },
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
  console.log(md_vault);
}

export class SocketServer {
  stop: boolean = false;
  constructor(port: number, mess_callback: (mess: string) => string) {
    var my_sock = new zmq.Reply();
    my_sock.bind(`tcp://*:${port}`).then(async () => {
      // will return a rejected promise immediately if there is no message to receive.
      my_sock.receiveTimeout = 2000;
      while (!this.stop)
        await my_sock.receive().then(
          (mes) => {
            // console.log(`receive mess ${mes}`);
            my_sock.send(mess_callback(mes.toString()));
          },
          (reason) => {
            if (reason.code != "EAGAIN") console.log(reason);
          }
        );
    });
  }
}


