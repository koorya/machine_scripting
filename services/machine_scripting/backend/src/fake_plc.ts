import * as zmq from "zeromq";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);
const zmq_port = argv["zmq_port"] ? argv["zmq_port"] : 5552;
console.log(`zmq_port: ${zmq_port}`);

const md_vault: { name: string; value: unknown }[] = [
  { name: "status_message", value: "no mess" },
];

interface P_type {
  Start: boolean;
  Run: boolean;
  Done: boolean;
  Skip: boolean;
  Reset: boolean;
}
function makeP(): P_type {
  return {
    Start: false,
    Done: false,
    Run: false,
    Skip: false,
    Reset: false,
  };
}
function makePArr(n: number): P_type[] {
  return [...Array(n)].map(() => makeP());
}
const mm_vault = {
  P200: makePArr(7),
  P300: makePArr(5),
  P400: makePArr(8),
  P500: makePArr(7),
  P600: makePArr(7),
  P700: makePArr(7),
  P800: makePArr(9),
};
const mm_var_regexp = /(P\d{3})\[(\d{1,2})\]\.([A-Z][a-z]*)/;

function doMMLogic() {
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
function mm_run() {
  doMMLogic();
  setTimeout(mm_run, 50);
}
mm_run();

function test(value: any, should_be: any) {
  return function (target) {
    const ret = target(value);
    if (ret != should_be)
      console.log(`${target.name}(${value}) is not ${should_be}: ${ret}`);
  };
}

function doFakePlcLogic() {
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

class SocketServer {
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

const srv_inst = new SocketServer(zmq_port, (mess) => {
  const rec_obj = JSON.parse(mess);
  if (!rec_obj.PlcVarsArray.update) {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      element["value"] = undefined;
      const md_var = md_vault.find((value) => value.name == element.name);
      if (md_var != undefined) element["value"] = md_var.value;
      else {
        const a = mm_var_regexp.exec(element.name);
        if (a) element.value = mm_vault[a[1]][a[2]][a[3]];
      }
    });
  } else {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      const md_var = md_vault.find((value) => value.name == element.name);
      const a = mm_var_regexp.exec(element.name);

      if (md_var != undefined) md_var.value = element["value"];
      else if (a) {
        mm_vault[a[1]][a[2]][a[3]] = element.value;
      } else md_vault.push({ name: element.name, value: element["value"] });
    });
    console.log(md_vault);
    doFakePlcLogic();
  }

  return JSON.stringify(rec_obj);
});

// setTimeout(() => (srv_inst.stop = true), 10000);
// setInterval(() => console.log(vault), 500);

async function sendExample(port: number) {
  var sender = new zmq.Request();
  sender.connect(`tcp://127.0.0.1:${port}`);

  const vars = { up_frame_cycle_state: 10, start_up_frame_cycle_handle: true };
  await sender
    .send(
      JSON.stringify({
        PlcVarsArray: {
          arr: Object.keys(vars).map((n) => {
            return { name: n, value: vars[n] };
          }),

          update: true,
        },
      })
    )
    .then(() => sender.receive().then((answ) => null));

  setTimeout(() => {
    const vars = {
      down_frame_cycle_state: 0,
      start_down_frame_cycle_handle: true,
    };
    sender
      .send(
        JSON.stringify({
          PlcVarsArray: {
            arr: Object.keys(vars).map((n) => {
              return { name: n, value: vars[n] };
            }),

            update: true,
          },
        })
      )
      .then(() => sender.receive().then((answ) => null));
  }, 2000);

  const names = ["up_frame_cycle_state", "start_up_frame_cycle_handle", "kaka"];
  await sender
    .send(
      JSON.stringify({
        PlcVarsArray: {
          arr: names.map((n) => {
            return { name: n };
          }),

          update: false,
        },
      })
    )
    .then(() =>
      sender.receive().then(
        (answ) =>
          // console.log(JSON.stringify(JSON.parse(answ.toString()), null, 2))
          null
      )
    );
}

// sendExample(port);
