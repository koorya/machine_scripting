import * as fs from "fs";
import { ExtractByType, MM_address } from "~shared/types/types";
import {
  iFsmConfig,
  iTransition,
  iData,
  iMethods,
  ExcludeTypeProp,
} from "../fsm_types";

const transitions: iTransition[] = JSON.parse(
  fs.readFileSync("src/mm/transitions.json").toString()
);

const init: string = "standby";
const fsm_config: iFsmConfig & {
  data: ExtractByType<iData, "MM">;
  methods: ExcludeTypeProp<ExtractByType<iMethods, "MM">, "type">;
} = {
  init: init,
  transitions: transitions,
  data: {
    type: "MM",
    init: init,
    current_address: { cassete: 0, pos: 0 },
    cycle_state: 0,
    status_message: "no",
  },
  methods: {
    cycleExecutor: function (props) {
      props.resolve();
    },
    isAddressValid: function (address: MM_address) {
      console.log(`address validation: ${JSON.stringify(address, null, 2)}`);
      if (address != null) {
        return true;
      }
      console.log("not valid");
      return false;
    },
    onBeforeSetAddres: function (lifecycle, address: MM_address) {
      if (!this.isAddressValid(address)) return false;
      return true;
    },
    onAfterTransition: function (lifecycle) {
      return true;
    },
  },
};
export { fsm_config, transitions };
