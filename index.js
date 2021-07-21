import StateMachine from "javascript-state-machine";
import visualize from "javascript-state-machine/lib/visualize.js";
import StateMachineHistory from "javascript-state-machine/lib/history.js";

import graphviz from "graphviz";

// хранение состояния манипулятора
// восстановление и сопоставление состояния манипулятора по датчикам
// прием команд через внешние запросы
// проверка команд на валидность и возможность для текущего состояния
// запуск соответствующих циклов внутри домкрата
// контроль выполнения циклов, отображение состояния внутри цикла
// доступ по web
// передача точек пути для сдвига рамы

let states = [
  "lifting topframe",
  "sinking topframe",
  "lifting bottomframe",
  "sinking bottomframe",
  "holding topframe",
  "waiting",
];

const ext_transitions = [
  {
    name: "liftUpFrameCycle",
    from: ["on_pins", "on_pins_only"],
    to: "liftingUpFrame",
  },
  { name: "step", from: "liftingUpFrame", to: "on_pins_only" },
  { name: "step", from: "liftingUpFrame", to: "up_limit" },
  // { name: "step", from: "on_pins_only", to: "up_limit" },
  {
    name: "holdFrame",
    from: ["on_pins", "on_pins_only", "up_limit"],
    to: "holding_frame_cycle",
  },
  { name: "step", from: "holding_frame_cycle", to: "holding_frame" },
  {
    name: "prepare_to_lifting_bottom_frame",
    from: "holding_frame",
    to: "prepareing_to_lifting_bottom_frame",
  },
  {
    name: "prepare_to_top_frame_moveing",
    from: "holding_frame",
    to: "prepareing_to_top_frame_moveing",
  },
  {
    name: "step",
    from: "prepareing_to_top_frame_moveing",
    to: "up_limit",
  },
  {
    name: "step",
    from: "prepareing_to_top_frame_moveing",
    to: "on_pins",
  },
  {
    name: "step",
    from: "prepareing_to_top_frame_moveing",
    to: "on_pins_only",
  },
  {
    name: "step",
    from: "prepareing_to_lifting_bottom_frame",
    to: "on_external_support",
    dot: { tailport: "s", headport: "n" },
  },
  {
    name: "pushin_crab",
    from: "on_external_support",
    to: "pushing_in_crab_cycle",
  },
  {
    name: "step",
    from: "pushing_in_crab_cycle",
    to: "ready_to_lifting_bottom_frame",
  },
  {
    name: "pushout_crab",
    from: "ready_to_lifting_bottom_frame",
    to: "pushing_out_crab_cycle",
  },
  {
    name: "step",
    from: "pushing_out_crab_cycle",
    to: "on_external_support",
  },
  {
    name: "liftUpBottomFrame",
    from: "ready_to_lifting_bottom_frame",
    to: "lifting_up_bottom_frame_cycle",
  },
  {
    name: "step",
    from: "lifting_up_bottom_frame_cycle",
    to: "ready_to_lifting_bottom_frame",
  },
  {
    name: "step",
    from: "lifting_down_bottom_frame_cycle",
    to: "ready_to_lifting_bottom_frame",
  },
  {
    name: "liftDownBottomFrame",
    from: "ready_to_lifting_bottom_frame",
    to: "lifting_down_bottom_frame_cycle",
  },
  {
    name: "land_bottom_frame_to_pins",
    from: "on_external_support",
    to: "landing_bottom_frame_to_pins",
  },
  {
    name: "step",
    from: "landing_bottom_frame_to_pins",
    to: "on_pins",
  },

  {
    name: "horizontal_move_top_frame",
    from: "holding_frame",
    to: "horizontal_moveing_cycle",
  },
  {
    name: "step",
    from: "horizontal_moveing_cycle",
    to: "holding_frame",
  },

  {
    name: "liftDownFrame",
    from: ["up_limit", "on_pins_only"],
    to: "liftingDownFrame",
  },
  {
    name: "step",
    from: "liftingDownFrame",
    to: "on_pins_only",
  },
  {
    name: "step",
    from: "liftingDownFrame",
    to: "on_pins",
  },
  {
    name: "gotoNextState",
    from: "*",
    to: function () {
      return this.next_state;
    },
  },
];
var fsm = new StateMachine({
  init: "on_pins",
  transitions: ext_transitions,
  data: {
    current_level: 0,
    top_level: 4,
    next_state: "",
    funct_todo_in_step: (resolve, reject) => {},
  },
  methods: {
    onLeaveLiftingUpFrame: function (lifecycle) {
      if (lifecycle.transition == "gotoNextState") return true;

      this.funct_todo_in_step = (resolve, reject) => {
        console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
        let flag = false;
        const mon = setInterval(() => {
          if (!flag) return;
          console.log(
            "подождали пока манипулятор исполнит цикл " + lifecycle.from
          );
          resolve();
          clearInterval(mon);
        }, 100);
        setTimeout(() => (flag = true), 1000);
      };
      this.current_level += 1;
      if (this.current_level >= this.top_level) this.next_state = "up_limit";
      else this.next_state = "on_pins_only";

      return false;
    },

    onLeaveHoldingFrameCycle: function (lifecycle) {
      if (lifecycle.transition == "gotoNextState") return true;

      this.funct_todo_in_step = (resolve, reject) => {
        console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
        let flag = true;
        const mon = setInterval(() => {
          if (!flag) return;
          console.log(
            "подождали пока манипулятор исполнит цикл " + lifecycle.from
          );
          resolve();
          clearInterval(mon);
        }, 100);
        setTimeout(() => (flag = true), 2000);
      };
      this.current_level += 1;
      if (this.current_level >= this.top_level) this.next_state = "up_limit";
      else this.next_state = "on_pins_only";

      return false;
    },

    onBeforeGotoNextState: function () {
      if (this.next_state === "") return false;
      return new Promise(this.funct_todo_in_step);
    },
    onAfterGotoNextState: function () {
      this.next_state = "";
    },

    doStep: function () {
      if (this.cannot("step")) return false;
      this.step();
      this.gotoNextState();
    },
  },
  plugins: [new StateMachineHistory()],
});

