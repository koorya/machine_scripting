import { GraphOfStates, } from "../fsm_types"

export const graph: GraphOfStates = {
  transitions: [
    { name: "moveUp", from: "bottom", to: "lifting_up", comment: "Вверх" },
    { name: "moveDown", from: "top", to: "lifting_down", comment: "Вниз" },
    { name: "step", from: "lifting_up", to: "top", comment: "" },
    { name: "step", from: "lifting_down", to: "bottom", comment: "" },
    { name: "moveDownEXTRA", from: "lifting_up", to: "lifting_down", comment: "Вниз(при ошибке)" },
    { name: "moveUpEXTRA", from: "lifting_down", to: "lifting_up", comment: "Вверх(при ошибке)" }
  ],
  states: [
    { name: "lifting_up", comment: "едет вверх" },
    { name: "lifting_down", comment: "едет вниз" },
    { name: "top", comment: "полностю поднят" },
    { name: "bottom", comment: "полностью спущен" },
  ]
};

