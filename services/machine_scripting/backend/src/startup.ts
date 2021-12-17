import * as concurrently from "concurrently";
import * as express from "express";
import * as cors from "cors";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { AddParams, Machines, RequestMatching } from "./types/types";
import { address_list } from "shared/config/machines_config"

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);

const neuro_service = argv["neuro_service"] ? argv["neuro_service"] : false;

const port = 5000;



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
    if (value.specific_params.type == "MD"
      || value.specific_params.type == "MP") {
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
  if (value.specific_params.type == "MD"
    || value.specific_params.type == "MP") {
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
    name: `server_${value.specific_params.type}`
  });
});

if (neuro_service)
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
