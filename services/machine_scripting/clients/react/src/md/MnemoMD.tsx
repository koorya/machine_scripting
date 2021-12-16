import React, { useEffect, useState } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import { API } from "../api";
import { RepeaterRequestMatching } from "../repeater";
import FCPanel from "./FC_panel";

import HydraulicCircuit from "./HydraulicCircuit";

import LocksOrtho from "./image_lock_ortho";

// function usePlcVars(api: API) {
//   const [val, setVal] = useState<{name: string; value: boolean | number;}[]>([]);
//   useEffect(() => {
//     const upd = setInterval(() => {
//       api.getByAPI_get("scenario_status").then((value) => setVal(value));
//     }, 100);
//     return () => {
//       console.log("useCmds is unmounted");
//       clearInterval(upd);
//     };
//   }, [api]);
//   return val;
// }

function MnemoMD({
  read_port,
  write_port,
}: {
  read_port: number;
  write_port: number;
}) {
  // eslint-disable-next-line
  const [readApi, setReadApi] = useState<API<RepeaterRequestMatching>>(
    () => new API<RepeaterRequestMatching>("http://localhost", read_port)
  );
  // eslint-disable-next-line
  const [writeApi, setWriteApi] = useState<API<RepeaterRequestMatching>>(
    () => new API<RepeaterRequestMatching>("http://localhost", write_port)
  );

  const plc_vars = useAdditionalMD(readApi);

  return (
    <div style={{ backgroundColor: "#fff" }}>
      <Alert variant="danger">
        <Alert.Heading>Состояние внутри цикла</Alert.Heading>
        {plc_vars.state}
        {plc_vars.satuse_message}
      </Alert>
      <Row>
        <Col xs={8}>
          <HydraulicCircuit
            plc_vars={plc_vars}
            handler={(upd_vars: { [key: string]: boolean }) => {
              console.log(JSON.stringify(upd_vars, null, 2));
              writeApi.getByAPI_post("set_vars_by_array", upd_vars);
            }}
          />
        </Col>
        <Col xs={4}>
          <LocksOrtho
            sq_1_2={plc_vars["SQ1"] + 2 * plc_vars["SQ2"]}
            sq_3_4={plc_vars["SQ3"] + 2 * plc_vars["SQ4"]}
            sq_5_6={2 * plc_vars["SQ5"] + plc_vars["SQ6"]}
            sq_7_8={2 * plc_vars["SQ7"] + plc_vars["SQ8"]}
            sq_9_10={plc_vars["SQ9"] + 2 * plc_vars["SQ10"]}
            sq_11_12={plc_vars["SQ11"] + 2 * plc_vars["SQ12"]}
            sq_13_14={2 * plc_vars["SQ13"] + plc_vars["SQ14"]}
            sq_15_16={2 * plc_vars["SQ15"] + plc_vars["SQ16"]}
            sq_17_18={plc_vars["SQ17"] + 2 * plc_vars["SQ18"]}
            sq_19_20={plc_vars["SQ19"] + 2 * plc_vars["SQ20"]}
            sq_21_22={2 * plc_vars["SQ21"] + plc_vars["SQ22"]}
            sq_23_24={2 * plc_vars["SQ23"] + plc_vars["SQ24"]}
            sq_25_26={plc_vars["SQ25"] + 2 * plc_vars["SQ26"]}
            sq_27_28={plc_vars["SQ27"] + 2 * plc_vars["SQ28"]}
            sq_29_30={2 * plc_vars["SQ29"] + plc_vars["SQ30"]}
            sq_31_32={2 * plc_vars["SQ31"] + plc_vars["SQ32"]}
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
          <FCPanel api={writeApi} plc_vars={plc_vars} />
        </Col>
      </Row>
    </div>
  );
}

function useAdditionalMD(api: API<RepeaterRequestMatching>) {
  const [plcVars, setPlcVars] = useState<
    Extract<
      RepeaterRequestMatching,
      { type: "read_vars_by_array" }
    >["response"]["vars"]
  >([]);
  useEffect(() => {
    let should_stop = false;
    const run = async () => {
      await api
        .getByAPI_post("read_vars_by_array", {
          var_names: [
            "up_frame_cycle_state",
            "status_message",
            "Y19",
            "PP1",
            "Y20",
            "PP2",
            "FC1_reset_error",
            "BP3",
            "PP4",
            "Y22",
            "BP4",
            "Y21",
            "PP3",
            "FC2_reset_error",
            "BP1",
            "BP2",
            "RK_STATE",
            "HPV1_OK",
            "HPV2_OK",
            "HPV3_OK",
            "HPV4_OK",
            "K5",
            "K1",
            "K2",
            "K3",
            "K4",
            "H2",
            "H3",
            "H4",
            "H5",
            "RK_V_plus",
            "FC1_command",
            "FC1_out_curr",
            "FC1_freq",
            "FC1_out_freq",
            "FC2_command",
            "FC2_out_curr",
            "FC2_freq",
            "FC2_out_freq",
            "SQ1",
            "SQ2",
            "SQ3",
            "SQ4",
            "SQ5",
            "SQ6",
            "SQ7",
            "SQ8",
            "SQ9",
            "SQ10",
            "SQ11",
            "SQ12",
            "SQ13",
            "SQ14",
            "SQ15",
            "SQ16",
            "SQ17",
            "SQ18",
            "SQ19",
            "SQ20",
            "SQ21",
            "SQ22",
            "SQ23",
            "SQ24",
            "SQ25",
            "SQ26",
            "SQ27",
            "SQ28",
            "SQ29",
            "SQ30",
            "SQ31",
            "SQ32",
            "SQ33",
            "SQ34",
            "SQ35",
            "SQ36",
            "SQ37",
            "SQ38",
            "SQ39",
            "SQ40",
            "SQ41",
            "SQ42",
            "SQ43",
            "SQ44",
            "SQ45",
            "SQ46",
            "SQ47",
            "SQ48",
            "SQ50",
            "SQ51",
            "SP1",
            "SP2",
            "SP3",
            "SP4",
            "SP5",
            "SP6",
            "SP7",
            "SP8",
            "SP9",
            "SP10",
            "SP11",
            "SP12",
            "SL1",
            "YPP1_Iref",
            "YPP2_Iref",
            "YPP3_Iref",
            "YPP4_Iref",
            "HPV1_EN",
            "HPV1_RAMP",
            "HPV2_EN",
            "HPV2_RAMP",
            "HPV3_EN",
            "HPV3_RAMP",
            "HPV4_EN",
            "HPV4_RAMP",
            "Y1",
            "Y2",
            "Y3",
            "Y4",
            "Y5",
            "Y6",
            "Y7",
            "Y8",
            "Y9",
            "Y10",
            "Y11",
            "Y12",
            "Y13",
            "Y14",
            "Y15",
            "Y16",
            "Y17",
            "Y18",
            "BB1",
            "BB2",
            "BB3",
            "BB4",
            "BB5",
            "BB6",
            "BB7",
            "BB8",
            "BB13",
            "BB9",
            "BB10",
            "BB11",
            "BB12",
            "start_handle",
            "continue_handle",
            "main_state",
            "stop_hanlde",
          ],
        })
        .then((value) => setPlcVars(value.vars))
        .catch((reason) => console.log(reason));
      if (!should_stop) setTimeout(run, 300);
    };
    run();
    return () => {
      console.log("useAdditionalMD is unmounted");
      // clearInterval(plcvar_upd);
      should_stop = true;
    };
  }, [api]);
  return plcVars;
}

export default MnemoMD;
