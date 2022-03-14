import { GraphOfStates, } from "../fsm_types"

export const root_graph = {
  transitions: [
    {
      name: "execScenario",
      from: "available",
      to: "executing_scenario",
    },
    {
      name: "execCommand",
      from: "available",
      to: "executing_command",
    },
    {
      name: "finishExecCommand", //only for internal use
      from: "executing_command",
      to: "available",
    },
    {
      name: "abortExecCommand",
      from: "executing_command",
      to: "aborted",
    },
    {
      name: "resetError",
      from: "aborted",
      to: "available",
    },
    {
      name: "stop",
      from: ["executing_scenario", "paused"],
      to: "available",
    },
    {
      name: "pause",
      from: "executing_scenario",
      to: "paused",
    },
    {
      name: "resume",
      from: "paused",
      to: "executing_scenario",
    },
  ],
  states: [
  ],
  init: "available" as const,
} as const;


export const graph: GraphOfStates = (root_graph as unknown) as GraphOfStates;

export type States = typeof root_graph.transitions[number]["to"];
export type Transitions = typeof root_graph.transitions[number]["name"];
