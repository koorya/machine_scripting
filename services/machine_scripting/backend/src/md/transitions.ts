import { GraphOfStates, } from "../fsm_types"

export const root_graph = {
  transitions: [
    {
      name: "liftUpFrame",
      from: "on_pins_support",
      to: "lifting_up_frame_cycle", comment: ""
    },
    { name: "step", from: "lifting_up_frame_cycle", to: "on_pins_support", comment: "" },
    {
      name: "prepareToLinkMounting",
      from: "on_pins_support",
      to: "lift_up_frame_by_pressure", comment: ""
    },
    { name: "step", from: "lift_up_frame_by_pressure", to: "ready_to_link_mounting", comment: "" },
    {
      name: "releaseFrame",
      from: "ready_to_link_mounting",
      to: "link_mounting_to_init", comment: ""
    },
    { name: "step", from: "link_mounting_to_init", to: "on_pins_support", comment: "" },
    {
      name: "holdFrame",
      from: "on_pins_support",
      to: "holding_frame_cycle", comment: ""
    },
    { name: "step", from: "holding_frame_cycle", to: "holding_frame", comment: "" },
    {
      name: "prepareToLiftingBottomFrame",
      from: "holding_frame",
      to: "prepareing_to_lifting_bottom_frame_cycle", comment: ""
    },
    {
      name: "prepareToTopFrameMoveing",
      from: "holding_frame",
      to: "prepareing_to_top_frame_moveing_vertical", comment: ""
    },
    {
      name: "step",
      from: "prepareing_to_top_frame_moveing_vertical",
      to: "on_pins_support", comment: ""
    },
    {
      name: "step",
      from: "prepareing_to_lifting_bottom_frame_cycle",
      to: "on_external_support", comment: "",
      "dot": { "tailport": "s", "headport": "n" }
    },
    {
      name: "pushinCrab",
      from: "on_external_support",
      to: "pushing_in_crab_cycle", comment: ""
    },
    {
      name: "step",
      from: "pushing_in_crab_cycle",
      to: "ready_to_lifting_bottom_frame", comment: ""
    },
    {
      name: "pushoutCrab",
      from: "ready_to_lifting_bottom_frame",
      to: "pushing_out_crab_cycle", comment: ""
    },
    {
      name: "step",
      from: "pushing_out_crab_cycle",
      to: "on_external_support", comment: ""
    },
    {
      name: "liftUpBottomFrame",
      from: "ready_to_lifting_bottom_frame",
      to: "lifting_up_bottom_frame_cycle", comment: ""
    },
    {
      name: "step",
      from: "lifting_up_bottom_frame_cycle",
      to: "ready_to_lifting_bottom_frame", comment: ""
    },
    {
      name: "step",
      from: "lifting_down_bottom_frame_cycle",
      to: "ready_to_lifting_bottom_frame", comment: ""
    },
    {
      name: "liftDownBottomFrame",
      from: "ready_to_lifting_bottom_frame",
      to: "lifting_down_bottom_frame_cycle", comment: ""
    },
    {
      name: "landBottomFrameToPins",
      from: "on_external_support",
      to: "landing_bottom_frame_to_pins", comment: ""
    },
    {
      name: "step",
      from: "landing_bottom_frame_to_pins",
      to: "on_pins_support", comment: ""
    },

    {
      name: "horizontalMoveTopFrame",
      from: "holding_frame",
      to: "horizontal_moveing_cycle", comment: ""
    },
    {
      name: "step",
      from: "horizontal_moveing_cycle",
      to: "holding_frame", comment: ""
    },

    {
      name: "liftDownFrame",
      from: "on_pins_support",
      to: "lifting_down_frame_cycle", comment: ""
    },
    {
      name: "step",
      from: "lifting_down_frame_cycle",
      to: "on_pins_support", comment: ""
    }
  ],
  states: [
    { name: "on_pins_support", comment: "На цапфах нижнего этажа" },
    { name: "lifting_up_frame_cycle", comment: "Подъем на одну ступень" },
    { name: "holding_frame_cycle", comment: "Удержание рамы" },
    { name: "prepareing_to_top_frame_moveing_vertical", comment: "" },
    { name: "prepareing_to_lifting_bottom_frame_cycle", comment: "" },
    { name: "pushing_in_crab_cycle", comment: "Задвигание лап краба" },
    { name: "pushing_out_crab_cycle", comment: "Выдвижение лап краба" },
    { name: "lifting_up_bottom_frame_cycle", comment: "Подъем краба на<br/> одну ступень" },
    { name: "lifting_down_bottom_frame_cycle", comment: "Спуск краба на одну ступень" },
    { name: "ready_to_lifting_bottom_frame", comment: "Готов к подъему краба" },
    { name: "on_external_support", comment: "Упирается на колонны рамой" },
    { name: "landing_bottom_frame_to_pins", comment: "Посадка краба а цапфы" },
    { name: "horizontal_moveing_cycle", comment: "Смещение по горизонтали" },
    { name: "lifting_down_frame_cycle", comment: "Спуск на одну ступень" },



  ],
  init: "on_pins_support",
} as const;


export const graph: GraphOfStates = (root_graph as unknown) as GraphOfStates;

export type States = typeof root_graph.transitions[number]["from"];
export type Transitions = typeof root_graph.transitions[number]["name"];
