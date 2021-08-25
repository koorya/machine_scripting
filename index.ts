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
import { FSMController } from "./fsm_controller";
import { fsm_sc, getCompiledScenarioError, compileScenario } from "./scenario";
import e = require("express");

// хранение состояния манипулятора +
// восстановление и сопоставление состояния манипулятора по датчикам -
// прием команд через внешние запросы + (rest api)
// проверка команд на валидность и возможность для текущего состояния +
// запуск соответствующих циклов внутри домкрата +
// контроль выполнения циклов, отображение состояния внутри цикла +- (непонятный сценарий работы при ошибках в контроллере)
// доступ по web +
// передача точек пути для сдвига рамы -

const funct = plc_fsm.onAfterTransition;
plc_fsm.onAfterTransition = function (lifecycle) {
  updateImage();
  funct(lifecycle);
  // fsm_sc.goto(fsm.state);
  // fsm_sc.current_level = fsm.current_level;
};
const fsm = plc_fsm;

const plc_controller = new FSMController(fsm);

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
        // gg.set("ratio", "1.0");
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
  console.log(
    `cnt_state: ${plc_controller.state}; trs: ${plc_controller.transitions()}`
  );
  let cmd = req.body.command;
  const payload = req.body.payload;

  if (cmd === "execCommand")
    try {
      if (
        plc_controller.can("execCommand") &&
        plc_controller.execCommand(payload)
      )
        res.send("valid cmd");
      else res.send("invalid cmd");
    } catch {
      res.send("error durind command executing");
    }
  else if (cmd === "execScenario")
    try {
      if (
        plc_controller.can("execScenario") &&
        plc_controller.execScenario(payload)
      )
        res.send("valid cmd");
      else res.send("invalid cmd");
    } catch {
      res.send("error durind command executing");
    }
  else if (plc_controller.can(cmd)) {
    plc_controller[cmd]();
    res.send("exec simple command");
  } else res.send("invalid req");
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
app.get("/controller_status", (request, response) => {
  response.send(
    JSON.stringify({
      state: plc_controller.state,
      scenario_status: {
        name: plc_controller.scenario?.name,
        step_index: plc_controller.scenario?.index,
      },
      machine_status: {
        state: fsm.state,
        cycle_step: fsm.cycle_state,
        current_level: fsm.current_level,
      },
    })
  );
});
// get_all_states
app.get("/get_all_states", (request, response) => {
  response.send(JSON.stringify(fsm.allStates()));
});
const scenarios = JSON.parse(fs.readFileSync("algorithms.json").toString());

app.get("/scenarios", (request, response) => {
  response.send(JSON.stringify(scenarios));
});
app.post("/compile_scenario", (req, res) => {
  console.log(req.body);
  let script = req.body.script;
  const compiled = compileScenario(script);
  console.log(compiled);
  if (compiled != null) res.send(compiled);
  else res.send([]);
});
app.post("/is_scenario_valid", (req, res) => {
  console.log(req.body);
  let compiled = req.body.compiled_scenario;
  const starting_condition = req.body.starting_condition;
  starting_condition.level = parseInt(starting_condition.level);

  getCompiledScenarioError(compiled, starting_condition).then((err) => {
    console.log(err);
    if (err != null) res.send(err);
    else res.send({});
  });
});
app.post("/save_scenario", (req, res) => {
  console.log(req.body);
  const scenario = req.body;
  console.log(scenario);
  const compiled = compileScenario(scenario.script);
  scenario.starting_condition.level = parseInt(
    scenario.starting_condition.level
  );
  getCompiledScenarioError(compiled, scenario.starting_condition).then(
    (err) => {
      console.log(err);
      if (err != null) res.send(err);
      else {
        const found = scenarios.find((el, index) => {
          if (el.name === scenario.name) {
            scenarios[index] = scenario;
            return true;
          }
        });
        if (found == undefined) scenarios.push(scenario);
        fs.writeFile(
          "algorithms.json",
          JSON.stringify(scenarios, null, 2),
          () => {
            console.log("File uptaded");
          }
        );

        res.send(scenarios);
      }
    }
  );
});

app.listen(port, () => console.log(`running on port ${port}`));
