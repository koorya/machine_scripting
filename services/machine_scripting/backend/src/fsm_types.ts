import * as StateMachine from "javascript-state-machine";
import { resolveModuleName } from "typescript";
import * as MyTypes from "~shared/types/types";
import { ExtractByType, Machines, MM_address } from "~shared/types/types";

export interface iTransition {
  name: string;
  from: string;
  to: string | ((s: any) => {});
  dot?: any;
}
export interface iFsmConfig {
  init: string;
  transitions: iTransition[];
  data: unknown;
  methods: unknown;
}

export interface iCycleExecutorProps {
  cycle_name: string;
  lifecycle: any;
  resolve: () => void;
  reject: () => void;
}
export interface iStateMachine {
  cycleExecutor: (props: iCycleExecutorProps) => void;
  onAfterTransition: (lifecycle: any) => void;
  state: string;
  init: string;
  transitions: () => string[];
  history: string[];
  allStates: () => string[];
  can: (value: string) => boolean;
  cannot: (value: string) => boolean;
  goto: (state: string) => Promise<boolean>;
  step: () => Promise<boolean>;
}

export type iData = {
  init: string;
  cycle_state: number;
  status_message: string;
} & (
  | {
      type: "MD";
      level: number;
    }
  | {
      type: "MM";
      current_address: MM_address;
    }
);
export type ExcludeTypeProp<T, U> = {
 [Property in keyof T as (Property extends U ? never : Property)]: T[Property];
  
}
type BaseMethods = {
  [key: string]: ((...args: any) => Promise<boolean|void> | void | boolean) | string;
  onAfterTransition: (...args: any)=>Promise<boolean|void> | void | boolean;
  cycleExecutor: (props: {
    cycle_name: string;
    lifecycle: any;
    resolve: () => void;
    reject: () => void;
  }) => void;
};
export type iMethods = BaseMethods &
  (
    | {
        type: "MD";
      }
    | {
        type: "MM";
        onBeforeSetAddres: (
          lifecycle: unknown,
          address: MM_address
        ) => Promise<boolean|void> | void | boolean;
      }
  );


export type iPLCStateMachine<machine> = {
  type: machine;
  fsm: iStateMachine &
    MyTypes.ExtractByType<iData, machine> &
    MyTypes.ExtractByType<iMethods, machine>;
  virt: {
    fsm: iStateMachine &
      MyTypes.ExtractByType<iData, machine> &
      MyTypes.ExtractByType<iMethods, machine>;
    init: (value: MyTypes.ScenarioStartCondition) => void;
  };
};
export function new_StateMachine<i_config, i_fsm>(config: i_config): i_fsm {
  return new StateMachine(config) as i_fsm;
}

export interface iController extends iStateMachine {
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
  fsm: iPLCStateMachine<Machines>;
}
