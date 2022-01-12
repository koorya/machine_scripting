import { FSMController } from "./fsm_controller/fsm_controller";
import { createPlcFsmWithRender } from "./create_plcfsm_by_type";
import { Machines, ScenarioDefenition } from "./types/types";
import * as fs from "fs";
import { generateEndPoints } from "./end_points";

const algorithms_path = "config/algorithms.json";
const default_algorithms_path = "config/default_algorithms.json";

export function configFsmServer(machine_type: Machines, zmq_port: number) {

  let scenarios: ScenarioDefenition[] = [];
  try {
    scenarios = JSON.parse(fs.readFileSync(algorithms_path).toString());
  } catch {
    console.log("algorithms.json is empty");
    scenarios = JSON.parse(fs.readFileSync(default_algorithms_path).toString());
  }

  const { plc_fsm, render } = createPlcFsmWithRender(machine_type, zmq_port);
  const funct = plc_fsm.js_fsm.onAfterTransition;
  plc_fsm.js_fsm.onAfterTransition = async function (lifecycle) {
    render.updateImage(plc_fsm.js_fsm.state);
    funct(lifecycle);
    // fsm_sc.goto(fsm.state);
    // fsm_sc.current_level = fsm.current_level;
  };

  const plc_controller = new FSMController(plc_fsm);

  return {
    render: render,
    plc_controller: plc_controller,
    ...generateEndPoints(render, plc_controller, scenarios, algorithms_path),
  }
}
