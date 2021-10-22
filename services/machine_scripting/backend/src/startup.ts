import * as concurrently from "concurrently";
import * as express from "express";
import * as cors from "cors";

import yargs, { options } from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);

const port = 5000;

const address_list = [
  // {
  //   zmq_port: 5552,
  //   ui_port: 5001,
  //   is_fake: false,
  //   ip: "192.168.250.1",
  //   type: "MM",
  // },
  {
    zmq_port: 5552,
    ui_port: 5001,
    is_fake: false,
    ip: "172.16.201.89",
    type: "MM",
  },
  {
    zmq_port: 5553,
    ui_port: 5002,
    is_fake: false,
    ip: "172.16.201.79",
    type: "MM",
  },
  {
    zmq_port: 5554,
    ui_port: 5003,
    is_fake: true,
    ip: "",
    type: "MM",
  },
];

const app = express();
app.use(express.json());
app.use(cors());
app.get("/list_machines_ports", (request, response) => {
  response.send(JSON.stringify(address_list.map((value) => value.ui_port)));
});
app.listen(port, () => console.log(`running on port ${port}`));

const run_list: string[] = [];
address_list.map((value) => {
  if (value.is_fake)
    run_list.push(`npm run fake_plc -- --zmq_port=${value.zmq_port}`);
  else
    run_list.push(
      `cd ../../plc_connector/MainApp & dotnet run -- --port=${value.zmq_port} --ip_address=${value.ip} --sgw_port=2`
    );
  run_list.push(
    `npm run server -- --zmq_port=${value.zmq_port} --ui_port=${value.ui_port} --machine_type=${value.type}`
  );
});
concurrently(run_list, { killOthers: ["failure", "success"] });
console.log("hello");
