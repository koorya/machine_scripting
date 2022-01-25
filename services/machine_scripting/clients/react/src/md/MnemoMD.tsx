import { Row, Col, Alert, Badge } from "react-bootstrap";
import { usePlcContainer } from "../plcvarcontainer/PlcVarConainer";
import FCPanel from "./FC_panel";

import HydraulicCircuit from "./HydraulicCircuit";

import LocksOrtho from "./image_lock_ortho";

import {
  init_vars,
  MD_LIFTMECH_STATES,
  MD_LIFTMECH_CMDS,
} from "../shared/md/plc_vars";

import { ButtonToggle, YesNoButton } from "../utils/panel_utils";

function MnemoMD({
  read_port,
  write_port,
}: {
  read_port: number;
  write_port: number;
}) {
  const {
    plc_vars,
    handle_button_click,
    handle_button_click_multiple,
  } = usePlcContainer(read_port, write_port, init_vars);

  const calc_error = () => {
    if (plc_vars.init_to_hold_state === 98) return "init_to_hold_state";
    if (plc_vars.from_hold_to_init_state === 98)
      return "from_hold_to_init_state";
    if (plc_vars.main_state === 98) return "main_state";
    if (plc_vars.up_frame_cycle_state === 98) return "up_frame_cycle_state";
    if (plc_vars.down_frame_cycle_state === 98) return "down_frame_cycle_state";
    if (plc_vars.down_crab_cycle_state === 98) return "down_crab_cycle_state";
    if (plc_vars.from_upcrcyc_to_init_state === 98)
      return "from_upcrcyc_to_init_state";
    if (plc_vars.pushout_crab_state === 98) return "pushout_crab_state";
    if (plc_vars.up_crab_cycle_state === 98) return "up_crab_cycle_state";
    if (plc_vars.pushin_crab_state === 98) return "pushin_crab_state";
    if (plc_vars.from_hold_to_lift_crab_state === 98)
      return "from_hold_to_lift_crab_state";
    return undefined;
  };
  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Alert variant={calc_error() !== undefined ? "danger" : "primary"}>
        <Alert.Heading>Состояние внутри цикла</Alert.Heading>
        <Badge bg="warning" text="dark">
          {calc_error()}
        </Badge>
      </Alert>
      <Row>
        <Col xs={8}>
          <HydraulicCircuit
            plc_vars={plc_vars}
            handler={handle_button_click_multiple}
          />
        </Col>
        <Col xs={4}>
          <LocksOrtho
            sq_1_2={Number(plc_vars["SQ1"]) + 2 * Number(plc_vars["SQ2"])}
            sq_3_4={Number(plc_vars["SQ3"]) + 2 * Number(plc_vars["SQ4"])}
            sq_5_6={2 * Number(plc_vars["SQ5"]) + Number(plc_vars["SQ6"])}
            sq_7_8={2 * Number(plc_vars["SQ7"]) + Number(plc_vars["SQ8"])}
            sq_9_10={Number(plc_vars["SQ9"]) + 2 * Number(plc_vars["SQ10"])}
            sq_11_12={Number(plc_vars["SQ11"]) + 2 * Number(plc_vars["SQ12"])}
            sq_13_14={2 * Number(plc_vars["SQ13"]) + Number(plc_vars["SQ14"])}
            sq_15_16={2 * Number(plc_vars["SQ15"]) + Number(plc_vars["SQ16"])}
            sq_17_18={Number(plc_vars["SQ17"]) + 2 * Number(plc_vars["SQ18"])}
            sq_19_20={Number(plc_vars["SQ19"]) + 2 * Number(plc_vars["SQ20"])}
            sq_21_22={2 * Number(plc_vars["SQ21"]) + Number(plc_vars["SQ22"])}
            sq_23_24={2 * Number(plc_vars["SQ23"]) + Number(plc_vars["SQ24"])}
            sq_25_26={Number(plc_vars["SQ25"]) + 2 * Number(plc_vars["SQ26"])}
            sq_27_28={Number(plc_vars["SQ27"]) + 2 * Number(plc_vars["SQ28"])}
            sq_29_30={2 * Number(plc_vars["SQ29"]) + Number(plc_vars["SQ30"])}
            sq_31_32={2 * Number(plc_vars["SQ31"]) + Number(plc_vars["SQ32"])}
            SQ33={plc_vars["SQ33"]}
            SQ34={plc_vars["SQ34"]}
            SQ35={plc_vars["SQ35"]}
            SQ36={plc_vars["SQ36"]}
            SQ37={plc_vars["SQ37"]}
            SQ38={plc_vars["SQ38"]}
            SQ39={plc_vars["SQ39"]}
            SQ40={plc_vars["SQ40"]}
            SQ41={plc_vars["SQ41"]}
            SQ42={plc_vars["SQ42"]}
            SQ43={plc_vars["SQ43"]}
            SQ44={plc_vars["SQ44"]}
            SQ45={plc_vars["SQ45"]}
            SQ46={plc_vars["SQ46"]}
            SQ47={plc_vars["SQ47"]}
            SQ48={plc_vars["SQ48"]}
            BB1={plc_vars["BB1"]}
            BB2={plc_vars["BB2"]}
            BB3={plc_vars["BB3"]}
            BB4={plc_vars["BB4"]}
            BB5={plc_vars["BB5"]}
            BB6={plc_vars["BB6"]}
            BB7={plc_vars["BB7"]}
            BB8={plc_vars["BB8"]}
            BB13={plc_vars["BB13"]}
            BB9={plc_vars["BB9"]}
            BB10={plc_vars["BB10"]}
            BB11={plc_vars["BB11"]}
            BB12={plc_vars["BB12"]}
          />
          <FCPanel
            handle_button_click={handle_button_click}
            multiple_handler={handle_button_click_multiple}
            plc_vars={plc_vars}
          />
          <YesNoButton
            handle_button_click={handle_button_click}
            plc_vars={plc_vars}
            var_name="liftmech.is_disabled"
          />
          <ButtonToggle
            handle_button_click={handle_button_click}
            plc_vars={plc_vars}
            var_name="liftmech.cmd"
            radios={[
              {
                name: "Stop",
                value: MD_LIFTMECH_CMDS.stop,
                variant: "outline-danger",
              },
              { name: "Expand", value: MD_LIFTMECH_CMDS.expand },
              { name: "Reduce", value: MD_LIFTMECH_CMDS.reduce },
            ]}
          />
          <ButtonToggle
            handle_button_click={handle_button_click}
            plc_vars={plc_vars}
            var_name="liftmech.state"
            radios={[
              {
                name: "error",
                value: MD_LIFTMECH_STATES.error,
                variant: "outline-danger",
              },
              { name: "expanding", value: MD_LIFTMECH_STATES.expanding },
              { name: "reducing", value: MD_LIFTMECH_STATES.reducing },
              { name: "holding", value: MD_LIFTMECH_STATES.holding },
              { name: "expand_end", value: MD_LIFTMECH_STATES.expand_end },
              { name: "reduce_end", value: MD_LIFTMECH_STATES.reduce_end },
            ]}
          />
        </Col>
      </Row>
    </div>
  );
}

export default MnemoMD;
