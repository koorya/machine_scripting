import {doFakePlcLogic, md_vault, SocketServer} from './fake_plc'
import { MMLogic } from "./fake_mm";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);
const zmq_port = argv["zmq_port"] ? argv["zmq_port"] : 5552;
console.log(`zmq_port: ${zmq_port}`);

const fake_mm = new MMLogic();
fake_mm.run();

const srv_inst = new SocketServer(zmq_port, (mess) => {
  const rec_obj = JSON.parse(mess);
  if (!rec_obj.PlcVarsArray.update) {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      element["value"] = undefined;
      const md_var = md_vault.find((value) => value.name == element.name);
      if (md_var != undefined) element["value"] = md_var.value;
      else {
        element.value = fake_mm.getPLCVarByName(element.name);
      }
    });
  } else {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      const md_var = md_vault.find((value) => value.name == element.name);

      if (md_var != undefined) md_var.value = element["value"];
      else if (fake_mm.getPLCVarByName(element.name)) {
        fake_mm.setPLCVarByName(element.name, element.value);
      } else md_vault.push({ name: element.name, value: element["value"] });
    });
    console.log(md_vault);
    doFakePlcLogic();
  }
  return JSON.stringify(rec_obj);
});

