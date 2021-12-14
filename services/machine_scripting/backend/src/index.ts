import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as express from "express";
import * as cors from "cors";

import { associateEndpoints } from "./endpoints_utils";
import { configFsmServer } from "./config_fsm_server";


// хранение состояния манипулятора +
// восстановление и сопоставление состояния манипулятора по датчикам -
// прием команд через внешние запросы + (rest api)
// проверка команд на валидность и возможность для текущего состояния +
// запуск соответствующих циклов внутри домкрата +
// контроль выполнения циклов, отображение состояния внутри цикла +- (непонятный сценарий работы при ошибках в контроллере)
// доступ по web +
// передача точек пути для сдвига рамы -

const argv = yargs(hideBin(process.argv)).argv;

const zmq_port = argv["zmq_port"] ? argv["zmq_port"] : 5552;
const ui_port = argv["ui_port"] ? argv["ui_port"] : 5001;
const machine_type = argv["machine_type"] ? argv["machine_type"] : "MM";
console.log(`zmq_port: ${zmq_port}`);
console.log(`ui_port: ${ui_port}`);
console.log(`machine_type: ${machine_type}`);

const fsm_api = configFsmServer(machine_type, zmq_port);

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
