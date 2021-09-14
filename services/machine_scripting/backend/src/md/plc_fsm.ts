import {
  md_fsm_config,
  transitions,
  iMD_FsmData,
  iMD_FsmConfig,
} from "./state_machine_cfg";
import {
  iCycleExecutorProps,
  iStateMachine,
  iPLCStateMachine,
  new_StateMachine,
} from "../fsm_types";
import * as plc from "../zmq_network";

interface iMD_Fsm extends iStateMachine, iMD_FsmData {}

// function switch controls cycle executing
// in PLC.
const md_cycleExecutor = function (props: iCycleExecutorProps) {
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
      plc_fsm.fsm.cycle_state = plc_variables[`${cycle_name}_state`];
      plc_fsm.fsm.status_message = plc_variables["status_message"];
      mon = setTimeout(run, 100);
      if (plc_fsm.fsm.cycle_state == 98) {
        console.log("ошибка при исполнении цикла " + lifecycle.from);
        reject();
        clearTimeout(mon);
      }
      if (plc_fsm.fsm.cycle_state != 99) return;
      console.log("подождали пока манипулятор исполнит цикл " + lifecycle.from);
      resolve();
      clearTimeout(mon);
    };
    run();
  });
};

// расширенный объект, помимо всех этих полей должно
// быть поле с тестовым вариантом машины состояний
var plc_fsm: iPLCStateMachine<iMD_Fsm> = {
  fsm: new_StateMachine<iMD_FsmConfig, iMD_Fsm>({
    ...md_fsm_config,
    methods: { ...md_fsm_config.methods, cycleExecutor: md_cycleExecutor },
  }),
  virt: {
    fsm: new_StateMachine<iMD_FsmConfig, iMD_Fsm>({
      ...md_fsm_config,
      transitions: [
        ...md_fsm_config.transitions,
        {
          name: "goto",
          from: "*",
          to: function (s) {
            return s;
          },
        },
      ],
    }),
    init: async (value) => {
      console.log(`init exec: ${JSON.stringify(value, null, 2)}`);
      if (value != null) {
        await plc_fsm.virt.fsm.goto(value.state);
        plc_fsm.virt.fsm.current_level = value.level;
      }
    },
  },
};

export { plc_fsm };
