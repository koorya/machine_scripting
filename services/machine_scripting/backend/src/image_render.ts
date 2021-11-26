import * as graphviz from "graphviz";
import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachine from "javascript-state-machine";
import { iTransition } from "./fsm_types";

export class ImageRender {
  rendered_image: string = null;
  dot_script: string;
  start_time: Date;
  constructor(transitions: iTransition[]) {
    transitions = [...transitions];
    transitions.map((edge) => {
      if (edge.name === "step") {
        if (!edge["dot"]) edge["dot"] = { color: "blue" };
        else edge.dot["color"] = "blue";
        edge.name = " ";
      }
    });
    const init_state = transitions[0].from;
    const fsm_image = new StateMachine({
      init: init_state,
      transitions: transitions,
    });
    this.dot_script = visualize(fsm_image, { orientation: "vertical" });

    this.updateImage(init_state);
  }
  updateImage(active_node_name: string) {
    // нужно отменить предыдущее рисование, если вызвано снова
    const local_time = new Date();
    this.start_time = local_time;
    graphviz.parse(this.dot_script, (gg) => {
      if (this.start_time.getTime() != local_time.getTime()) return;
      gg.getNode(active_node_name).set("color", "red");
      gg.output("svg", (buff) => {
        const local_image = buff.toString("base64");
        if (this.start_time.getTime() == local_time.getTime())
          this.rendered_image = local_image;
      });
      console.log("rendered");
    });
  }
}
