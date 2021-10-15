import * as StateMachine from "javascript-state-machine";
import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachineHistory from "javascript-state-machine/lib/history.js";

import * as graphviz from "graphviz";
import * as fs from "fs";

import * as express from "express";
import * as cors from "cors";
import { RequestHandler } from "express-serve-static-core";

import { plc_fsm, transitions } from "./mm/plc_fsm";

import { FSMController } from "./fsm_controller";
import { getCompiledScenarioError, compileScenario } from "./scenario";
import e = require("express");

import * as MyTypes from "~shared/types/types";
import { iPLCStateMachine } from "./fsm_types";

const algorithms_path = "config/algorithms.json";
const default_algorithms_path = "config/default_algorithms.json";

// хранение состояния манипулятора +
// восстановление и сопоставление состояния манипулятора по датчикам -
// прием команд через внешние запросы + (rest api)
// проверка команд на валидность и возможность для текущего состояния +
// запуск соответствующих циклов внутри домкрата +
// контроль выполнения циклов, отображение состояния внутри цикла +- (непонятный сценарий работы при ошибках в контроллере)
// доступ по web +
// передача точек пути для сдвига рамы -

const funct = plc_fsm.fsm.onAfterTransition;
plc_fsm.fsm.onAfterTransition = function (lifecycle) {
  updateImage();
  funct(lifecycle);
  // fsm_sc.goto(fsm.state);
  // fsm_sc.current_level = fsm.current_level;
};

const plc_controller = new FSMController(plc_fsm);

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
    init: plc_fsm.fsm.init,
    transitions: tran,
  });

  await graphviz.parse(
    visualize(fsm_image, { orientation: "vertical" }),
    (gg) =>
      // gg.output("svg", "test01.svg")
      {
        gg.getNode(plc_fsm.fsm.state).set("color", "red");
        // gg.set("ratio", "1.0");
        gg.output("svg", (buff) => {
          rendered_image = buff.toString("base64");
        });
        console.log("rendered");
      }
  );
}
function updateHistory() {
  console.log(
    JSON.stringify(plc_fsm.fsm.history) +
      "; can: " +
      JSON.stringify(plc_fsm.fsm.transitions())
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
  response.send(plc_controller.fsm.fsm.state);
});
app.get("/commands", (request, response) => {
  response.send(plc_controller.fsm.fsm.transitions());
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
        res.send(JSON.stringify("valid cmd"));
      else res.send(JSON.stringify("invalid cmd"));
    } catch {
      res.send(JSON.stringify("error durind command executing"));
    }
  else if (cmd === "execScenario")
    try {
      if (
        plc_controller.can("execScenario") &&
        plc_controller.execScenario(payload)
      )
        res.send(JSON.stringify("valid cmd"));
      else res.send(JSON.stringify("invalid cmd"));
    } catch {
      res.send(JSON.stringify("error durind command executing"));
    }
  else if (plc_controller.can(cmd)) {
    plc_controller[cmd]();
    res.send(JSON.stringify("exec simple command"));
  } else res.send(JSON.stringify("invalid req"));
});
app.get("/image", (req, res) => {
  if (rendered_image === null) {
    updateImage().then(() => res.send(JSON.stringify(rendered_image)));
    console.log(rendered_image);
  } else {
    res.send(JSON.stringify(rendered_image));
  }
});
// cycle_state
app.get("/controller_status", (request, response) => {
  let controller_status: MyTypes.ControllerStatus = {
    state: plc_controller.state,
    scenario_status: {
      name: plc_controller.scenario?.name,
      step_index: plc_controller.scenario?.index,
    },
    type: undefined,
    machine_status: undefined,
  };
  if (plc_controller.fsm.type === "MD") {
    const fsm = plc_controller.fsm as iPLCStateMachine<"MD">;
    const machine_status: MyTypes.ExtractByType<MyTypes.MachineStatus, "MD"> = {
      type: fsm.type,
      state: fsm.fsm.state,
      cycle_step: fsm.fsm.cycle_state,
      status_message: fsm.fsm.status_message,
      level: fsm.fsm.level,
    };
    controller_status = {
      ...controller_status,
      type: "MD",
      machine_status: machine_status,
    } as MyTypes.ExtractByType<MyTypes.ControllerStatus, "MD">;
    response.send(JSON.stringify(controller_status));
  } else if (plc_controller.fsm.type === "MM") {
    const fsm = plc_controller.fsm as iPLCStateMachine<"MM">;
    const machine_status: MyTypes.ExtractByType<MyTypes.MachineStatus, "MM"> = {
      type: fsm.type,
      state: fsm.fsm.state,
      cycle_step: fsm.fsm.cycle_state,
      address: fsm.fsm.current_address,
      status_message: fsm.fsm.status_message,
    };
    controller_status = {
      ...controller_status,
      type: "MM",
      machine_status: machine_status,
    } as MyTypes.ExtractByType<MyTypes.ControllerStatus, "MM">;
    response.send(JSON.stringify(controller_status));
  } else {
    response.send(JSON.stringify({ error: "invalid type of machine" }));
  }
});
// get_all_states
app.get("/get_all_states", (request, response) => {
  response.send(JSON.stringify(plc_controller.fsm.fsm.allStates()));
});
let scenarios = [];
try {
  scenarios = JSON.parse(fs.readFileSync(algorithms_path).toString());
} catch {
  console.log("algorithms.json is empty");
  scenarios = JSON.parse(fs.readFileSync(default_algorithms_path).toString());
}

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
  const scenario_req: MyTypes.ScenarioErrorRequest = {
    compiled_scenario: req.body.compiled_scenario,
    starting_condition: {
      type: req.body.type,
      level: parseInt(req.body.starting_condition.level),
      address: req.body.starting_condition.address,
      state: req.body.starting_condition.state,
    },
  };

  getCompiledScenarioError(
    scenario_req.compiled_scenario,
    plc_controller.fsm,
    scenario_req.starting_condition
  ).then((err) => {
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
  getCompiledScenarioError(
    compiled,
    plc_controller.fsm,
    scenario.starting_condition
  ).then((err) => {
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
      fs.writeFile(algorithms_path, JSON.stringify(scenarios, null, 2), () => {
        console.log("File uptaded");
      });

      res.send(scenarios);
    }
  });
});

app.listen(port, () => console.log(`running on port ${port}`));
