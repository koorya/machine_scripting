import * as graphviz from "graphviz";
import { Edge, Graph } from "graphviz";

import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachine from "javascript-state-machine";
import { GraphOfStates } from "./fsm_types";

export class ImageRender {
  rendered_image: { image: string; timestamp: number } = null;
  dot_script: string;
  graph: Graph;
  start_time: Date;
  constructor(graph: GraphOfStates) {
    const transitions = [...graph.transitions];
    transitions.map((transition) => {
      if (!transition["dot"]) transition["dot"] = { color: "black" };
      if (transition.comment && transition.comment != "") transition.dot = { ...transition.dot, label: `${transition.comment} ${transition.name}` };
      if (transition.name === "step") {
        if (!transition["dot"]) transition["dot"] = { color: "blue" };
        else transition.dot["color"] = "blue";
        transition.name = " ";
      }
    });
    const init_state = transitions[0].from;
    const fsm_image = new StateMachine({
      init: init_state,
      transitions: transitions,
    });
    this.dot_script = visualize(fsm_image, { orientation: "vertical" });

    graphviz.parse(
      this.dot_script, (gg) => {
        gg.setNodeAttribut("shape", "rect");
        gg.setNodeAttribut("style", "rounded");
        graph.states.map(state => gg.getNode(state.name).set("label", `! <B> ${state.name} </B> <BR/> ${state.comment} `));
        this.graph = gg;
      });

    this.updateImage(init_state, "");
  }

  updateImage(active_node_name: string, state: string) {
    // нужно отменить предыдущее рисование, если вызвано снова
    const local_time = new Date();
    this.start_time = local_time;

    const gg = this.graph;
    if (!gg) {
      setTimeout(() => this.updateImage(active_node_name, ""), 100);
      return;
    }


    if (!gg.getNode(active_node_name)) return;
    if (this.start_time.getTime() != local_time.getTime()) return;
    gg.getNode(active_node_name).set("fillcolor",
      state == "available" ? "green" :
        state == "executing_command" || state == "executing_scenario" ? "yellow" :
          state == "aborted" ? "red" : "gray");
    // gg.getNode(active_node_name).set("fillcolor", is_running ? "yellow" : "red");

    gg.getNode(active_node_name).set("fontcolor", state == "executing_command" || state == "executing_scenario" ? "black" : "white");

    gg.getNode(active_node_name).set("style", "filled, rounded");
    gg.output("svg", (buff) => {

      const local_image = buff.toString("base64");
      if (this.start_time.getTime() == local_time.getTime())
        this.rendered_image = { image: local_image, timestamp: local_time.getTime() };
    });
    gg.getNode(active_node_name).set("style", "rounded");
    gg.getNode(active_node_name).set("fontcolor", "black");
    console.log("rendered");


  }
}
