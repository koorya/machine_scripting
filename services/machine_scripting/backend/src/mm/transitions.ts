import { GraphOfStates, } from "../fsm_types"

export const graph: GraphOfStates = {
  transitions: [
    { "name": "setAddres", "from": "standby", "to": "ready_to_mount" },
    { "name": "setAddres", "from": "ready_to_mount", "to": "ready_to_mount" },
    { "name": "p200Start", "from": "ready_to_mount", "to": "p200" },
    { "name": "p300Start", "from": "p200", "to": "p300" },
    { "name": "p500Start", "from": "p300", "to": "p500" },
    { "name": "p600Start", "from": "p500", "to": "p600_near" },
    { "name": "step", "from": "p600_near", "to": "p600_far" },
    { "name": "step", "from": "p600_far", "to": "p600_finish" },
    { "name": "p700Start", "from": "p600_finish", "to": "p700" },
    { "name": "p800Start", "from": "p700", "to": "p800" },
    { "name": "step", "from": "p800", "to": "standby" }
  ]
  ,
  states: []
}

