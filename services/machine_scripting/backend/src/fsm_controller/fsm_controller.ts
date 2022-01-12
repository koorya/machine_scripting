import * as StateMachine from "javascript-state-machine";
import { iController, iData, iPLCStateMachine, iStateMachine, iMethods } from "../fsm_types";
import { CompiledScenario, ControllerStatus, Machines, MachineStatus, ScenarioDefenition } from "../types/types";
import { States, Transitions, graph } from "./transitions";
import { FSMMethods } from "../fsm_types";

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

type iPLCStateMachineOfUnion<U extends Machines> = {
  [K in U]: iPLCStateMachine<K>;
}[U];



function stateMachineFactoryWrapper(config: { init: States | string, transitions: typeof graph.transitions, data: any, methods: FSMMethods<"CONTROLLER", States, Transitions> }) {
  return StateMachine.factory(config);
}

var FSMController: new (
  fms: iPLCStateMachineOfUnion<Machines>
) => iController = stateMachineFactoryWrapper({
  init: graph.init,
  transitions: graph.transitions,
  data: function (slave_fsm: iPLCStateMachine<Machines>): Extract<iData, { type: "CONTROLLER" }> {
    return {
      type: "CONTROLLER",
      slave_fsm: slave_fsm,
      should_stop: false,
      scenario: null,
    };
  },
  methods: {
    getMachineStatus: function () {
      return {
        cycle_step: undefined,
        state: this.state,
        status_message: undefined,
        type: this.type,
      }
    },
    getControllerStatus: function () {
      this.slave_fsm.js_fsm.getMachineStatus();
      let controller_status: ControllerStatus<Machines> = {
        state: this.state,
        scenario_status: {
          name: this.scenario?.name,
          step_index: this.scenario?.index,
        },
        machine_status: this.slave_fsm.js_fsm.getMachineStatus(),
      };
      return controller_status;
    },
    execCommandAsync: async function (
      command
    ) {
      const fsm = this.slave_fsm as iPLCStateMachine<Machines>;
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
      const fsm = this.slave_fsm as iPLCStateMachine<Machines>;
      const parsed_cmd = parseCommand(command);
      if (parsed_cmd.name !== "goto") {
        if (fsm.js_fsm.cannot(parsed_cmd.name)) {
          console.log(`onExecCommand | js_fsm.cannot: ${parsed_cmd.name}`)
          return false;
        }
      }
      console.log(`onExecCommand | next run command async`);
      this.execCommandAsync(command).then(async () => {
        console.log(`execCommandAsync executed ${command} success`);
        while (fsm.js_fsm.can("step")) {
          console.log("execScenarioAsync: wait step()")
          await fsm.js_fsm.step();
        }
        this.finishExecCommand();
      }).catch((reason) => {
        console.log(`onExecCommand | execCommandAsync executed ${command} failed | reason: ${reason}`);

        this.finishExecCommand();
      });
      return true;
    },
    execScenarioAsync: async function (scenario: CompiledScenario) {
      this.scenario = { ...scenario, index: 0 };
      const fsm = this.slave_fsm;
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
              while (fsm.js_fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.js_fsm.step();
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
              while (fsm.js_fsm.can("step")) {
                console.log("execScenarioAsync: wait step()")
                await fsm.js_fsm.step();
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
