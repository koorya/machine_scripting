import * as graphviz from "graphviz";
import * as visualize from "javascript-state-machine/lib/visualize.js";
import * as StateMachine from "javascript-state-machine";
import { iTransition } from "./fsm_types";

export class ImageRender {
  rendered_image: string = null;
  transitions: iTransition[];
  fsm_image: any; //JS StateMachine
  constructor(transitions: iTransition[]) {
    this.transitions = [...transitions];
    this.transitions.map((edge) => {
      if (edge.name === "step") {
        if (!edge["dot"]) edge["dot"] = { color: "blue" };
        else edge.dot["color"] = "blue";

        edge.name = " ";
      }
    });
    this.fsm_image = new StateMachine({
      init: this.transitions[0].from,
      transitions: this.transitions,
    });
    this.updateImage(this.transitions[0].from);
  }
  async updateImage(active_node_name: string) {
    await graphviz.parse(
      visualize(this.fsm_image, { orientation: "vertical" }),
      (gg) =>
        // gg.output("svg", "test01.svg")
        {
          // plc_fsm.fsm.state
          gg.getNode(active_node_name).set("color", "red");
          // gg.set("ratio", "1.0");
          gg.output("svg", (buff) => {
            this.rendered_image = buff.toString("base64");
          });
          console.log("rendered");
        }
    );
  }
}
