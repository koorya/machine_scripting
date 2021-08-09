import * as fs from "fs";

import * as StateMachine from "javascript-state-machine";
import { fsm_config, transitions } from "./state_machine_cfg";
fsm_config.transitions.push({
  name: "goto",
  from: "*",
  to: function (s) {
    return s;
  },
});
var fsm = new StateMachine(fsm_config);

const commands = JSON.parse(fs.readFileSync("algorithms.json").toString());

async function getScenarioError(
  scenario: [string],
  init: { state: string; level: number } = null
) {
  if (init != null) {
    await fsm.goto(init.state);
    fsm.current_level = init.level;
  }

  const eCommands = scenario[Symbol.iterator]();
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
        level: fsm.current_level,
      };
    }
    index += 1;
    console.log(curr_cmd.value);
    curr_cmd = eCommands.next();
  }
  console.log("commands reading finish");
  return null;
}

getScenarioError(commands, { state: "on_external_support", level: 2 }).then(
  console.log
);

export { fsm as fsm_sc };
