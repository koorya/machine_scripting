import * as concurrently from "concurrently";
import * as express from "express";
import * as cors from "cors";

import yargs, { options } from "yargs";
import { hideBin } from "yargs/helpers";
import { AddParams, Machines, RequestMatching } from "./types/types";
import { exit } from "@jest/types/node_modules/@types/yargs";

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);

const port = 5000;

type AddressListType = ({
  name: string;
  zmq_port: number;
  ui_port: number;
  specific_params: AddParams;
}

  &
  (
    | {
      is_fake: true;
    }
    | {
      is_fake: false;
      ip: string;
    }
  )
)

const address_list: AddressListType[] = [
  // {
  //   zmq_port: 5552,
  //   ui_port: 5001,
  //   is_fake: false,
  //   ip: "192.168.250.1",
  //   type: "MM",
  // },
  // {
  //   zmq_port: 5552,
  //   ui_port: 5001,
  //   is_fake: false,
  //   ip: "172.16.201.89",
  //   type: "MM",
  // },
  // {
  //   name: "Монтажник",
  //   zmq_port: 5553,
  //   ui_port: 5002,
  //   is_fake: false,
  //   ip: "172.16.201.79",
  //   type: "MM",
  //   photo: "photo address"
  // },
  {
    name: "fake_mm",
    zmq_port: 5554,
    ui_port: 5003,
    is_fake: true,
    specific_params: {
      type: "MM",
      neuro: {

        ipcl: "172.16.201.137",
        ipcr: "172.16.201.142",
        port: 8090
      }
    },
  },
  {
    name: "fake_md",
    zmq_port: 5555,
    ui_port: 5004,
    is_fake: true,
    specific_params: {
      type: "MD",
      hydro: 10,
      reading_port: { zmq: 5700, ui: 5710 },
      seting_port: { zmq: 5701, ui: 5711 },
    },
  },
];

const app = express();
app.use(express.json());
app.use(cors());
app.get("/list_machines_ports", (request, response) => {
  response.send(JSON.stringify(address_list.map((value) => value.ui_port)));
});

app.get("/get_machines_info", (request, response) => {
  const get_machines_info = (): Extract<RequestMatching, { type: "get_machines_info" }>["response"] => {
    return address_list.map(
      (value) => {
        const t = { port: value.ui_port, name: value.name, ...value.specific_params, };
        return t;
      })
  }
  response.send(JSON.stringify(get_machines_info()));
});

const server = app.listen(port, () => console.log(`running on port ${port}`));



const run_list: concurrently.CommandObj[] = [];
address_list.map((value) => {
  if (value.is_fake == true) {
    if (value.specific_params.type == "MD") {
      run_list.push({
        command: `npm run fake_plc -- --zmq_port=${value.zmq_port} ${value.specific_params.reading_port.zmq} ${value.specific_params.seting_port.zmq}`,
        name: `fake_md_${value.name}`,
      });
    }
    else if (value.specific_params.type == "MM")
      run_list.push({
        command: `npm run fake_plc -- --zmq_port=${value.zmq_port}`,
        name: `fake_mm_${value.name}`
      });
  }
  else {
    if (value.specific_params.type == "MD")
      run_list.push({
        command:
          `cd ../../plc_connector/MainApp & dotnet run -- --port=${value.zmq_port} ${value.specific_params.reading_port.zmq} ${value.specific_params.seting_port.zmq} --ip_address=${value.ip} --sgw_port=2`
      });
    else if (value.specific_params.type == "MM")
      run_list.push({
        command:
          `cd ../../plc_connector/MainApp & dotnet run -- --port=${value.zmq_port} --ip_address=${value.ip} --sgw_port=2`
      });
  }
  if (value.specific_params.type == "MD") {
    run_list.push({
      command: `npm run repeater -- --zmq_port=${value.specific_params.reading_port.zmq} --ui_port=${value.specific_params.reading_port.ui}`,
      name: `repeater_reading`,
    });
    run_list.push({
      command: `npm run repeater -- --zmq_port=${value.specific_params.seting_port.zmq} --ui_port=${value.specific_params.seting_port.ui}`,
      name: `repeater_setting`,
    });
  }
  run_list.push({
    command:
      `npm run server -- --zmq_port=${value.zmq_port} --ui_port=${value.ui_port} --machine_type=${value.specific_params.type}`,
    name: `server`
  });
});

// var exec = require("child_process").exec;
// exec("\"penv/Scripts/python.exe\" scripts/test.py", { cwd: '../../NeuroNets_MM/', timeout: 2000 }, (error, stdout, stderr) => {
//   if (error) {
//     console.error(`exec error: ${error}`);
//     return;
//   }
//   console.log(`stdout: ${stdout}`);
//   console.error(`stderr: ${stderr}`);
// });

run_list.push({
  command:
    "\"penv/Scripts/python.exe\" run_service.py",
  name: `neuro_mm`,
  cwd: '../../NeuroNets_MM/'
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Process terminated SIGTERM");
  });
});

concurrently(run_list, { killOthers: ["failure", "success"] }).then(() => {
  return server.close(() => {
    console.log("Process terminated concurrently");
  });
});
