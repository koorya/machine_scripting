import * as StateMachine from "javascript-state-machine";
import { CommandConveyor } from "./command_iterator";
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

    const this_t: ThisT = this;
    const conv = new CommandConveyor();
    const run = async () => {
      let curr_cmd = conv.getNextCmd();
      const parced_cmd = parseCommand(curr_cmd);
      if (this_t?.slave_fsm?.js_fsm?.can(parced_cmd.name)) {
        try {
          await ((this_t.slave_fsm.js_fsm[parced_cmd.name] as (
            ...arg: any
          ) => Promise<boolean>)(parced_cmd.props))
        } catch (reason) {
          console.log(`error when exec cmd: ${parced_cmd.name} | reason: ${reason}`);

          conv.clearCmdSequenceFull();
          if (this_t.can('stop'))
            this_t.stop();
          else if (this_t.can('finishExecCommand'))
            this_t.finishExecCommand();
        }
      }
      setTimeout(run, 50);
    };
    run();

    return {
      type: "CONTROLLER",
      slave_fsm: slave_fsm,
      should_stop: false,
      scenario: null,
      conveyor: conv,
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

    onExecCommand: function (lifecycle, command: string) {
      const this_t: ThisT = this;
      const fsm = this_t.slave_fsm as iPLCStateMachine<Machines>;
      if (fsm.js_fsm.cannot(parseCommand(command).name)) return false;
      this_t.conveyor.addCommandSeqVithCallback([command], () => this_t.finishExecCommand());

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
              // допустим мы должны ожидать пока не вылезем в какое-нибудь 
              // полностью стабильное состояние
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
    onExecScenario: function (lifecycle, scenario: CompiledScenario) {
      const this_t: ThisT = this;
      this_t.should_stop = false;
      this_t.scenario = { ...scenario, index: 0 };

      // this_t.execScenarioAsync(scenario);
      this_t.conveyor.addCommandSeqVithCallback(scenario.commands, () => this_t.stop(), async () => { this_t.scenario.index += 1; });

    },
    onStop: function () {
      const this_t: ThisT = this;
      this_t.conveyor.clearCmdSequenceFull();
    },
    onPause: function () {
      const this_t: ThisT = this;
      this_t.conveyor.clearCmdSequenceAndSave();
    },
    onResume: function () {
      const this_t: ThisT = this;
      this_t.conveyor.resumeSavedCmdSeq(() => this_t.stop(), async () => { this_t.scenario.index += 1; })
    },
    onTransition: function (lifecycle) {
      console.log(`controller state: ${lifecycle.to}`);
    },
  },
});

export { FSMController };
