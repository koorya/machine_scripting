import * as StateMachine from "javascript-state-machine";
import { resolveModuleName } from "typescript";
import * as MyTypes from "~shared/types/types";
import { CompiledScenario, ControllerStatus, ExtractByType, Machines, MachineStatus, MM_address } from "~shared/types/types";
import { CommandConveyor } from "./command_iterator";
import { IPlcConnector } from "./zmq_network";

export interface iTransition {
  name: string;
  from: string;
  to: string | ((s: any) => {});
  dot?: any;
}
export interface iFsmConfig {
  init: string;
  transitions: iTransition[];
  data: { is_test: boolean };
  methods: unknown;
}

export type iCycleExecutorProps = {
  cycle_name: string;
  plc_connector: IPlcConnector;
} & (
    | {
      type: "CONTROLLER"
    }
    | {
      type: "MD";

      lifecycle: { from: string; };
      data: {
        cycle_state: number;
        status_message: string;
      };
    }
    | {
      type: "MM";
      config: { skip: number[] }
    }
    | {
      type: "MP";
    }
  );

export interface iStateMachine {
  onAfterTransition: (lifecycle: any) => void;
  state: string;
  init: string;
  transitions: () => string[];
  history: string[];
  allStates: () => string[];
  allTransitions: () => string[];
  can: (value: string) => boolean;
  cannot: (value: string) => boolean;
  goto: (state: string) => Promise<boolean>;
  step: () => Promise<boolean>;
  error?: () => Promise<boolean>;
}



export type iData = ({
  init: string;
  cycle_state: number;
  status_message: string;
  plc: IPlcConnector;
} & (
    | {
      type: "MD";
      current_level: number;
      top_level: number;
    }
    | {
      type: "MM";
      current_address: MM_address;
    }
    | {
      type: "MP";
      length: number;
    }
  ))
  | {
    type: "CONTROLLER";
    slave_fsm: iPLCStateMachine<Machines>;
    should_stop: boolean;
    scenario: CompiledScenario;
    conveyor: CommandConveyor;
  };
export type ExcludeTypeProp<T, U> = {
  [Property in keyof T as (Property extends U ? never : Property)]: T[Property];

}
type BaseMethods = {
  // [key: string]: ((...args: any) => Promise<boolean|void> | void | boolean) | string;
  getMachineStatus: () => MachineStatus;
  onAfterTransition: (...args: any) => Promise<boolean | void> | void | boolean;
};
export type iMethods = BaseMethods &
  (
    | {
      type: "CONTROLLER"
    }
    | {
      type: "MD";
    }
    | {
      type: "MM";
      onBeforeSetAddres: (
        lifecycle: unknown,
        address: MM_address
      ) => Promise<boolean | void> | void | boolean;
      isAddressValid: (adress: MM_address) => boolean;
    }
    | {
      type: "MP";
    }
  );


export type iPLCStateMachine<machine> = {
  type: machine;
  js_fsm: iStateMachine &
  MyTypes.ExtractByType<iData, machine> &
  MyTypes.ExtractByType<iMethods, machine>;
  virt: {
    js_fsm: iStateMachine &
    MyTypes.ExtractByType<iData, machine> &
    MyTypes.ExtractByType<iMethods, machine>;
    init: (value: MyTypes.ScenarioStartCondition) => void;
  };
};
export function new_StateMachine<i_config, i_fsm>(config: i_config): i_fsm {
  return new StateMachine(config) as i_fsm;
}

export interface iController extends iStateMachine, Extract<iData, { type: "CONTROLLER" }> {
  execCommand: (c: string) => boolean | Promise<boolean>;
  execScenario: (scenario: {
    name: string;
    commands: string[];
  }) => Promise<boolean>;
  scenario: {
    name: string;
    commands: string[];
    index: number;
  };
  getControllerStatus: () => ControllerStatus<Machines>;

}
