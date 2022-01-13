import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as express from "express";
import * as cors from "cors";

import { associateEndpoints } from "./endpoints_utils";
import { configFsmServer } from "./config_fsm_server";
import { Machines } from "./types/types";


// хранение состояния манипулятора +
// восстановление и сопоставление состояния манипулятора по датчикам -
// прием команд через внешние запросы + (rest api)
// проверка команд на валидность и возможность для текущего состояния +
// запуск соответствующих циклов внутри домкрата +
// контроль выполнения циклов, отображение состояния внутри цикла +- (непонятный сценарий работы при ошибках в контроллере)
// доступ по web +
// передача точек пути для сдвига рамы -

const argv = yargs(hideBin(process.argv)).argv;

const zmq_port: number = argv["zmq_port"] ? argv["zmq_port"] : 5552;


const ui_port = argv["ui_port"] ? argv["ui_port"] : 5001;
const machine_type: Machines = argv["machine_type"] ? argv["machine_type"] : "MM";

const md_port: number = argv["md_port"] ? argv["md_port"] : 0;
const mm_port: number = argv["mm_port"] ? argv["mm_port"] : 0;
const mp_port: number = argv["mp_port"] ? argv["mp_port"] : 0;
console.log(`zmq_port: ${zmq_port}`);
console.log(`ui_port: ${ui_port}`);
console.log(`machine_type: ${machine_type}`);



let fsm_api: ReturnType<typeof configFsmServer>;

if (machine_type == "MP" ||
  machine_type == "MD" ||
  machine_type == "MM"
) {
  fsm_api = configFsmServer({ type: machine_type, ext_config: { zmq_port: zmq_port } });
} else if (machine_type == "MASTER") {
  fsm_api = configFsmServer({
    type: machine_type, ext_config: {
      md_port: md_port,
      mm_port: mm_port,
      mp_port: mp_port,
    }
  });
}


const app = express();
app.use(express.json());
app.use(cors());

app.get("/", (request, response) => {
  response.send("hello world");
});
app.get("/state", (request, response) => {
  response.send(fsm_api.plc_controller.slave_fsm.js_fsm.state);
});

associateEndpoints(fsm_api.end_points_get, fsm_api.end_points_post, app);


app.listen(ui_port, () => console.log(`running on port ${ui_port}`));
