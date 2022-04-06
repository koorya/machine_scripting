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
<<<<<<< Updated upstream
    render.updateImage(plc_fsm.js_fsm.state, plc_controller.state);
  }

  const log = bunyan.createLogger({
    name: `${plc_fsm.js_fsm.type}`,
    stream: fs.createWriteStream(`./logs/${plc_fsm.js_fsm.type}.log`, { flags: 'a' })
  })

  const log_funct = async function (this: CustomThisType<Machines>, lifecycle: LifeCycle) {
    let data = {};
    if (this.type == "MP") {
      const plc_props = await this.plc.readVarToObj(["Forced_Frame_Height", "Height_To_Bottom"])
      data = { ...data, length: this.length, ...plc_props };
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
=======
    render.updateImage(plc_fsm.js_fsm.state, plc_controller.state != "available");
  }

  const render_dec = <T, ARGS extends any[]>(o: { onAfterTransition: (...args: ARGS) => T }, d: (...args: ARGS) => unknown) => {
    const f = o.onAfterTransition;
    o.onAfterTransition = (...args) => {
      d(...args);
      const res = f(...args);
>>>>>>> Stashed changes
      return res;
    }
  };

<<<<<<< Updated upstream
  after_transition_dec(plc_fsm.js_fsm, render_funct);
  after_transition_dec(plc_fsm.js_fsm, log_funct);

  after_transition_dec(plc_controller, render_funct);

  const before_transition_dec = <T, ARGS extends any[]>(o: { onBeforeTransition?: (lifecycle: LifeCycle, ...args: ARGS) => Promise<T> | T }, d: (lifecycle: LifeCycle, ...args: ARGS) => unknown) => {
    const f = o.onBeforeTransition;
    o.onBeforeTransition = async function (lifecycle, ...args) {
      await d.apply(o, [lifecycle, ...args]);
      if (f) {
        const res = f.apply(o, [lifecycle, ...args]);
        return res;
      }
    }
  };
  if (plc_fsm.js_fsm.type != "MASTER") {
    before_transition_dec(plc_fsm.js_fsm, async function (this: CustomThisType<Exclude<Machines, "MASTER" | "CONTROLLER">>) {
      try {

        const ready = (await this.plc.readVarToObj(["ready"]))["ready"];
        if (!ready) {
          const err_mesage = `Not ready ${this.type}`;
          log.error(err_mesage);
          throw new Error(err_mesage);
        }
      } catch (err) {
        throw new Error(err);
      }
      return true;
    });
  }
  // setInterval(async () => {
  //   if (plc_fsm.js_fsm.type != "MASTER") {
  //     try {

  //       const alarm = (await plc_fsm.js_fsm.plc.readVarToObj(["alarm"]))["alarm"];
  //       if (alarm) {
  //         if (plc_controller.can("stop")) {
  //           plc_controller["stop"]();
  //         }
  //         if (plc_controller.can("abortExecCommand")) {
  //           plc_controller["abortExecCommand"]();
  //         }
  //         plc_fsm.js_fsm.abort_controller.abort();
  //       }
  //     } catch {

  //     }
  //   } else {
  //     // const md_status = await plc_fsm.js_fsm.ext_config.md.getByAPI_get("controller_status");
  //     // const mm_status = await plc_fsm.js_fsm.ext_config.mm.getByAPI_get("controller_status");
  //     // const mp_status = await plc_fsm.js_fsm.ext_config.mp.getByAPI_get("controller_status");
  //     // if ((md_status.state == "aborted" ||
  //     //   mm_status.state == "aborted" ||
  //     //   mp_status.state == "aborted") && plc_controller.state != "aborted") {
  //     //   plc_controller["abortExecCommand"]();
  //     // }
  //   }
  // }, 1000);
=======
  render_dec(plc_fsm.js_fsm, render_funct);

  render_dec(plc_controller, render_funct);
>>>>>>> Stashed changes

  return {
    render: render,
    plc_controller: plc_controller,
    ...generateEndPoints(render, plc_controller, scenarios, algorithms_path),
  }
}
