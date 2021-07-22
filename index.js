import StateMachine from "javascript-state-machine";
import visualize from "javascript-state-machine/lib/visualize.js";
import StateMachineHistory from "javascript-state-machine/lib/history.js";

import graphviz from "graphviz";
import fs from "fs";
import { resolve } from "path";

// хранение состояния манипулятора
// восстановление и сопоставление состояния манипулятора по датчикам
// прием команд через внешние запросы
// проверка команд на валидность и возможность для текущего состояния
// запуск соответствующих циклов внутри домкрата
// контроль выполнения циклов, отображение состояния внутри цикла
// доступ по web
// передача точек пути для сдвига рамы

const ext_transitions = JSON.parse(fs.readFileSync("transitions.json"));

var fsm = new StateMachine({
  init: "on_pins_support",
  transitions: ext_transitions,
  data: {
    current_level: 0,
    top_level: 4,
  },
  methods: {
    onBeforeLiftUpFrameCycle: function () {
      console.log("level: " + this.current_level + "\n");
      if (this.current_level >= this.top_level) return false;
      return true;
    },
    onBeforeLiftDownFrameCycle: function () {
      if (this.current_level <= 0) return false;
      return true;
    },
    onLeaveLiftingUpFrame: function (lifecycle) {
      return new Promise((resolve, reject) => {
        console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
        let flag = false;
        const mon = setInterval(() => {
          if (!flag) return;
          resolve();
          this.current_level += 1;
          console.log(
            "подождали пока манипулятор исполнит цикл " + lifecycle.from
          );
          clearInterval(mon);
        }, 100);
        setTimeout(() => (flag = true), 1000);
      });
    },

    onLeaveLiftingDownFrame: function (lifecycle) {
      return new Promise((resolve, reject) => {
        console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
        let flag = false;
        const mon = setInterval(() => {
          if (!flag) return;
          console.log(
            "подождали пока манипулятор исполнит цикл " + lifecycle.from
          );
          resolve();
          this.current_level -= 1;
          clearInterval(mon);
        }, 100);
        setTimeout(() => (flag = true), 1000);
      });
    },

    onLeaveHoldingFrameCycle: function () {
      return new Promise((resolve, reject) => {
        const cycle_check = setInterval(() => {
          console.log("holding frame cycle continues");
        }, 100);
        setTimeout(() => {
          clearInterval(cycle_check);
          resolve();
        }, 2000);
      });
    },
    onBeforeTransition: function (lifecycle) {
      if (lifecycle.transition == "init") return true;
      console.log(lifecycle.to);
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve();
          console.log(lifecycle.to);
        }, 500);
      });
    },
    onAfterTransition: function (lifecycle) {
      updateImage();
      if (this.transitions().includes("step"))
        setTimeout(() => {
          this.step();
        }, 250);
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
    init: "on_pins_support",
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

const commands = JSON.parse(fs.readFileSync("algorithms.json"));
const eCommands = commands[Symbol.iterator]();
let curr_cmd = eCommands.next();
let cmd_exec = setInterval(() => {
  if (!curr_cmd.done) {
    if (fsm.cannot(curr_cmd.value)) return;
    console.log("command to FSM: " + curr_cmd.value);
    fsm[curr_cmd.value]();
    curr_cmd = eCommands.next();
  } else {
    console.log("commands reading finish");
    clearInterval(cmd_exec);
    setTimeout(() => {
      clearInterval(history_upd);
    }, 1000);
  }
}, 1000);
