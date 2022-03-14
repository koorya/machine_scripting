import * as StateMachine from "javascript-state-machine";
import { BuildingComponent, MachineAdditionalParams, RequestMatching, ScenarioStartCondition } from "~shared/types/types";
import { CompiledScenario, ControllerStatus, Machines, MachineStatus, MM_address } from "~shared/types/types";
import { API } from "./api/api";
import { ToPascal, ExtractByType } from "./types/utils";
import { IPlcConnector } from "./zmq_network";
import { CommandsVithParameters } from "~shared/commands/ext_commands"

type Transition = {
  name: string;
  from: string;
  to: string | ((s: any) => {});
  dot?: any;
  comment?: string;
};
type States = {
  name: string;
  comment: string;
};
export interface GraphOfStates {
  transitions: Transition[];
  states: States[];
  init: string;
}
export interface iFsmConfig {
  init: string;
  transitions: Transition[];
  methods: unknown;
}

export type LifeCycle<states extends string = string, transitions extends string = string> = {
  from: states;
  to: states;
  transition: transitions;
};

export type iCycleExecutorProps = {
  cycle_name: string;
  plc_connector: IPlcConnector;
} & (
    | {
      type: "CONTROLLER"
    }
    | {
      type: "MD";

      lifecycle: LifeCycle;
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
  onAfterTransition: (lifecycle: LifeCycle) => void;
  onBeforeTransition: (lifecycle: LifeCycle) => void;
  AbortSignalListener: () => void;
  state: string;
  init: string;
  transitions: () => string[];
  history: string[];
  allStates: () => string[];
  can: (value: string) => boolean;
  cannot: (value: string, porps?: any) => boolean;
  goto: (state: string) => Promise<boolean>;
  step: () => Promise<boolean>;
}

type PlcMachineData =
  {
    cycle_state: number;
    status_message: string;
    plc: IPlcConnector;
  }
  & (
    | {
      type: "MD";
      current_level: number;
      top_level: number;
    }
    |
    Extract<MachineAdditionalParams, { type: "MM" }>
    | {
      type: "MP";
      length: number;
    }
  );

export type ExtConfig = | {
  type: "MASTER";
  ext_config: { [key in "mm" | "md" | "mp"]: number }
}
  | {
    type: "MP" | "MD" | "MM";
    ext_config: { zmq_port: number };

  };

export type MachineData = (
  | PlcMachineData
  | {
    type: "MASTER";
    ext_config: { [key in keyof (Extract<ExtConfig, { type: "MASTER" }>["ext_config"])]: API<RequestMatching> };
    current_element: BuildingComponent;
    current_level: BuildingComponent[];
  }
);


export type iData = (
  {
    init: string;
    is_test: boolean;
    abort_controller: AbortController;
  }
  & MachineData
)
  | {
    type: "CONTROLLER";
    slave_fsm: iPLCStateMachine<Exclude<Machines, "CONTROLLER">>;
    should_stop: boolean,
    scenario: CompiledScenario,
  };
export type ExcludeTypeProp<T, U> = {
  [Property in keyof T as (Property extends U ? never : Property)]: T[Property];

}
type BaseMethods = {
  // [key: string]: ((...args: any) => Promise<boolean|void> | void | boolean) | string;
  // getMachineStatus: () => MachineStatus;
};
export type iMethods = BaseMethods &
  (
    | {
      type: "CONTROLLER"
      finishExecCommand?: () => void;
      pause?: () => void;
      stop?: () => void;
      execCommandAsync: (this: CustomThisType<"CONTROLLER">, command: string | { name: string; props: unknown }) => Promise<void>;
      execScenarioAsync: (this: CustomThisType<"CONTROLLER">, scenario: CompiledScenario) => Promise<void>;
      getControllerStatus: (this: CustomThisType<"CONTROLLER">) => ReturnType<iController["getControllerStatus"]>;
    }
    | {
      type: "MD";
    }
    | {
      type: "MM";
      isAddressValid: (adress: MM_address) => boolean;
    }
    | {
      type: "MP";
    }
    | {
      type: "MASTER";
    }
  );
export type SpecificMethods<machine extends Machines> = {
  getMachineStatus: (this: CustomThisType<machine>) => Extract<MachineStatus, { type: machine }>;
  AbortSignalListener: (this: CustomThisType<machine>) => void;
} & Omit<Extract<iMethods, { type: machine }>, "type">;


export type iPLCStateMachine<machine extends Exclude<Machines, "CONTROLLER">> = {
  type: machine;
  js_fsm: iStateMachine &
  ExtractByType<iData, machine> &
  SpecificMethods<machine>;
  virt: {
    js_fsm: iStateMachine &
    ExtractByType<iData, machine> &
    SpecificMethods<machine>;
    init: (value: ScenarioStartCondition) => void;
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



type OnBaseMethodsName =
  | 'onAfterTransition'
  | 'onTransition'
  | 'onLeaveState'
  | 'onBeforeTransition';

type OnSpecificMethodsName<States extends string, Transitions extends string> =
  | `onLeave${ToPascal<States>}`
  | `onBefore${ToPascal<Transitions>}`
  | `onBefore${ToPascal<States>}`
  | `on${ToPascal<States>}`
  | `on${ToPascal<Transitions>}`
  | `onAfter${ToPascal<Transitions>}`
  | OnBaseMethodsName;


export type CustomThisType<MACHINE extends Machines> =
  ExtractByType<iData, MACHINE> &
  ExcludeTypeProp<ExtractByType<iMethods, MACHINE>, "type">
  & iStateMachine;

type t = CommandsVithParameters;

type s = keyof CommandsVithParameters

type Arg<T extends string> = T extends s ? t[T] : never;


export type OnMethods<Machine extends Machines, States extends string, Transitions extends string> = {
  [key in Transitions as OnSpecificMethodsName<States, key>]?:
  (this: CustomThisType<Machine> & OnMethods<Machine, States, Transitions>,
    lifecycle: LifeCycle<States, Transitions | "goto">,
    arg_ext?: Arg<key>
  ) => (Promise<boolean | void> | void | boolean);
};

export type FSMMethods<
  machine extends Machines,
  states extends string,
  transitions extends string> =
  SpecificMethods<machine>
  & OnMethods<machine, states, transitions>;




