import React from "react";
import MemoHydraulicCirctuit from "./hydraulic_image";

class HydraulicCircuit extends React.Component {
  constructor() {
    super();
    this.state = {};
  }
  componentDidMount() {}

  click = (obj) => {
    console.log(obj.id);
    const write_var = this.props.handler;
    if (!Object.keys(this.props.plc_vars).includes("Y1")) return;
    if (obj.id === "Y1_") {
      write_var({ Y1: false });
    } else if (obj.id === "Y2_") {
      write_var({ Y2: false });
    } else if (obj.id === "Y3_") {
      write_var({ Y3: false });
    } else if (obj.id === "Y6_") {
      write_var({ Y6: false });
    } else if (obj.id === "Y7_") {
      write_var({ Y7: false });
    } else if (obj.id === "Y18_") {
      write_var({ Y18: false });
    } else if (obj.id === "Y4_5") {
      write_var({ Y4: false, Y5: false });
    } else if (obj.id === "Y16_17") {
      write_var({ Y16: false, Y17: false });
    } else if (obj.id === "Y8_9") {
      write_var({ Y8: false, Y9: false });
    } else if (obj.id === "Y10_11") {
      write_var({ Y10: false, Y11: false });
    } else if (obj.id === "Y12_13") {
      write_var({ Y12: false, Y13: false });
    } else if (obj.id === "Y14_15") {
      write_var({ Y14: false, Y15: false });
    } else {
      if (this.props.plc_vars[obj.id] !== undefined) {
        console.log("someone clicked");
        const t = {};
        t[obj.id] = !this.props.plc_vars[obj.id];

        console.log(JSON.stringify(t, null, 2));
        write_var(t);
      }
    }
  };
  render() {
    return (
      <div>
        <MemoHydraulicCirctuit
          Y1={this.props.plc_vars.Y1}
          Y1_={!this.props.plc_vars.Y1}
          Y2={this.props.plc_vars.Y2}
          Y2_={!this.props.plc_vars.Y2}
          Y3={this.props.plc_vars.Y3}
          Y3_={!this.props.plc_vars.Y3}
          Y4={this.props.plc_vars.Y4}
          Y5={this.props.plc_vars.Y5}
          Y4_5={!this.props.plc_vars.Y4 && !this.props.plc_vars.Y5}
          Y6={this.props.plc_vars.Y6}
          Y6_={!this.props.plc_vars.Y6}
          Y7={this.props.plc_vars.Y7}
          Y7_={!this.props.plc_vars.Y7}
          Y8={this.props.plc_vars.Y8}
          Y9={this.props.plc_vars.Y9}
          Y8_9={!this.props.plc_vars.Y8 && !this.props.plc_vars.Y9}
          Y10={this.props.plc_vars.Y10}
          Y11={this.props.plc_vars.Y11}
          Y10_11={!this.props.plc_vars.Y10 && !this.props.plc_vars.Y11}
          Y12={this.props.plc_vars.Y12}
          Y13={this.props.plc_vars.Y13}
          Y12_13={!this.props.plc_vars.Y12 && !this.props.plc_vars.Y13}
          Y14={this.props.plc_vars.Y14}
          Y15={this.props.plc_vars.Y15}
          Y14_15={!this.props.plc_vars.Y14 && !this.props.plc_vars.Y15}
          Y16={this.props.plc_vars.Y16}
          Y17={this.props.plc_vars.Y17}
          Y16_17={!this.props.plc_vars.Y16 && !this.props.plc_vars.Y17}
          Y18={this.props.plc_vars.Y18}
          Y18_={!this.props.plc_vars.Y18}
          Y19={this.props.plc_vars.Y19}
          Y20={this.props.plc_vars.Y20}
          Y21={this.props.plc_vars.Y21}
          Y22={this.props.plc_vars.Y22}
          clickfn={(el) => this.click(el.target)}
        />
      </div>
    );
  }
}

export default HydraulicCircuit;
