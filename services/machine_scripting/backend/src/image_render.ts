import * as graphviz from "graphviz";
import { Edge, Graph } from "graphviz";

import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachine from "javascript-state-machine";
import { GraphOfStates } from "./fsm_types";

export class ImageRender {
  rendered_image: string = null;
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

    this.updateImage(init_state, false);
  }

  updateImage(active_node_name: string, is_running: boolean) {
    // нужно отменить предыдущее рисование, если вызвано снова
    const local_time = new Date();
    this.start_time = local_time;

    const gg = this.graph;
    if (!gg) {
      setTimeout(() => this.updateImage(active_node_name, false), 100);
      return;
    }


    if (this.start_time.getTime() != local_time.getTime()) return;
    gg.getNode(active_node_name).set("color", is_running ? "green" : "red");
    gg.output("svg", (buff) => {

      const local_image = buff.toString("base64");
      if (this.start_time.getTime() == local_time.getTime())
        this.rendered_image = local_image;
    });
    gg.getNode(active_node_name).set("color", "black");
    console.log("rendered");


  }
}
