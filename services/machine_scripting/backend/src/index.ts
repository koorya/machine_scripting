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
import {
  IResponse,
  ReqTypes_get,
  ReqTypes_post,
  RequestMatching,
  ScenarioDefenition,
} from "~shared/types/types";

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

let scenarios: ScenarioDefenition[] = [];
try {
  scenarios = JSON.parse(fs.readFileSync(algorithms_path).toString());
} catch {
  console.log("algorithms.json is empty");
  scenarios = JSON.parse(fs.readFileSync(default_algorithms_path).toString());
}

type EndPointResponse<T> = Extract<RequestMatching, { type: T }>["response"];
type EndPointRequest<T> = Extract<RequestMatching, { type: T }>["request"];
type EndPointFunctionGet<T extends ReqTypes_get> = () => Promise<
  EndPointResponse<T>
>;
type EndPointFunctionPost<T extends ReqTypes_post> = (
  arg0: EndPointRequest<T>
) => Promise<EndPointResponse<T>>;

type EndPointTypeGet<T extends ReqTypes_get> = {
  name: T;
  data: EndPointFunctionGet<T>;
};
type EndPointTypePost<T extends ReqTypes_post> = {
  name: T;
  data: EndPointFunctionPost<T>;
};
type EndPointCreatorGet = <T extends ReqTypes_get>(
  arg0: T,
  arg1: EndPointFunctionGet<T>
) => EndPointTypeGet<T>;

type EndPointCreatorPost = <T extends ReqTypes_post>(
  arg0: T,
  arg1: EndPointFunctionPost<T>
) => EndPointTypePost<T>;

const createEndPointGet: EndPointCreatorGet = (arg0, arg1) => {
  return {
    name: arg0,
    data: arg1,
    method: "GET",
  };
};

const createEndPointPost: EndPointCreatorPost = (arg0, arg1) => {
  return {
    name: arg0,
    data: arg1,
    method: "POST",
  };
};

const end_points_get = [
  createEndPointGet("commands", async () =>
    plc_controller.fsm.fsm.transitions()
  ),
  createEndPointGet("controller_status", async () => {
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
      const machine_status: MyTypes.ExtractByType<
        MyTypes.MachineStatus,
        "MD"
      > = {
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
      return controller_status;
    } else if (plc_controller.fsm.type === "MM") {
      const fsm = plc_controller.fsm as iPLCStateMachine<"MM">;
      const machine_status: MyTypes.ExtractByType<
        MyTypes.MachineStatus,
        "MM"
      > = {
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
      return controller_status;
    } else {
      throw new Error("Mathine type not valid");
    }
  }),
  createEndPointGet("image", async () => {
    if (rendered_image === null) {
      await updateImage();
      console.log(rendered_image);
    }
    return rendered_image;
  }),
  createEndPointGet("get_all_states", async () =>
    plc_controller.fsm.fsm.allStates()
  ),
  createEndPointGet("scenarios", async () => {
    return scenarios;
  }),
];

end_points_get.forEach((end_point) => {
  app.get(`/${end_point.name}`, async (request, response, next) => {
    try {
      const data = await end_point.data();
      response.json(data);
    } catch (error) {
      return next(error);
    }
  });
});

const end_points_post = [
  createEndPointPost("exec_graph_command", async (req) => {
    console.log(req);
    console.log(
      `cnt_state: ${plc_controller.state}; trs: ${plc_controller.transitions()}`
    );

    try {
      if (
        plc_controller.can("execCommand") &&
        plc_controller.execCommand(req.command)
      )
        return { result: "valid cmd" };
      else return { result: "invalid cmd" };
    } catch {
      throw new Error("error durind command executing");
    }
  }),

  createEndPointPost("exec_scenario", async (req) => {
    try {
      if (
        plc_controller.can("execScenario") &&
        plc_controller.execScenario(req)
      )
        return { result: "valid cmd" };
      else return { result: "invalid cmd" };
    } catch {
      throw new Error("error durind command executing");
    }
  }),
  createEndPointPost("exec_controller_command", async (req) => {
    try {
      if (plc_controller.can(req.command)) {
        plc_controller[req.command]();
        return { result: "exec simple command" };
      } else return { result: "invalid req" };
    } catch {
      throw new Error("error durind command executing");
    }
  }),
  createEndPointPost("compile_scenario", async (req) => {
    console.log(req);
    try {
      const compiled = compileScenario(req.script);
      console.log(compiled);
      return { compiled: compiled, status: "ok" };
    } catch (error) {
      console.log(JSON.stringify(error, null, 2));
      return { compiled: [], status: "fail" };
    }
  }),
  createEndPointPost("is_scenario_valid", async (req) => {
    console.log(req);
    try {
      const err = await getCompiledScenarioError(
        req.compiled_scenario,
        plc_controller.fsm,
        req.starting_condition
      );
      console.log(err);
      if (err != null) return { status: "notok", details: err };
      else return { status: "ok", details: null };
    } catch {
      console.log("is_scenario_valid: getCompiledScenarioError error");
    }
  }),
  createEndPointPost("save_scenario", async (req) => {
    const scenario = req;
    console.log(scenario);

    const compiled = compileScenario(scenario.script);
    try {
      const err = await getCompiledScenarioError(
        compiled,
        plc_controller.fsm,
        scenario.starting_condition
      );
      console.log(err);
      if (err != null) return { status: "fail", scenarios: scenarios };
      else {
        const found = scenarios.find((el, index) => {
          if (el.name === scenario.name) {
            scenarios[index] = scenario;
            return true;
          }
        });
        if (found == undefined) scenarios.push(scenario);
        fs.writeFile(
          algorithms_path,
          JSON.stringify(scenarios, null, 2),
          () => {
            console.log("File uptaded");
          }
        );

        return { status: "ok", scenarios: scenarios };
      }
    } catch {
      console.log("fail while save new scenario");
    }
  }),
];

end_points_post.forEach((end_point) => {
  app.post(`/${end_point.name}`, async (request, response, next) => {
    try {
      const data = await end_point.data(request.body);
      response.json(data);
    } catch (error) {
      return next(error);
    }
  });
});

app.listen(port, () => console.log(`running on port ${port}`));
