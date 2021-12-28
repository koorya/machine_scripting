import { GraphOfStates, } from "../fsm_types"

export const graph: GraphOfStates = {
  transitions: [
    {
      "name": "liftUpFrame",
      "from": "on_pins_support",
      "to": "lifting_up_frame_cycle"
    },
    { "name": "step", "from": "lifting_up_frame_cycle", "to": "on_pins_support" },
    {
      "name": "holdFrame",
      "from": "on_pins_support",
      "to": "holding_frame_cycle"
    },
    { "name": "step", "from": "holding_frame_cycle", "to": "holding_frame" },
    {
      "name": "prepareToLiftingBottomFrame",
      "from": "holding_frame",
      "to": "prepareing_to_lifting_bottom_frame_cycle"
    },
    {
      "name": "prepareToTopFrameMoveing",
      "from": "holding_frame",
      "to": "prepareing_to_top_frame_moveing_vertical"
    },
    {
      "name": "step",
      "from": "prepareing_to_top_frame_moveing_vertical",
      "to": "on_pins_support"
    },
    {
      "name": "step",
      "from": "prepareing_to_lifting_bottom_frame_cycle",
      "to": "on_external_support",
      "dot": { "tailport": "s", "headport": "n" }
    },
    {
      "name": "pushinCrab",
      "from": "on_external_support",
      "to": "pushing_in_crab_cycle"
    },
    {
      "name": "step",
      "from": "pushing_in_crab_cycle",
      "to": "ready_to_lifting_bottom_frame"
    },
    {
      "name": "pushoutCrab",
      "from": "ready_to_lifting_bottom_frame",
      "to": "pushing_out_crab_cycle"
    },
    {
      "name": "step",
      "from": "pushing_out_crab_cycle",
      "to": "on_external_support"
    },
    {
      "name": "liftUpBottomFrame",
      "from": "ready_to_lifting_bottom_frame",
      "to": "lifting_up_bottom_frame_cycle"
    },
    {
      "name": "step",
      "from": "lifting_up_bottom_frame_cycle",
      "to": "ready_to_lifting_bottom_frame"
    },
    {
      "name": "step",
      "from": "lifting_down_bottom_frame_cycle",
      "to": "ready_to_lifting_bottom_frame"
    },
    {
      "name": "liftDownBottomFrame",
      "from": "ready_to_lifting_bottom_frame",
      "to": "lifting_down_bottom_frame_cycle"
    },
    {
      "name": "landBottomFrameToPins",
      "from": "on_external_support",
      "to": "landing_bottom_frame_to_pins"
    },
    {
      "name": "step",
      "from": "landing_bottom_frame_to_pins",
      "to": "on_pins_support"
    },

    {
      "name": "horizontalMoveTopFrame",
      "from": "holding_frame",
      "to": "horizontal_moveing_cycle"
    },
    {
      "name": "step",
      "from": "horizontal_moveing_cycle",
      "to": "holding_frame"
    },

    {
      "name": "liftDownFrame",
      "from": "on_pins_support",
      "to": "lifting_down_frame_cycle"
    },
    {
      "name": "step",
      "from": "lifting_down_frame_cycle",
      "to": "on_pins_support"
    }
  ],
  states: []
}

