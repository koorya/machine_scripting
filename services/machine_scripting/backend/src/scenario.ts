import * as fs from "fs";

import * as StateMachine from "javascript-state-machine";
import { md_fsm_config, transitions } from "./md/state_machine_cfg";
import * as MyTypes from "~shared/types/types";
import { iPLCStateMachine, iStateMachine } from "./fsm_types";

md_fsm_config.transitions.push({
  name: "goto",
  from: "*",
  to: function (s) {
    return s;
  },
});
var fsm = new StateMachine(md_fsm_config);

function compileScenario(scenario: string) {
  function repeat(val: any, counts: number) {
    return [
      ...Array(counts)
        .fill(0)
        .map((el) => val),
    ];
  }
  let compiled = null;
  try {
    compiled = Function(`return function(repeat){ return ` + scenario + `;}`)()(
      repeat
    );
    return compiled;
  } catch {
    console.log("invalid script!");
  }
  return null;
}

async function getCompiledScenarioError(
  cmdlist: string[],
  fsm_plc: iPLCStateMachine<iStateMachine>,
  init: MyTypes.ScenarioStartCondition = null
): Promise<MyTypes.ScenarioError> {
  const fsm = fsm_plc.virt.fsm;
  await fsm_plc.virt.init(init);

  const eCommands = cmdlist[Symbol.iterator]();
  let curr_cmd = eCommands.next();
  let index = 0;
  while (!curr_cmd.done) {
    if (fsm.can("step")) await fsm.step();
    if (fsm.cannot(curr_cmd.value)) {
      // console.log(fsm.transitions());
      // console.log("not valid");
      return {
        error: "not valid in this state",
        index: index,
        cmd: curr_cmd.value,
      };
    }
    const is_possible = await fsm[curr_cmd.value]();
    if (!is_possible) {
      // console.log(fsm.transitions());
      // console.log("not valid in this env");
      return {
        error: "not valid in this env",
        index: index,
        cmd: curr_cmd.value,
      };
    }
    index += 1;
    console.log(curr_cmd.value);
    curr_cmd = eCommands.next();
  }
  console.log("commands reading finish");
  return null;
}

export { fsm as fsm_sc, getCompiledScenarioError, compileScenario };
