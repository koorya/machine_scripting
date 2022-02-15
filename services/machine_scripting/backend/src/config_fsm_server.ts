import { FSMController } from "./fsm_controller/fsm_controller";
import { createPlcFsmWithRender } from "./create_plcfsm_by_type";
import { Machines, ScenarioDefenition } from "./types/types";
import * as fs from "fs";
import { generateEndPoints } from "./end_points";
import { ExtConfig, iData, MachineData } from "./fsm_types";

const algorithms_path = "config/algorithms.json";
const default_algorithms_path = "config/default_algorithms.json";

export function configFsmServer(config: ExtConfig) {

  let scenarios: ScenarioDefenition[] = [];
  try {
    scenarios = JSON.parse(fs.readFileSync(algorithms_path).toString());
  } catch {
    console.log("algorithms.json is empty");
    scenarios = JSON.parse(fs.readFileSync(default_algorithms_path).toString());
  }
  const { plc_fsm, render } = createPlcFsmWithRender(config);

  const funct = plc_fsm.js_fsm.onAfterTransition;

  const plc_controller = new FSMController(plc_fsm);
  plc_fsm.js_fsm.onAfterTransition = async function (lifecycle) {
    render.updateImage(plc_fsm.js_fsm.state, plc_controller.state != "available");
    funct(lifecycle);
    // fsm_sc.goto(fsm.state);
    // fsm_sc.current_level = fsm.current_level;
  };
  plc_controller.onAfterTransition = plc_fsm.js_fsm.onAfterTransition;

  return {
    render: render,
    plc_controller: plc_controller,
    ...generateEndPoints(render, plc_controller, scenarios, algorithms_path),
  }
}
