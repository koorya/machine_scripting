import * as zmq from "zeromq";

const port = 5552;

const vault = {};

function test(value: any, should_be: any) {
  return function (target) {
    const ret = target(value);
    if (ret != should_be)
      console.log(`${target.name}(${value}) is not ${should_be}: ${ret}`);
  };
}

function doFakePlcLogic() {
  const start_reg = /^start_(\w+)_handle$/;
  const state_reg = /(w+)_state$/;

  Object.keys(vault).forEach((element) => {
    const name = start_reg.exec(element)?.[1];
    if (name != null && vault[element]) {
      Object.keys(vault).forEach((element) => {
        if (RegExp(`${name}_state$`).exec(element)) {
          vault[element] = 0;
          const cycle_interval = setInterval(() => {
            if (vault[element] < 50) vault[element] += 1;
            else {
              vault[element] = 99;
              clearInterval(cycle_interval);
            }
          }, 200);
        }
      });
      vault[element] = false;
    }
  });
  console.log(vault);
}

class SocketServer {
  stop: boolean = false;
  constructor(port: number, mess_callback: (mess: string) => string) {
    var my_sock = new zmq.Reply();
    my_sock.bind(`tcp://*:${port}`).then(async () => {
      // will return a rejected promise immediately if there is no message to receive.
      my_sock.receiveTimeout = 0;
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

const srv_inst = new SocketServer(port, (mess) => {
  const rec_obj = JSON.parse(mess);
  if (!rec_obj.PlcVarsArray.update) {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      element["value"] = vault[element.name];
    });
  } else {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      vault[element.name] = element["value"];
      doFakePlcLogic();
    });
  }

  return JSON.stringify(rec_obj);
});

// setTimeout(() => (srv_inst.stop = true), 10000);
setInterval(() => console.log(vault), 500);

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
