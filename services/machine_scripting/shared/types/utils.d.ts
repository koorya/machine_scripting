import { ExcludeTypeProp, iData, iFsmConfig, iMethods, iStateMachine, LifeCycle } from "src/fsm_types";
import { ExtractByType, Machines, MachineStatus } from "./types";

export type ToPascal<S extends string> =
  S extends `${infer Head}_${infer Tail}`
  ? `${Capitalize<Head>}${Capitalize<ToPascal<Tail>>}`
  : Capitalize<S>;


type OnMethodsName<States extends string, Transitions extends string> =
  | `onLeave${ToPascal<States>}`
  | `onBefore${ToPascal<Transitions>}`
  | `onBefore${ToPascal<States>}`
  | `on${ToPascal<States>}`
  | `on${ToPascal<Transitions>}`
  | `onAfter${ToPascal<Transitions>}`
  | 'onAfterTransition'
  | 'onTransition'
  | 'onLeaveState'
  | 'onBeforeTransition';


type CustomThisType<MACHINE extends Machines> = Extract<iFsmConfig, { data }>["data"] &
  ExtractByType<iData, MACHINE> &
  ExcludeTypeProp<ExtractByType<iMethods, MACHINE>, "type">
  & iStateMachine;

type OnMethods<Machine extends Machines, States extends string, Transitions extends string> = {
  [key in OnMethodsName<States, Transitions>]?: (this: CustomThisType<Machine>, lifecycle: LifeCycle, ...args: any
  ) => Promise<boolean | void> | void | boolean;
} & { getMachineStatus: (this: CustomThisType<Machine>) => Extract<MachineStatus, { type: Machine }> };