function updateImage() {
  let tran = [...ext_transitions];
  tran.map((edge) => {
    if (edge.name === "step") {
      if (!edge["dot"]) edge["dot"] = { color: "blue" };
      else edge.dot["color"] = "blue";

      edge.name = " ";
    }
  });
  var fsm_image = new StateMachine({
    init: "on_pins",
    transitions: tran,
  });

  graphviz.parse(visualize(fsm_image, { orientation: "vertical" }), (gg) =>
    // gg.output("svg", "test01.svg")
    {
      gg.getNode(fsm.state).set("color", "red");
      gg.output("png", "test01.png");
    }
  );
}

const history_upd = setInterval(() => {
  // process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(
    JSON.stringify(fsm.history) + "; can: " + JSON.stringify(fsm.transitions())
  );
  // process.stdout.write("\n"); // end the line
  // console.log(fsm.history + `\r`);
}, 150);

const commands = [
  "liftUpFrameCycle",
  "liftUpFrameCycle",
  "liftUpFrameCycle",
  "liftUpFrameCycle",
  "liftUpFrameCycle",
];
const eCommands = commands[Symbol.iterator]();
let curr_cmd = eCommands.next();
let cmd_exec = setInterval(() => {
  if (!curr_cmd.done) {
    if (fsm.cannot(curr_cmd.value)) return;
    console.log("command to FSM: " + curr_cmd.value);
    fsm[curr_cmd.value]();
    fsm.doStep();
    curr_cmd = eCommands.next();
  } else {
    console.log("commands reading finish");
    clearInterval(cmd_exec);
    clearInterval(history_upd);
  }
}, 1000);

updateImage();
// setInterval(() => updateImage(), 300);
