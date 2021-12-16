import React from "react";
import { Alert, Button, Col, Form, Row } from "react-bootstrap";

type prefix = "FC1" | "FC2";
type suffics = "_command" | "_freq" | "_out_freq" | "_reset_error";
type combine = `${prefix}${suffics}`;

function FC<fc_name_T extends "FC1" | "FC2">({
  api,
  fc_name,
  plc_vars,
}: {
  api: (name: combine, value?: number | boolean | string) => void;
  fc_name: fc_name_T;
  plc_vars: { [key in combine]: any };
}) {
  return (
    <Alert
      variant={
        plc_vars[(fc_name + "_command") as combine] === 0x0001
          ? "success"
          : "secondary"
      }
    >
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
            plc_vars[(fc_name + "_command") as combine] === 0x0001
              ? "#0f0"
              : "#ddd",
        }}
        disabled
      />

      <div style={{ position: "relative", height: "45px", width: "90px" }}>
        <Form.Range
          value={plc_vars[`${fc_name}_freq` as combine]}
          min={0}
          max={5000}
          title="speed"
          onChange={(e) => {
            api(`${fc_name}_freq`, parseInt(e.target.value));
          }}
        />

        {`set: ${plc_vars[(fc_name + "_freq") as combine] / 100} Hz`}
        <br />
      </div>
      <div style={{ color: "#000", textAlign: "left" }}>
        {`f: ${plc_vars[(fc_name + "_out_freq") as combine] / 100} Hz`}
        <br />
        {`I: ${plc_vars[(fc_name + "_out_curr") as combine] / 100} A`}
      </div>
      <div>
        <input
          type="button"
          value="start"
          style={{ width: "45px" }}
          onClick={() => {
            api(`${fc_name}_command`, 0x0001);
          }}
          disabled={plc_vars[(fc_name + "_reset_error") as combine] === true}
        />
        <input
          type="button"
          value="stop"
          style={{ width: "45px" }}
          onClick={() => {
            api(`${fc_name}_command`, 0x0000);
          }}
          disabled={plc_vars[(fc_name + "_reset_error") as combine] === true}
        />
        <br />
        <input
          type="button"
          value="reset fault"
          style={{ width: "90px" }}
          onClick={() => {
            api(`${fc_name}_command`, 0x0080);
          }}
          disabled={plc_vars[(fc_name + "_reset_error") as combine] === true}
        />
        <br />
        <input
          type="button"
          value="hard reset"
          style={{ width: "90px" }}
          onClick={() => {
            api(`${fc_name}_reset_error`, true);
          }}
          disabled={plc_vars[(fc_name + "_reset_error") as combine] === true}
        />
      </div>
    </Alert>
  );
}

type FCPanelReqVarNames =
  | "FC1_command"
  | "FC2_command"
  | "FC1_freq"
  | "FC2_freq"
  | combine;

type UnionToObj<T extends string> = { [key in T]?: any };

function FCPanel({
  handle_button_click,
  plc_vars,
  multiple_handler,
}: {
  handle_button_click: (
    name: FCPanelReqVarNames,
    value?: number | boolean | string
  ) => void;
  plc_vars: { [key in FCPanelReqVarNames]: any };
  multiple_handler: (plc_var: UnionToObj<FCPanelReqVarNames>) => void;
}) {
  return (
    <Alert variant={"secondary"}>
      <Row>
        <Col>
          <FC api={handle_button_click} plc_vars={plc_vars} fc_name="FC1" />
        </Col>
        <Col>
          <FC api={handle_button_click} plc_vars={plc_vars} fc_name="FC2" />
        </Col>
      </Row>
      <Row>
        <Button
          variant={"danger"}
          onClick={() => {
            multiple_handler({
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
