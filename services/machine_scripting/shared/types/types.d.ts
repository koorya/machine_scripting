export type Command = { command: string; payload?: any };

type ExtractByType<A, type> = A extends { type: type } ? A : never;

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

export type RequestMatching =
  | {
      type: "test";
      response: string[];
      request: unknown;
      method: "GET";
    }
  | {
      type: "commands";
      response: string[];
      request: unknown;
      method: "GET";
    }
  | {
      type: "controller_status";
      response: ControllerStatus | null;
      request: unknown;
      method: "GET";
    }
  | {
      type: "image";
      response: string | null;
      request: unknown;
      method: "GET";
    }
  | {
      type: "command";
      response: unknown;
      request: unknown;
      method: "POST";
    }
  | {
      type: "get_all_states";
      response: string[];
      request: unknown;
      method: "GET";
    }
  | {
      type: "compile_scenario";
      response: string[];
      request: { script: string };
      method: "POST";
    }
  | {
      type: "is_scenario_valid";
      response: ScenarioError | null;
      request: ScenarioErrorRequest;
      method: "POST";
    }
  | {
      type: "scenarios";
      response: ScenarioDefenition[];
      request: unknown;
      method: "GET";
    }
  | {
      type: "save_scenario";
      response: ScenarioDefenition[];
      request: ScenarioDefenition;
      method: "POST";
    };

type ReqTypes_get<T = RequestMatching> = T extends { type: any; method: "GET" }
  ? T["type"]
  : never;
type ReqTypes_post<T = RequestMatching> = T extends {
  type: any;
  method: "POST";
}
  ? T["type"]
  : never;
type IResponse<type> = ExtractByType<RequestMatching, type>["response"];
type IRequest<type extends ReqTypes_post> = ExtractByType<
  RequestMatching,
  type
>["request"];
