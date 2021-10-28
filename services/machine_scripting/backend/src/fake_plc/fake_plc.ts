import * as zmq from "zeromq";


export const md_vault: { name: string; value: unknown }[] = [
  { name: "status_message", value: "no mess" },
];

interface P_type {
  Start: boolean;
  Run: boolean;
  Done: boolean;
  Skip: boolean;
  Reset: boolean;
  Next: number;
}
function makeP(next: number): P_type {
  return {
    Start: false,
    Done: false,
    Run: false,
    Skip: false,
    Reset: false,
    Next: next,
  };
}
function makePArr(n: number, seq?: number[]): P_type[] {
  if (seq == undefined)
    seq = [...Array(n)].map((value, index) => index);
  return [...Array(n)].map((value, index) => makeP(seq[index]));
}
export const mm_vault = {
  P200: makePArr(7),
  P300: makePArr(5),
  P400: makePArr(8),
  P500: makePArr(7),
  P600: makePArr(20, [1, 2, 3, 7, 4, 5, 8, 6, 9, 0, 0, 0]),
  P700: makePArr(7),
  P800: makePArr(9),
};

export const mm_var_regexp = /(P\d{3})\[(\d{1,2})\]\.([A-Z][a-z]*)/;

export function doMMLogic() {
  for (var xxx in mm_vault) {
    const pxxx = mm_vault[xxx] as P_type[];
    if (pxxx[0].Start == true) {
      pxxx[0].Start = false;
      if (pxxx[0].Skip) {
        pxxx[0].Done = true;
        console.log(`${xxx} skiped`);
      } else {
        pxxx[0].Run = true;
        pxxx[1].Start = true;
      }
    }
    pxxx.forEach((p_step, index) => {
      if (index == 0) return;

      if ((p_step.Done && p_step.Run) || (p_step.Start && p_step.Skip)) {
        if (p_step.Skip) {
          p_step.Done = true;
          console.log(`${xxx}[${index}] skiped`);
        }
        p_step.Run = false;
        if (index + 1 < pxxx.length) {
          pxxx[index + 1].Start = true;
        } else {
          pxxx[0].Run = false;
          pxxx[0].Done = true;
          console.log(`${xxx} complete`);
        }
      }
      if (p_step.Start) {
        p_step.Start = false;
        if (!p_step.Skip) {
          p_step.Run = true;
          let t = 0;
          const p_name = xxx.slice(0);
          const run = () => {
            t += 10;
            if (t < 100) {
              setTimeout(run, 100);
              console.log(`${p_name}[${index}] ${t}%`);
            } else {
              p_step.Done = true;
              console.log(`${p_name}[${index}] complete`);
            }
          };
          run();
        }
      }
    });
    if (pxxx[0].Reset) {
      console.log(`${xxx} Reset`);
      pxxx.forEach((p) => {
        for (var prop in p) p[prop] = false;
      });
    }
  }
  if (mm_vault.P200[0].Start) {
    mm_vault.P200[0].Start = false;
    mm_vault.P200[0].Run = true;
    mm_vault.P200[1].Start = true;
  }
  // console.log(mm_vault.P200);
}


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


