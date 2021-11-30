import React from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";
import { API } from "../api";
import { RepeaterRequestMatching } from "../repeater";

function FC({
  api,
  fc_name,
  plc_vars,
}: {
  api: API<RepeaterRequestMatching>;
  fc_name: string;
  plc_vars: { [key: string]: any };
}) {
  return (
    <Alert variant={"primary"}>
      <input
        type="button"
        style={{
          borderRadius: "12px",
          height: "12px",
          width: "12px",
          position: "absolute",
          top: "5px",
          left: "75px",
          padding: "0px",
          backgroundColor:
            plc_vars[fc_name + "_command"] === 0x0001 ? "#0f0" : "#ddd",
        }}
        disabled
      />

      <div style={{ position: "relative", height: "45px", width: "90px" }}>
        <Form.Range
          defaultValue={0}
          min={0}
          max={5000}
          title="speed"
          onChange={(e) => {
            const t: { [key: string]: any } = {};
            t[fc_name + "_freq"] = e.currentTarget.value;
            api.getByAPI_post("set_vars_by_array", t);
          }}
        />
        {`set: ${plc_vars[fc_name + "_freq"] / 100} Hz`}
        <br />
      </div>
      <div style={{ color: "#000", textAlign: "left" }}>
        {`f: ${plc_vars[fc_name + "_out_freq"] / 100} Hz`}
        <br />
        {`I: ${plc_vars[fc_name + "_out_curr"] / 100} A`}
      </div>
      <div>
        <input
          type="button"
          value="start"
          style={{ width: "45px" }}
          onClick={() => {
            const t: { [key: string]: any } = {};
            t[fc_name + "_command"] = 0x0001;
            api.getByAPI_post("set_vars_by_array", t);
          }}
          disabled={plc_vars[fc_name + "_reset_error"] === true}
        />
        <input
          type="button"
          value="stop"
          style={{ width: "45px" }}
          onClick={() => {
            const t: { [key: string]: any } = {};
            t[fc_name + "_command"] = 0x0000;
            api.getByAPI_post("set_vars_by_array", t);
          }}
          disabled={plc_vars[fc_name + "_reset_error"] === true}
        />
        <br />
        <input
          type="button"
          value="reset fault"
          style={{ width: "90px" }}
          onClick={() => {
            const t: { [key: string]: any } = {};
            t[fc_name + "_command"] = 0x0080;
            api.getByAPI_post("set_vars_by_array", t);
          }}
          disabled={plc_vars[fc_name + "_reset_error"] === true}
        />
        <br />
        <input
          type="button"
          value="hard reset"
          style={{ width: "90px" }}
          onClick={() => {
            const t: { [key: string]: any } = {};
            t[fc_name + "_reset_error"] = true;
            api.getByAPI_post("set_vars_by_array", t);
          }}
          disabled={plc_vars[fc_name + "_reset_error"] === true}
        />
      </div>
    </Alert>
  );
}

function FCPanel({
  api,
  plc_vars,
}: {
  api: API<RepeaterRequestMatching>;
  plc_vars: { [key: string]: number | boolean };
}) {
  return (
    <Alert variant={"secondary"}>
      <Row>
        <Col>
          <FC api={api} plc_vars={plc_vars} fc_name="FC1" />
        </Col>
        <Col>
          <FC api={api} plc_vars={plc_vars} fc_name="FC2" />
        </Col>
      </Row>
      <Row>
        <Button
          variant={"danger"}
          onClick={() => {
            api.getByAPI_post("set_vars_by_array", {
              FC1_command: 0,
              FC2_command: 0,
              FC1_freq: 0,
              FC2_freq: 0,
            });
          }}
        >
          СТОП
        </Button>
      </Row>
    </Alert>
  );
}
export default FCPanel;
