import * as StateMachine from "javascript-state-machine";
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
  methods: { [key: string]: (arg0: any) => Promise<void> | void | boolean };
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
  transitions: () => string[];
  history: string[];
  allStates: () => string[];
  can: (value: string) => boolean;
  cannot: (value: string) => boolean;
  goto: (state: string) => Promise<boolean>;
  step: () => Promise<boolean>;
}

export interface iPLCStateMachine<i_fsm> {
  fsm: i_fsm;
  virt: { fsm: i_fsm; init: (value: { state: string; level: number }) => void };
}
export function new_StateMachine<i_config, i_fsm>(config: i_config): i_fsm {
  return new StateMachine(config) as i_fsm;
}
