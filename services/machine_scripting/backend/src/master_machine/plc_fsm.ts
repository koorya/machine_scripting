import { createFSMConfig, graph } from "./state_machine_cfg";
import {
  iStateMachine,
  iPLCStateMachine,
  new_StateMachine,
  ExtConfig,
} from "../fsm_types";
import { ScenarioStartCondition } from "~shared/types/types";
import { ExtractByType } from "~shared/types/utils"

// function switch controls cycle executing
// in PLC.

// расширенный объект, помимо всех этих полей должно
// быть поле с тестовым вариантом машины состояний
function createPlcFsm(ext_config: Extract<ExtConfig, { type: "MASTER" }>["ext_config"]) {
  const fsm_config = createFSMConfig(ext_config);

  var plc_fsm: iPLCStateMachine<"MASTER"> = {
    type: "MASTER",
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
            return s.state;
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

      init: async (value: ExtractByType<ScenarioStartCondition, "MASTER">) => {
        console.log(`init exec: ${JSON.stringify(value, null, 2)}`);
        if (value != null) {
          await plc_fsm.virt.js_fsm.goto(value.state);
        }
      },
    },
  };
  return plc_fsm;
}

export { createPlcFsm, graph };
