import * as StateMachine from "javascript-state-machine";
import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachineHistory from "javascript-state-machine/lib/history.js";

import * as graphviz from "graphviz";
import * as fs from "fs";
import { resolve } from "path";
import * as plc from "./zmq_network";

import * as express from "express";
import * as cors from "cors";
import { RequestHandler } from "express-serve-static-core";

// хранение состояния манипулятора
// восстановление и сопоставление состояния манипулятора по датчикам
// прием команд через внешние запросы
// проверка команд на валидность и возможность для текущего состояния
// запуск соответствующих циклов внутри домкрата
// контроль выполнения циклов, отображение состояния внутри цикла
// доступ по web
// передача точек пути для сдвига рамы

const ext_transitions = JSON.parse(
  fs.readFileSync("transitions.json").toString()
);

function cycleExecutor(props: {
  cycle_name: string;
  lifecycle: any;
  resolve: () => void;
  reject: () => void;
}) {
  const cycle_name = props.cycle_name;
  const lifecycle = props.lifecycle;
  const resolve = props.resolve;
  const reject = props.reject;

  console.log("ожидаем пока манипулятор исполнит цикл " + lifecycle.from);
  const var_obj = {};
  var_obj[`${cycle_name}_state`] = 0;
  var_obj[`start_${cycle_name}_handle`] = true;

  plc.writeVar(var_obj).then(() => {
    var mon = setTimeout(async function run() {
      let cycle_state = (await plc.readVar([`${cycle_name}_state`]))[0].value;
      mon = setTimeout(run, 100);
      if (cycle_state == 98) {
        console.log("ошибка при исполнении цикла " + lifecycle.from);
        reject();
        clearTimeout(mon);
      }
      if (cycle_state != 99) return;
      console.log("подождали пока манипулятор исполнит цикл " + lifecycle.from);
      resolve();
      clearTimeout(mon);
    }, 100);
  });
}

var fsm = new StateMachine({
  init: "on_pins_support",
  transitions: ext_transitions,
  data: {
    current_level: 0,
    top_level: 4,
  },
  methods: {
    onBeforeLiftUpFrame: function () {
      console.log("level: " + this.current_level + "\n");
      if (this.current_level >= this.top_level) return false;
      return true;
    },
    onBeforeLiftDownFrame: function () {
      if (this.current_level <= 0) return false;
      return true;
    },
    onLeaveLiftingUpFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) =>
        cycleExecutor({
          cycle_name: "up_frame_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level += 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        })
      );
    },

    onLeaveLiftingDownFrameCycle: function (lifecycle) {
      return new Promise((resolve, reject) =>
        cycleExecutor({
          cycle_name: "down_frame_cycle",
          lifecycle: lifecycle,
          resolve: () => {
            this.current_level -= 1;
            resolve(null);
          },
          reject: () => {
            reject();
          },
        })
      );
    },

    onLeaveHoldingFrameCycle: function () {
      return new Promise((resolve, reject) => {
        let cnt = 0;
        const cycle_check = setInterval(() => {
          process.stdout.cursorTo(0);
          process.stdout.write("holding frame cycle continues : " + cnt);
          cnt += 1;
        }, 200);
        setTimeout(() => {
          clearInterval(cycle_check);
          resolve(null);
          console.log("");
        }, 5000);
      });
    },

    onAfterTransition: function (lifecycle) {
      if (lifecycle.transition == "init") return true;
      updateImage();
      // updateHistory();
      if (this.transitions().includes("step"))
        setTimeout(() => {
          this.step();
        }, 250);
    },
  },
  plugins: [new StateMachineHistory()],
});
let rendered_image = null;
async function updateImage() {
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

  await graphviz.parse(
    visualize(fsm_image, { orientation: "vertical" }),
    (gg) =>
      // gg.output("svg", "test01.svg")
      {
        gg.getNode(fsm.state).set("color", "red");
        gg.output("png", (buff) => {
          rendered_image = buff.toString("base64");
        });
        console.log("rendered");
      }
  );
  resolve();
}
function updateHistory() {
  console.log(
    JSON.stringify(fsm.history) + "; can: " + JSON.stringify(fsm.transitions())
  );
}
// const history_upd = setInterval(updateHistory, 150);

const commands = JSON.parse(fs.readFileSync("algorithms.json").toString());
const eCommands = commands[Symbol.iterator]();
let curr_cmd = eCommands.next();
// let cmd_exec = setInterval(() => {
//   if (!curr_cmd.done) {
//     if (fsm.cannot(curr_cmd.value)) return;
//     console.log("command to FSM: " + curr_cmd.value);
//     fsm[curr_cmd.value]();
//     curr_cmd = eCommands.next();
//   } else {
//     console.log("commands reading finish");
//     clearInterval(cmd_exec);
//     setTimeout(() => {
//       // clearInterval(history_upd);
//     }, 1000);
//   }
// }, 1000);

const app = express();
const port = 5001;
app.use(express.json());
app.use(cors());

app.get("/", (request, response) => {
  response.send("hello world");
});
app.get("/state", (request, response) => {
  response.send(fsm.state);
});
app.get("/commands", (request, response) => {
  response.send(fsm.transitions());
});

app.post("/command", (req, res) => {
  console.log(req.body);
  let cmd = req.body.command;
  if (fsm.cannot(cmd)) res.send("invalid cmd");
  else {
    fsm[cmd]();
    res.send("valid cmd");
  }
});
app.get("/image", (req, res) => {
  if (rendered_image === null) {
    updateImage().then(() => res.send(rendered_image));
    console.log(rendered_image);
  } else {
    res.send(rendered_image);
  }
});

app.listen(port, () => console.log(`running on port ${port}`));
