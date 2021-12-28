import { GraphOfStates, } from "../fsm_types"

export const graph: GraphOfStates = {
  transitions: [
    { name: "moveUp", from: "bottom", to: "lifting_up", comment: "привет" },
    { name: "moveDown", from: "top", to: "lifting_down", comment: "привет" },
    { name: "step", from: "lifting_up", to: "top", comment: "привет" },
    { name: "step", from: "lifting_down", to: "bottom", comment: "привет" },
    { name: "moveDownEXTRA", from: "lifting_up", to: "lifting_down", comment: "привет" },
    { name: "moveUpEXTRA", from: "lifting_down", to: "lifting_up", comment: "привет" }
  ],
  states: [
    { name: "lifting_up", comment: "привет" },
    { name: "lifting_down", comment: "привет" },
    { name: "top", comment: "привет" },
    { name: "bottom", comment: "привет" },
  ]
};

