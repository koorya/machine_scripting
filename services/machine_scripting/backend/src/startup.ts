import * as concurrently from "concurrently";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { AddressListType } from "~shared/types/types";
import { address_list as address_list_ } from "~shared/config/machines_config"

const argv = yargs(hideBin(process.argv)).options({
  nodemon: {
    describe: 'run with nodemon',
    boolean: true
  }
}).argv;

console.log(argv);

const neuro_service = argv["neuro_service"] ? argv["neuro_service"] : false;

const node_mon = argv["nodemon"] ? "_nodemon" : "";


const address_list = address_list_ as AddressListType[];

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
    if (value.specific_params.type == "MD" ||
      value.specific_params.type == "MP"
    ) {
      run_list.push({
        command:
          `cd ../../plc_connector/MainApp & dotnet run -- --port=${value.zmq_port} ${value.specific_params.reading_port.zmq} ${value.specific_params.seting_port.zmq} --ip_address=${value.ip} --sgw_port=2`
      });
    } else if (value.specific_params.type == "MM") {
      run_list.push({
        command:
          `cd ../../plc_connector/MainApp & dotnet run -- --port=${value.zmq_port} --ip_address=${value.ip} --sgw_port=2`
      });
    } else if (value.specific_params.type == "MASTER") {

    } else {
    }
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
      `npm run server${node_mon} -- --zmq_port=${value.zmq_port} --ui_port=${value.ui_port} --machine_type=${value.specific_params.type}`,
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



concurrently(run_list, { killOthers: ["failure", "success"] });
