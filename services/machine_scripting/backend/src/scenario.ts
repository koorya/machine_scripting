import * as fs from "fs";

import * as MyTypes from "~shared/types/types";
import { Machines } from "~shared/types/types";
import { parseCommand } from "./fsm_controller";
import { iPLCStateMachine, iStateMachine } from "./fsm_types";

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
  fsm_plc: iPLCStateMachine<Machines>,
  init: MyTypes.ScenarioStartCondition = null
): Promise<MyTypes.ScenarioError> {
  const fsm = fsm_plc.virt.fsm;
  await fsm_plc.virt.init(init);

  const eCommands = cmdlist[Symbol.iterator]();
  let curr_cmd = eCommands.next();
  let index = 0;
  while (!curr_cmd.done) {
    if (fsm.can("step")) await fsm.step();
    const parced_cmd = parseCommand(curr_cmd.value);
    if (fsm.cannot(parced_cmd.name)) {
      // console.log(fsm.transitions());
      // console.log("not valid");
      return {
        error: "not valid in this state",
        index: index,
        cmd: parced_cmd.name,
      };
    }
    const is_possible = await (fsm[parced_cmd.name] as (
      ...arg
    ) => Promise<boolean>)(parced_cmd.props);
    if (!is_possible) {
      // console.log(fsm.transitions());
      // console.log("not valid in this env");
      return {
        error: "not valid in this env",
        index: index,
        cmd: parced_cmd.name,
      };
    }
    index += 1;
    console.log(parced_cmd.name);
    curr_cmd = eCommands.next();
  }
  console.log("commands reading finish");
  return null;
}

export { getCompiledScenarioError, compileScenario };
