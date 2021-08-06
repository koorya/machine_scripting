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
  function isStateVar(name: string): boolean {
    return true;
  }
  test("up_frame_cycle_state", true)(isStateVar);
  test("start_up_frame_cycle_handle", false)(isStateVar);

  // Object.keys(vault).forEach();
}
doFakePlcLogic();

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
    });
  }

  return JSON.stringify(rec_obj);
});

setTimeout(() => (srv_inst.stop = true), 1000);

async function sendExample(port: number) {
  var sender = new zmq.Request();
  sender.connect(`tcp://127.0.0.1:${port}`);

  const vars = { up_frame_cycle_state: 0, start_up_frame_cycle_handle: true };
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

sendExample(port);
