import * as StateMachine from "javascript-state-machine";

async function slowPrint(msg) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log(msg);
      resolve(null);
    }, 1000);
  });
}

var FSMController = StateMachine.factory({
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
  data: function (fsm) {
    return {
      fsm: fsm,
      should_stop: false,
      scenario: null,
    };
  },
  methods: {
    execCommandAsync: async function (command: string) {
      console.log(`command: "${command}" execution start`);
      console.log(`fsm state: ${this.fsm.state}`);
      if (this.fsm.cannot(command)) console.log("invalid cmd");
      else {
        const is_command_exec = await this.fsm[command]();
        if (this.fsm.can("step")) await this.fsm.step();
        if (!is_command_exec) console.log("command exec error");
      }
      // await (() => new Promise((resolve) => setTimeout(resolve, 1000)))(); // sleep 1000 ms
      console.log(`command: "${command}" execution finish`);
      return;
    },
    onExecCommand: function (lifecycle, command: string) {
      if (this.fsm.cannot(command)) return false;

      console.log(this.execCommandAsync);
      this.execCommandAsync(command).then(() => {
        this.finishExecCommand();
      });
      return true;
    },
    execScenarioAsync: async function (scenario: {
      name: string;
      commands: string[];
    }) {
      this.scenario = { ...scenario, index: 0 };
      const commands = scenario.commands;
      const eCommands = commands[Symbol.iterator]();
      const execNextCmd = async () => {
        let stop_flag = false;
        while (!stop_flag) {
          if (this.state === "paused") {
            await (() => new Promise((resolve) => setTimeout(resolve, 200)))(); // sleep 200 ms
            console.log("paused");
            continue;
          }
          const curr_cmd = eCommands.next();
          if (!curr_cmd.done && !this.should_stop) {
            try {
              await this.execCommandAsync(curr_cmd.value);
            } catch {
              console.log("error during executing command");
              if (this.can("stop")) this.stop();
            }
          } else {
            stop_flag = true;
            if (this.can("stop")) this.stop();
          }
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
    onPause: function () {},
    onResume: function () {},
    onTransition: function (lifecycle) {
      console.log(`controller state: ${lifecycle.to}`);
    },
  },
});

export { FSMController };
