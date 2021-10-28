import {doFakePlcLogic, doMMLogic, md_vault, mm_var_regexp, mm_vault, SocketServer} from './fake_plc'

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).argv;
console.log(argv);
const zmq_port = argv["zmq_port"] ? argv["zmq_port"] : 5552;
console.log(`zmq_port: ${zmq_port}`);

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

function mm_run() {
  doMMLogic();
  setTimeout(mm_run, 50);
}
mm_run();