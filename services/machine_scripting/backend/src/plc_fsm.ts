import * as StateMachine from "javascript-state-machine";
import { fsm_config, transitions, FsmData } from "./state_machine_cfg";
import * as plc from "./zmq_network";

type CycleExecutorProps = {
  cycle_name: string;
  lifecycle: any;
  resolve: () => void;
  reject: () => void;
};
interface StateMachineType extends FsmData {
  cycleExecutor: (props: CycleExecutorProps) => void;
  onAfterTransition: (lifecycle: any) => void;
  state: string;
  transitions: () => string[];
  history: string[];
  allStates: () => string[];
}

var fsm: StateMachineType = new StateMachine(fsm_config);
// function switch controls cycle executing
// in PLC.
fsm.cycleExecutor = function (props: CycleExecutorProps) {
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
      const plc_variables = await plc.readVarToObj([
        `${cycle_name}_state`,
        "status_message",
      ]);
      fsm.cycle_state = plc_variables[`${cycle_name}_state`];
      fsm.status_message = plc_variables["status_message"];
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
