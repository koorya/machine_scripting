import { createFSMConfig, transitions } from "./state_machine_cfg";
import {
  iCycleExecutorProps,
  iStateMachine,
  iPLCStateMachine,
  new_StateMachine,
} from "../fsm_types";
import { ExtractByType, ScenarioStartCondition } from "~shared/types/types";
import { PlcConnector } from "../zmq_network";

// function switch controls cycle executing
// in PLC.

// расширенный объект, помимо всех этих полей должно
// быть поле с тестовым вариантом машины состояний
function createPlcFsm(port: number) {
  const fsm_config = createFSMConfig(new PlcConnector(port));

  var plc_fsm: iPLCStateMachine<"MP"> = {
    type: "MP",
    js_fsm: new_StateMachine<
      typeof fsm_config,
      iStateMachine & typeof fsm_config.data & typeof fsm_config.methods
    >({
      ...fsm_config,
      methods: { ...fsm_config.methods },
      transitions: [
        ...fsm_config.transitions,
        {
          name: "goto",
          from: "*",
          to: function (s) {
            return s;
          },
        },
      ],
    }),
    virt: {
      js_fsm: new_StateMachine<
        typeof fsm_config,
        iStateMachine & typeof fsm_config.data & typeof fsm_config.methods
      >({
        ...fsm_config,
        transitions: [
          ...fsm_config.transitions,
          {
            name: "goto",
            from: "*",
            to: function (s) {
              return s;
            },
          },
        ],
        data: { ...fsm_config.data, is_test: true },
      }),

      init: async (value: ExtractByType<ScenarioStartCondition, "MP">) => {
        console.log(`init exec: ${JSON.stringify(value, null, 2)}`);
        if (value != null) {
          await plc_fsm.virt.js_fsm.goto(value.state);
        }
      },
    },
  };
  return plc_fsm;
}

export { createPlcFsm, transitions };
