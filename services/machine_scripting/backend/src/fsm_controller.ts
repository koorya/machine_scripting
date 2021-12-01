import * as StateMachine from "javascript-state-machine";
import { iController, iPLCStateMachine, iStateMachine } from "./fsm_types";
import { Machines } from "./types/types";

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
  data: function <type extends Machines>(fsm: iPLCStateMachine<type>) {
    return {
      fsm: fsm,
      should_stop: false,
      scenario: null,
    };
  },
  methods: {
    execCommandAsync: async function (
      command: string | { name: string; props: unknown }
    ) {
      const fsm = this.fsm as iPLCStateMachine<Machines>;
      console.log(`command: "${command}" execution start`);

      let parsed: { name: string; props: unknown };
      if (typeof command === "string") parsed = parseCommand(command);
      else parsed = command;

      console.log(`fsm state: ${fsm.fsm.state}`);
      if (fsm.fsm.cannot(parsed.name)) console.log("invalid cmd");
      else {
        console.log(`execCommandAsync: wait for exec ${parsed.name}`);
        const is_command_exec = await (fsm.fsm[parsed.name] as (
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
      }
      // await (() => new Promise((resolve) => setTimeout(resolve, 1000)))(); // sleep 1000 ms
      console.log(`command: "${parsed.name}" execution finish`);
      return;
    },
    onExecCommand: function (lifecycle, command: string) {
      const fsm = this.fsm as iPLCStateMachine<Machines>;
      if (fsm.fsm.cannot(command)) return false;

      console.log(this.execCommandAsync);
      this.execCommandAsync(command).then(async () => {
        console.log(`execCommandAsync executed ${command} success`);
        while (fsm.fsm.can("step")) {
          console.log("execScenarioAsync: wait step()")
          await fsm.fsm.step();
        }
        this.finishExecCommand();
      }).catch(() => {
        console.log(`execCommandAsync executed ${command} failed`);

        this.finishExecCommand();
      });
      return true;
    },
    execScenarioAsync: async function (scenario: {
      name: string;
      commands: string[];
    }) {
      this.scenario = { ...scenario, index: 0 };
      const fsm = this.fsm as iPLCStateMachine<Machines>;
      const commands = scenario.commands;
      const eCommands = commands[Symbol.iterator]();
      const execNextCmd = async () => {
        let stop_flag = false;
        let curr_cmd = eCommands.next();
        while (!stop_flag) {
          if (this.state === "paused") {
            await (() => new Promise((resolve) => setTimeout(resolve, 200)))(); // sleep 200 ms
            console.log("paused");
            continue;
          }
          if (!curr_cmd.done && !this.should_stop) {
            try {
              while (fsm.fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.fsm.step();
              }
              await this.execCommandAsync(curr_cmd.value);
            } catch {
              console.log(`error during executing command. scenario.index: ${this.scenario.index}`);
              if (this.can("pause")) {

                this.pause();
                continue;
              }
            }
          } else {
            if (curr_cmd.done)
              while (fsm.fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.fsm.step();
              }
            stop_flag = true;
            if (this.can("stop")) this.stop();
          }
          curr_cmd = eCommands.next();
          this.scenario.index += 1;
        }
      };
      execNextCmd();
    },
    onExecScenario: function (lifecycle, scenario) {
      this.should_stop = false;
      this.execScenarioAsync(scenario);
    },
    onStop: function () {
      this.should_stop = true;
    },
    onPause: function () { },
    onResume: function () { },
    onTransition: function (lifecycle) {
      console.log(`controller state: ${lifecycle.to}`);
    },
  },
});

export { FSMController };
