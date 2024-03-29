import { FSMController } from "./fsm_controller/fsm_controller";
import { createPlcFsmWithRender } from "./create_plcfsm_by_type";
import { Machines, ScenarioDefenition } from "./types/types";
import * as bunyan from "bunyan";
import * as fs from "fs";
import { generateEndPoints } from "./end_points";
import { ExtConfig, iData, LifeCycle, MachineData } from "./fsm_types";
import { CustomThisType } from "./fsm_types"

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


  const plc_controller = new FSMController(plc_fsm);
  const render_funct = async () => {
    render.updateImage(plc_fsm.js_fsm.state, plc_controller.state != "available");
  }

  const log = bunyan.createLogger({
    name: `${plc_fsm.js_fsm.type}`,
    stream: fs.createWriteStream(`./logs/${plc_fsm.js_fsm.type}.log`, { flags: 'a' })
  })

  const log_funct = function (this: CustomThisType<Machines>, lifecycle: LifeCycle) {
    let data = {};
    if (this.type == "MP") {
      data = { ...data, length: this.length };
    }
    if (this.type == "MD") {
      data = { ...data, current_level: this.current_level };
    }
    log.info(data, `translate from: ${lifecycle.from}, to ${lifecycle.to}`)
  }

  const after_transition_dec = <T, ARGS extends any[]>(o: { onAfterTransition: (lifecycle: LifeCycle, ...args: ARGS) => T }, d: (lifecycle: LifeCycle, ...args: ARGS) => unknown) => {
    const f = o.onAfterTransition;
    o.onAfterTransition = function (lifecycle, ...args) {
      d.apply(o, [lifecycle, ...args]);
      const res = f.apply(o, [lifecycle, ...args]);
      return res;
    }
  };

  after_transition_dec(plc_fsm.js_fsm, render_funct);
  after_transition_dec(plc_fsm.js_fsm, log_funct);

  after_transition_dec(plc_controller, render_funct);

  return {
    render: render,
    plc_controller: plc_controller,
    ...generateEndPoints(render, plc_controller, scenarios, algorithms_path),
  }
}
