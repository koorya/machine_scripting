import { iData } from "../fsm_types";

type ExtractByType<A, type> = A extends { type: type } ? A : never;

export type Machines = | "CONTROLLER" | "MM" | "MD" | "MP" | "MASTER";

export type MM_address = { cassete: number; pos: number };

export type ScenarioStartCondition = { state: string } & (
  | { type: "MD"; level: number }
  | { type: "MM"; address: MM_address; }
  | { type: "MP"; lenght: number; }
  | { type: "CONTROLLER"; }
  | { type: "MASTER"; }

);

export type MachineStatus = {
  cycle_step: number;
  status_message: string;
} & ScenarioStartCondition;

export type ScenarioStatus = {
  name: string;
  step_index: number;
};
export type ControllerStatus<machine extends Machines> = {
  state: string;
  scenario_status?: ScenarioStatus;
  machine_status: Extract<MachineStatus, { type: machine }>;
};

export type ScenarioError = {
  error: string;
  index: number;
  cmd?: string;
  level?: number;
};

export type CompiledScenario = {
  name: string;
  commands: string[];
  index: number;
}

export type ScenarioErrorRequest = {
  starting_condition: ScenarioStartCondition;
  compiled_scenario: string[];
};

export type ScenarioDefenition = {
  name: string;
  starting_condition: ScenarioStartCondition;
  script: string;
};

type AddParams =
  | {
    type: "MM";
    neuro: {
      ipcl: string;
      ipcr: string;
      port: number;
    };
  }
  | {
    type: "MD";
    hydro: number;
    reading_port: { zmq: number; ui: number; };
    seting_port: { zmq: number; ui: number; };
  }
  | {
    type: "MP";
    length: number;
    reading_port: { zmq: number; ui: number; };
    seting_port: { zmq: number; ui: number; };
  }
  | {
    type: "MASTER";
  }
  ;

type AddressListType = ({
  name: string;
  zmq_port: number;
  ui_port: number;
  specific_params: AddParams;
}

  &
  (
    | {
      is_fake: true;
    }
    | {
      is_fake: false;
      ip: string;
    }
  )
)


export type RequestMatching =
  | {
    type: "machine_type";
    response: Machines;
    request: {};
    method: "GET";
  }
  | {
    type: "list_machines_ports";
    response: number[];
    request: {};
    method: "GET";
  }
  | {
    type: "get_machines_info";
    response: ({ name: string; port: number; } & AddParams)[];
    request: {};
    method: "GET";
  }
  |
  {
    type: "test";
    response: string[];
    request: {};
    method: "GET";
  }
  | {
    type: "commands";
    response: string[];
    request: {};
    method: "GET";
  }
  | {
    type: "scenario_status";
    response: ScenarioStatus;
    request: {};
    method: "GET";
  }
  | {
    type: "controller_status";
    response: ControllerStatus<Machines> | undefined;
    request: {};
    method: "GET";
  }
  | {
    type: "image";
    response: string | null;
    request: {};
    method: "GET";
  }
  | {
    type: "exec_graph_command";
    response: { result: string };
    request: {
      command: string;
    };
    method: "POST";
  }
  | {
    type: "exec_controller_command";
    response: { result: string };
    request: {
      command: string;
    };
    method: "POST";
  }
  | {
    type: "exec_scenario";
    response: { result: string };
    request: {
      name: string;
      commands: string[];
    };
    method: "POST";
  }
  | {
    type: "get_all_states";
    response: string[];
    request: {};
    method: "GET";
  }
  | {
    type: "compile_scenario";
    response: {
      compiled: string[];
      status: "ok" | "fail";
    };
    request: { script: string };
    method: "POST";
  }
  | {
    type: "is_scenario_valid";
    response: {
      status: "ok" | "notok";
      details: ScenarioError;
    };
    request: ScenarioErrorRequest;
    method: "POST";
  }
  | {
    type: "scenarios";
    response: ScenarioDefenition[];
    request: { d: "10", f: "0" };
    method: "GET";
  }
  | {
    type: "save_scenario";
    response: {
      status: "ok" | "fail";
      scenarios: ScenarioDefenition[];
    };
    request: ScenarioDefenition;
    method: "POST";
  };

type GET_PARAMS =
  {
    type: string;
    method: "GET";
    response: unknown;
    request: Record<string, string>;
  };

type Valid<T> = Extract<T, { method: "GET" }> extends GET_PARAMS ? T : never;


type ReqTypes_get<matching = RequestMatching> = Extract<matching, { method: "GET"; type: string; }>["type"];

type ReqTypes_post<matching = RequestMatching> = Extract<matching, { method: "POST"; type: string; }>["type"];

type IResponse<type, matching = RequestMatching> = Extract<matching, { "type": type; response: unknown; }>["response"];

type IRequestNotValidated<type, matching = RequestMatching> = Extract<matching, { "type": type; request: any; }>["request"];

type IRequest<type, matching> = IRequestNotValidated<type, Valid<matching>>