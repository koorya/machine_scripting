import * as StateMachine from "javascript-state-machine";
import { iController, iFsmConfig, iData, iPLCStateMachine, iStateMachine, iMethods } from "./fsm_types";
import { CompiledScenario, ControllerStatus, Machines, MachineStatus, ScenarioDefenition } from "./types/types";

async function slowPrint(msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(msg);
      resolve(null);
    }, 1000);
  });
}
export function parseCommand(
  command: string
): { name: string; props: unknown } {
  const props_str = /((?<=\(){.*})(?=(\)$))/.exec(command)?.[0];
  const parced = {
    name: /^[a-z]([\da-zA-Z])*/.exec(command)?.[0],
    props: props_str ? JSON.parse(props_str) : (undefined as unknown),
  };
  return parced;
}

type iPLCStateMachineOfUnion<U extends string> = {
  [K in U]: iPLCStateMachine<K>;
}[U];

type ThisT = Extract<iFsmConfig, { data }>["data"] &
  Extract<iData, { type: "CONTROLLER" }> &
  Omit<Extract<iMethods, { type: "CONTROLLER" }>, "type"> &
  iStateMachine
  & {
    finishExecCommand;
    execCommandAsync;
    pause;
    stop;
    execScenarioAsync;
  };

var FSMController: new (
  fms: iPLCStateMachineOfUnion<Machines>
) => iController = StateMachine.factory({
  init: "available",
  transitions: [
    {
      name: "execScenario",
      from: "available",
      to: "executing_scenario",
    },
    {
      name: "execCommand",
      from: "available",
      to: "executing_command",
    },
    {
      name: "finishExecCommand", //only for internal use
      from: "executing_command",
      to: "available",
    },
    {
      name: "stop",
      from: ["executing_scenario", "paused"],
      to: "available",
    },
    {
      name: "pause",
      from: "executing_scenario",
      to: "paused",
    },
    {
      name: "resume",
      from: "paused",
      to: "executing_scenario",
    },
  ],
  data: function (slave_fsm: iPLCStateMachine<Machines>): Extract<iData, { type: "CONTROLLER" }> {
    return {
      type: "CONTROLLER",
      slave_fsm: slave_fsm,
      should_stop: false,
      scenario: null,
    };
  },
  methods: {
    getControllerStatus: function (): ReturnType<iController["getControllerStatus"]> {

      const this_t: ThisT = this;

      let controller_status: ControllerStatus<Machines> = {
        state: this_t.state,
        scenario_status: {
          name: this_t.scenario?.name,
          step_index: this_t.scenario?.index,
        },
        machine_status: this_t.slave_fsm.js_fsm.getMachineStatus(),
      };
      return controller_status;
    },
    execCommandAsync: async function (
      command: string | { name: string; props: unknown }
    ) {
      const this_t: ThisT = this;
      const fsm = this_t.slave_fsm as iPLCStateMachine<Machines>;
      console.log(`command: "${command}" execution start`);

      let parsed: { name: string; props: unknown };
      if (typeof command === "string") parsed = parseCommand(command);
      else parsed = command;

      console.log(`fsm state: ${fsm.js_fsm.state}`);
      if (parsed.name === "goto" || (parsed.name !== "goto" && fsm.js_fsm.can(parsed.name))) {
        console.log(`execCommandAsync: wait for exec ${parsed.name}`);
        const is_command_exec = await (fsm.js_fsm[parsed.name] as (
          ...arg: any
        ) => Promise<boolean>)(parsed.props);

        console.log(`execCommandAsync: exec ${parsed.name} finish`);

        if (!is_command_exec) {

          console.log("execCommandAsync: command exec error");
        }
        else {
          // while (fsm.fsm.can("step")) {
          //   console.log("execCommandAsync: wait step()")
          //   await fsm.fsm.step();
          // }
        }
      } else { console.log("invalid cmd"); }
      // await (() => new Promise((resolve) => setTimeout(resolve, 1000)))(); // sleep 1000 ms
      console.log(`command: "${parsed.name}" execution finish`);
      return;
    },
    onExecCommand: function (lifecycle, command: string) {
      const this_t: ThisT = this;
      const fsm = this_t.slave_fsm as iPLCStateMachine<Machines>;
      const parsed_cmd = parseCommand(command);
      if (parsed_cmd.name !== "goto") {
        if (fsm.js_fsm.cannot(parsed_cmd.name)) {
          console.log(`onExecCommand | js_fsm.cannot: ${parsed_cmd.name}`)
          return false;
        }
      }
      console.log(`onExecCommand | next run command async`);
      this_t.execCommandAsync(command).then(async () => {
        console.log(`execCommandAsync executed ${command} success`);
        while (fsm.js_fsm.can("step")) {
          console.log("execScenarioAsync: wait step()")
          await fsm.js_fsm.step();
        }
        this_t.finishExecCommand();
      }).catch((reason) => {
        console.log(`onExecCommand | execCommandAsync executed ${command} failed | reason: ${reason}`);

        this_t.finishExecCommand();
      });
      return true;
    },
    execScenarioAsync: async function (scenario: CompiledScenario) {
      const this_t: ThisT = this;
      this_t.scenario = { ...scenario, index: 0 };
      const fsm = this_t.slave_fsm;
      const commands = scenario.commands;
      const eCommands = commands[Symbol.iterator]();
      const execNextCmd = async () => {
        let stop_flag = false;
        let curr_cmd = eCommands.next();
        while (!stop_flag) {
          if (this_t.state === "paused") {
            await (() => new Promise((resolve) => setTimeout(resolve, 200)))(); // sleep 200 ms
            console.log("paused");
            continue;
          }
          if (!curr_cmd.done && !this_t.should_stop) {
            try {
              while (fsm.js_fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.js_fsm.step();
              }
              await this_t.execCommandAsync(curr_cmd.value);
            } catch {
              console.log(`error during executing command. scenario.index: ${this_t.scenario.index}`);
              if (this_t.can("pause")) {

                this_t.pause();
                continue;
              }
            }
          } else {
            if (curr_cmd.done)
              while (fsm.js_fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.js_fsm.step();
              }
            stop_flag = true;
            if (this_t.can("stop")) this_t.stop();
          }
          curr_cmd = eCommands.next();
          this_t.scenario.index += 1;
        }
      };
      execNextCmd();
    },
    onExecScenario: function (lifecycle, scenario) {
      const this_t: ThisT = this;
      this_t.should_stop = false;
      this_t.execScenarioAsync(scenario);
    },
    onStop: function () {
      const this_t: ThisT = this;
      this_t.should_stop = true;
    },
    onPause: function () { },
    onResume: function () { },
    onTransition: function (lifecycle) {
      console.log(`controller state: ${lifecycle.to}`);
    },
  },
});

export { FSMController };
