import { useRef, useState } from "react";

import Button from "react-bootstrap/Button";
import * as MyTypes from "../shared/types/types";
import { init_commands } from "../shared/commands/ext_commands";

import { API } from "../shared/api/api";
import { Col, Form, Overlay, Popover } from "react-bootstrap";

export function ExtendCommandForm({
  cmd,
  api,
}: {
  cmd: string;
  api: API<MyTypes.RequestMatching>;
}) {
  const cmd_t = cmd as keyof typeof init_commands;

  return (
    <>
      {!(cmd_t in init_commands) ? (
        <Button
          className="mx-1"
          onClick={() =>
            api
              .getByAPI_post("exec_graph_command", { command: cmd })
              .then((res) => console.log(res))
          }
          size="sm"
        >
          {cmd_t}
        </Button>
      ) : (
        <SetAdressBtn api={api} cmd_name={cmd_t} />
      )}
    </>
  );
}

function SetAdressBtn({
  api,
  cmd_name,
}: {
  api: API<MyTypes.RequestMatching>;
  cmd_name: keyof typeof init_commands;
}) {
  const [show, setShow] = useState(false);
  const [target, setTarget] = useState<EventTarget | HTMLElement | null>(null);
  const ref = useRef(null);

  const [params, setParams] = useState(init_commands[cmd_name]);

  return (
    <div ref={ref}>
      <Button
        onMouseEnter={(e) => {
          setShow(true);
          setTarget(e.target);
        }}
        className="mx-1"
        onClick={() =>
          api
            .getByAPI_post("exec_graph_command", {
              command: `${cmd_name}(${JSON.stringify(params)})`,
            })
            .then((res) => console.log(res))
        }
        size="sm"
      >
        {cmd_name + " "}
        {Object.entries(params).map((k) => `${k[0][0]}-${k[1]} `)}
      </Button>
      <Overlay
        show={show}
        target={target as HTMLElement}
        placement="bottom"
        container={ref}
        containerPadding={20}
      >
        <Popover
          id="popover-contained"
          onMouseLeave={(e) => {
            setShow(false);
          }}
        >
          <Popover.Header as="h3">{cmd_name}</Popover.Header>
          <Popover.Body>
            Check this info.
            {Object.entries(params).map((k) => (
              <Form.Group as={Col} md="4" controlId="validationCustom01">
                <Form.Label>{k[0]}</Form.Label>
                <Form.Control
                  type="text"
                  value={k[1]}
                  onChange={(e) => {
                    let p = params as any;
                    p[`${k[0]}`] = parseInt(e.currentTarget.value);
                    if (!p[`${k[0]}`]) p[`${k[0]}`] = 0;
                    setParams(p);
                  }}
                />
              </Form.Group>
            ))}
          </Popover.Body>
        </Popover>
      </Overlay>
    </div>
  );
}
