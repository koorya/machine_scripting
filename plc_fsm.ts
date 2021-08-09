import * as StateMachine from "javascript-state-machine";
import { fsm_config, transitions } from "./state_machine_cfg";
import * as plc from "./zmq_network";

var fsm = new StateMachine(fsm_config);
fsm.onAfterTransition = function (lifecycle) {
  if (lifecycle.transition == "init") return true;
  // updateHistory();
  if (fsm.transitions().includes("step"))
    setTimeout(() => {
      fsm.step();
    }, 250);
};
fsm.cycleExecutor = function (props: {
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
    var mon = setTimeout(() => null, 100);
    const run = async () => {
      fsm.cycle_state = (await plc.readVar([`${cycle_name}_state`]))[0].value;
      mon = setTimeout(run, 100);
      if (fsm.cycle_state == 98) {
        console.log("ошибка при исполнении цикла " + lifecycle.from);
        reject();
        clearTimeout(mon);
      }
      if (fsm.cycle_state != 99) return;
      console.log("подождали пока манипулятор исполнит цикл " + lifecycle.from);
      resolve();
      clearTimeout(mon);
    };
    run();
  });
};
export { fsm as plc_fsm };
