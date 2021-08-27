export type Command = { command: string; payload?: any };
export type MachineStatus = {
  state: string;
  cycle_step: number;
  current_level: number;
};
export type ScenarioStatus = {
  name: string;
  step_index: number;
};
export type ControllerStatus = {
  state: string;
  scenario_status?: ScenarioStatus;
  machine_status: MachineStatus;
};

export type ScenarioStartCondition = { level: number; state: string };

export type ScenarioError = {
  error: string;
  index: number;
  cmd?: string;
  level?: number;
};

export type ScenarioErrorRequest = {
  starting_condition: ScenarioStartCondition;
  compiled_scenario: string[];
};

export type ScenarioDefenition = {
  name: string;
  starting_condition: ScenarioStartCondition;
  script: string;
};
