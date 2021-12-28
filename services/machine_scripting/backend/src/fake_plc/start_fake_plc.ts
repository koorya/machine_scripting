import { doFakePlcLogic, md_vault, SocketServer } from "./fake_plc";
import MMLogic from "./fake-mm";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { init_vars as mp_vars } from "~shared/mp/plc_vars"
import { init_vars as md_vars } from "~shared/md/plc_vars"

const argv = yargs(hideBin(process.argv)).array("zmq_port").argv;
console.log(argv);
const zmq_port: number[] = argv["zmq_port"] ? argv["zmq_port"] : [5552];
console.log(`zmq_port: ${zmq_port}`);

appendVarsToMDVAULT();

const fake_mm = new MMLogic();
fake_mm.run();

const srv_inst = zmq_port.map((zmq_port) => new SocketServer(zmq_port, (mess) => {
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
      console.log(`element ${JSON.stringify(element, null, 2)}`)
      const md_var = md_vault.find((value) => value.name == element.name);
      if (md_var != undefined) {
        md_var.value = element["value"];
      } else if (fake_mm.getPLCVarByName(element.name) != undefined) {
        fake_mm.setPLCVarByName(element.name, element.value);
      } else md_vault.push({ name: element.name, value: element["value"] });
    });
    // console.log(md_vault);
    doFakePlcLogic();
  }
  return JSON.stringify(rec_obj);
}));

function appendVarsToVault(vars: { [key: string]: string | boolean | number }) {
  Object.entries(vars).map(([key, value]) => { md_vault.push({ name: key, value: value }) });
}

function appendVarsToMDVAULT() {
  appendVarsToVault(md_vars);
  appendVarsToVault(mp_vars);
}
