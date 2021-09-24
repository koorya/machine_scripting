import * as zmq from "zeromq";

var my_sock = new zmq.Request();
my_sock.connect("tcp://127.0.0.1:5552");

async function readVar(names: string[]) {
  await my_sock.send(
    JSON.stringify({
      PlcVarsArray: {
        arr: names.map((n) => {
          return { name: n };
        }),

        update: false,
      },
    })
  );
  var [msg] = await my_sock.receive();
  return JSON.parse(msg.toString()).PlcVarsArray.arr;
}

async function readVarToObj(names: string[]): Promise<{ [key: string]: any }> {
  const plc_variables_obj = {};
  (await readVar(names)).map((el) => (plc_variables_obj[el.name] = el.value));
  return plc_variables_obj;
}

async function waitForPlcVar(
  name: string,
  value: any,
  t: number = 200
): Promise<void> {
  return new Promise((resolve, reject) => {
    let mon: NodeJS.Timeout;
    const run = async () => {
      const plc_variables = await readVarToObj([name]);
      if (plc_variables[name] != value) mon = setTimeout(run, t);
      else resolve();
    };
    run();
  });
}

async function writeVar(vars: { [key: string]: any }) {
  await my_sock.send(
    JSON.stringify({
      PlcVarsArray: {
        arr: Object.keys(vars).map((n) => {
          return { name: n, value: vars[n] };
        }),

        update: true,
      },
    })
  );
  var [msg] = await my_sock.receive();
  return JSON.parse(msg.toString()).PlcVarsArray.arr;
}
async function writeVarByName(name: string, value: any) {
  const pv = {};
  pv[name] = value;
  await writeVar(pv);
}

// readVar(["flag1", "flag2"]).then((m) => {
//   console.log(m);
//   writeVar({ flag1: false, flag2: false }).then(console.log);
// });

// const waiter = setInterval(async () => {
//   console.log("wait");
//   let flag1 = (await readVar(["flag1"]))[0].value;
//   if (flag1 == true) clearInterval(waiter);
// }, 100);

export { readVar, writeVar, readVarToObj, waitForPlcVar, writeVarByName };
