export type Command = { command: string; payload?: any };

type ExtractByType<A, machine> = A extends { type: machine } ? A : never;

export type Machines = "MM" | "MD";

export type MM_address = { cassete: number; pos: number };

export type ScenarioStartCondition = { state: string } & (
  | { type: "MD"; level: number }
  | { type: "MM"; address: MM_address }
);

export type MachineStatus = {
  cycle_step: number;
  status_message: string;
} & ScenarioStartCondition;

export type ScenarioStatus = {
  name: string;
  step_index: number;
};
export type ControllerStatus = {
  state: string;
  scenario_status?: ScenarioStatus;
} & (
  | {
      type: "MD";
      machine_status: ExtractByType<MachineStatus, "MD">;
    }
  | {
      type: "MM";
      machine_status: ExtractByType<MachineStatus, "MM">;
    }
);

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
