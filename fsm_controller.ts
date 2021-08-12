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
      name: "exec_scenario",
      from: "available",
      to: "executing_scenario",
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
    };
  },
  methods: {
    execScenarioAsync: async function (scenario: {
      name: string;
      commands: string[];
    }) {
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
              await slowPrint(curr_cmd.value);
            } catch {
              console.log("error during executing command");
              if (this.can("stop")) this.stop();
            }
          } else {
            stop_flag = true;
            if (this.can("stop")) this.stop();
          }
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
  },
});

var test_fsm = new FSMController(null);

test_fsm.execScenario({
  namme: "my scenario",
  commands: [
    "command1",
    "command2",
    "command3",
    "command4",
    "command5",
    "command6",
  ],
});
// setTimeout(() => test_fsm.stop(), 2900);
setTimeout(() => test_fsm.pause(), 2500);
setTimeout(() => test_fsm.resume(), 4500);

setInterval(() => console.log(test_fsm.state), 300);
