import * as StateMachine from "javascript-state-machine";
import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachineHistory from "javascript-state-machine/lib/history.js";

import * as graphviz from "graphviz";
import * as fs from "fs";
import { resolve } from "path";

import * as express from "express";
import * as cors from "cors";
import { RequestHandler } from "express-serve-static-core";
import { fsm_config, transitions } from "./state_machine_cfg";
import { plc_fsm } from "./plc_fsm";
import { fsm_sc } from "./scenario";

// хранение состояния манипулятора
// восстановление и сопоставление состояния манипулятора по датчикам
// прием команд через внешние запросы
// проверка команд на валидность и возможность для текущего состояния
// запуск соответствующих циклов внутри домкрата
// контроль выполнения циклов, отображение состояния внутри цикла
// доступ по web
// передача точек пути для сдвига рамы
const funct = plc_fsm.onAfterTransition;
plc_fsm.onAfterTransition = function (lifecycle) {
  updateImage();
  funct(lifecycle);
  fsm_sc.goto(fsm.state);
  fsm_sc.current_level = fsm.current_level;
};
const fsm = plc_fsm;

let rendered_image = null;
async function updateImage() {
  let tran = [...transitions];
  tran.map((edge) => {
    if (edge.name === "step") {
      if (!edge["dot"]) edge["dot"] = { color: "blue" };
      else edge.dot["color"] = "blue";

      edge.name = " ";
    }
  });
  var fsm_image = new StateMachine({
    init: "on_pins_support",
    transitions: tran,
  });

  await graphviz.parse(
    visualize(fsm_image, { orientation: "vertical" }),
    (gg) =>
      // gg.output("svg", "test01.svg")
      {
        gg.getNode(fsm.state).set("color", "red");
        gg.output("svg", (buff) => {
          rendered_image = buff.toString("base64");
        });
        console.log("rendered");
      }
  );
  resolve();
}
function updateHistory() {
  console.log(
    JSON.stringify(fsm.history) + "; can: " + JSON.stringify(fsm.transitions())
  );
}
// const history_upd = setInterval(updateHistory, 150);

const app = express();
const port = 5001;
app.use(express.json());
app.use(cors());

app.get("/", (request, response) => {
  response.send("hello world");
});
app.get("/state", (request, response) => {
  response.send(fsm.state);
});
app.get("/commands", (request, response) => {
  response.send(fsm.transitions());
});

app.post("/command", (req, res) => {
  console.log(req.body);
  let cmd = req.body.command;
  if (fsm.cannot(cmd)) res.send("invalid cmd");
  else {
    const is_command_exec = fsm[cmd]();
    // if (fsm.can("step")) fsm.step();
    if (!is_command_exec) console.log("invalid cmd");
    res.send(is_command_exec ? "valid cmd" : "invalid cmd");
  }
});
app.get("/image", (req, res) => {
  if (rendered_image === null) {
    updateImage().then(() => res.send(rendered_image));
    console.log(rendered_image);
  } else {
    res.send(rendered_image);
  }
});
// cycle_state
app.get("/cycle_state", (request, response) => {
  response.send(
    JSON.stringify({
      state: fsm.state,
      cycle_step: fsm.cycle_state,
      current_level: fsm.current_level,
    })
  );
});

app.listen(port, () => console.log(`running on port ${port}`));
