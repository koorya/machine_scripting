import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import ToggleButton from "react-bootstrap/ToggleButton";
import * as MyTypes from "./types";
import { ButtonGroup, Dropdown, Tabs } from "react-bootstrap";
import { API } from "./api";
import { AddParams, Machines, RequestMatching } from "./types";
import MnemoMD from "./md/MnemoMD";
import NeuroImage from "./mm/NeuroImage";

function Jumbotron(props: any) {
  return (
    <div
      style={{
        padding: "2rem 1rem",
        marginBottom: "2rem",
        backgroundColor: "#e9ecef",
        borderRadius: ".3rem",
      }}
    >
      {props.children}
    </div>
  );
}
function useCmds(api: API<RequestMatching>) {
  const [cmds, setCmds] = useState<string[]>([]);
  useEffect(() => {
    const cmds_upd = setInterval(() => {
      api.getByAPI_get("commands").then((value) => setCmds(value));
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(cmds_upd);
    };
  }, [api]);
  return cmds;
}
function useScenarioStatus(api: API<RequestMatching>) {
  const [val, setVal] = useState<MyTypes.ScenarioStatus | undefined>(undefined);
  useEffect(() => {
    const upd = setInterval(() => {
      api.getByAPI_get("scenario_status").then((value) => setVal(value));
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(upd);
    };
  }, [api]);
  return val;
}

function useControllerStatus(api: API<RequestMatching>) {
  const [val, setVal] = useState<MyTypes.ControllerStatus | undefined>(
    undefined
  );
  useEffect(() => {
    const upd = setInterval(() => {
      api.getByAPI_get("controller_status").then((value) => setVal(value));
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(upd);
    };
  }, [api]);
  return val;
}

function GraphImage({ api }: { api: API<RequestMatching> }) {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    const image_upd = setInterval(() => {
      api.getByAPI_get("image").then((value) => setImage(value));
    }, 100);
    return () => {
      console.log("useimage is unmounted");
      clearInterval(image_upd);
    };
  }, [api]);
  return (
    <Image src={`data:image/svg+xml;base64,${image}`} alt="states" fluid />
  );
}

function DirectControls({
  api,
  available,
}: {
  api: API<RequestMatching>;
  available: boolean;
}) {
  const cmds = useCmds(api);
  return (
    <>
      {cmds.map((cmd) =>
        cmd === "step" ? (
          <Button
            className="mx-1"
            // disabled={cmd === "step"}
            key={cmd}
            onClick={() =>
              api
                .getByAPI_post("exec_graph_command", { command: cmd })
                .then((res) => console.log(res))
            }
            size="sm"
          >
            {cmd}
          </Button>
        ) : (
          <Button
            className="mx-1"
            disabled={cmd === "step"}
            key={cmd}
            onClick={() =>
              api
                .getByAPI_post("exec_graph_command", { command: cmd })
                .then((res) => console.log(res))
            }
            size="sm"
          >
            {cmd}
          </Button>
        )
      )}
      {available != true ? <Spinner size="sm" animation="border" /> : ""}
    </>
  );
}
function CurrentState({
  machine_status,
}: {
  machine_status: MyTypes.MachineStatus | undefined;
}) {
  return (
    <div>
      {machine_status !== undefined ? (
        <>
          state: {machine_status.state} <br />
          step: {machine_status.cycle_step}
          <br />
          {machine_status.type === "MD" ? `level: ${machine_status.level}` : ""}
          <br />
          message: {machine_status.status_message}
        </>
      ) : (
        "not load"
      )}
    </div>
  );
}

function useAllStates(api: API<RequestMatching>) {
  const [allStates, setAllStates] = useState<string[]>([]);
  useEffect(() => {
    api.getByAPI_get("get_all_states").then((value) => setAllStates(value));
    return () => {};
  }, [api]);
  return allStates;
}

function useCompile(api: API<RequestMatching>, script: string) {
  const [compiled, setCompiled] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData(abortSignal: AbortSignal) {
      try {
        const res_data = await api.getByAPI_post(
          "compile_scenario",
          { script: script },
          abortSignal
        );
        setCompiled(res_data.compiled);
        console.log(res_data.status);
      } catch {
        console.log("useCompile: fetch aborted");
      }
    }
    fetchData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [api, script]);
  return compiled;
}

function useValidation(
  api: API<RequestMatching>,
  condition: MyTypes.ScenarioStartCondition,
  scenario: string[]
) {
  const [error, setError] = useState<MyTypes.ScenarioError | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData(abortSignal: AbortSignal) {
      try {
        const scenario_req: MyTypes.ScenarioErrorRequest = {
          compiled_scenario: scenario,
          starting_condition: condition,
        };

        const res_data = await api.getByAPI_post(
          "is_scenario_valid",
          scenario_req,
          abortSignal
        );
        console.log(`scenario validation ${res_data.status}`);
        setError(res_data.details);
      } catch {
        console.log("useValidation: fetch aborted");
      }
    }
    if (scenario && scenario.length === 0) {
      setError({ error: "scenario is empty", index: -1 });
    } else {
      fetchData(controller.signal);
    }
    return () => {
      controller.abort();
    };
  }, [api, scenario, condition]);
  return error;
}

type ScenarioProps = {
  api: API<RequestMatching>;
  value: MyTypes.ScenarioDefenition;
  mode?: string;
  saveCallback: (saveprop: MyTypes.ScenarioDefenition) => void;
  current_index?: number | null;
};

function Scenario({
  api,
  value,
  mode = "edit",
  saveCallback,
  current_index,
}: ScenarioProps) {
  const [script, setScript] = useState<string>(value.script);
  const [condition, setCondition] = useState<MyTypes.ScenarioStartCondition>(
    value.starting_condition
  );
  const [name, setName] = useState<string>(value.name);

  const sc = useCompile(api, script);
  const error = useValidation(api, condition, sc);
  const all_states = useAllStates(api);

  const handleChangeScript = (el: any) => {
    setScript(el.target.value);
  };

  const handleChangeState = (el: any) => {
    const new_condition = Object.assign({}, condition);
    new_condition.state = el.target.value;
    setCondition(new_condition);
  };
  const handleChangeName = (el: any) => {
    setName(el.target.value);
  };

  const handleSaveButton = () => {
    if (name === "" || error?.error) return;
    saveCallback({
      name: name,
      starting_condition: condition,
      script: script,
    });
    if (value.name !== name) handleResetButton();
  };
  const handleResetButton = () => {
    setScript(value.script);
    setCondition(value.starting_condition);
    setName(value.name);
  };
  return (
    <Alert variant={error?.error ? "warning" : "light"}>
      <Row>
        <Col>
          <h4>Scenario: {name}</h4>
        </Col>
      </Row>
      {mode === "edit" ? (
        <>
          <Row className="align-items-center">
            <Col>
              <Alert variant={error?.error ? "danger" : "success"}>
                {error?.error ? "Error: " + error?.error : "Correct"}
              </Alert>
            </Col>
            <Col>
              <Button className="mx-1" onClick={handleSaveButton}>
                Save
              </Button>
              <Button className="mx-1" onClick={handleResetButton}>
                Reset
              </Button>
            </Col>
          </Row>
          <Row>
            <Col>
              <FloatingLabel label="Scenario name">
                <Form.Control
                  className="my-1"
                  value={name}
                  onChange={handleChangeName}
                />
              </FloatingLabel>
            </Col>
          </Row>
          <Row>
            <Col xs={4}>
              {condition.type === "MD"
                ? AdditionalStartConditionsMD(condition, setCondition)
                : ""}
            </Col>
            <Col>
              <FloatingLabel label="Starting state">
                <Form.Select
                  value={condition.state}
                  onChange={handleChangeState}
                >
                  {all_states.map((el) => (
                    <option value={el} key={"option_" + el}>
                      {el}
                    </option>
                  ))}
                </Form.Select>
              </FloatingLabel>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Control
                className="mt-3"
                as="textarea"
                style={{ height: "400px" }}
                value={script}
                onChange={handleChangeScript}
              />
            </Col>
          </Row>
        </>
      ) : (
        <></>
      )}
      <Row>
        {mode === "edit" ? (
          ""
        ) : (
          <Col xs="2">
            <div className="d-grid gap-1">
              <Button
                onClick={() => {
                  api.getByAPI_post("exec_scenario", {
                    name: name,
                    commands: sc,
                  });
                }}
              >
                Run
              </Button>
              <Button
                onClick={() => {
                  api.getByAPI_post("exec_controller_command", {
                    command: "pause",
                  });
                }}
              >
                Pause
              </Button>
              <Button
                onClick={() => {
                  api.getByAPI_post("exec_controller_command", {
                    command: "resume",
                  });
                }}
              >
                Resume
              </Button>
              <Button
                onClick={() => {
                  api.getByAPI_post("exec_controller_command", {
                    command: "stop",
                  });
                }}
              >
                Stop
              </Button>
            </div>
          </Col>
        )}
        <Col>
          <Accordion defaultActiveKey="0" className="py-1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Resault Command list</Accordion.Header>
              <Accordion.Body>
                <ListGroup>
                  {sc?.map((el, index) => (
                    <ListGroup.Item
                      // size="sm"
                      key={"Scenario_btn" + el + "_" + index}
                      variant={
                        error?.index === index
                          ? "danger"
                          : current_index === index
                          ? "info"
                          : undefined
                      }
                    >
                      {el}
                    </ListGroup.Item>
                  ))}
                </ListGroup>{" "}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </Col>
      </Row>
    </Alert>
  );
}
function AdditionalStartConditionsMD(
  condition: Extract<MyTypes.ScenarioStartCondition, { type: "MD" }>,
  updateData: (
    data: Extract<MyTypes.ScenarioStartCondition, { type: "MD" }>
  ) => void
) {
  return (
    <FloatingLabel label="Starting Level">
      <Form.Control
        value={condition.level}
        onChange={(el: any) => {
          const new_condition = Object.assign({}, condition);
          new_condition.level = el.target.value;
          updateData(new_condition);
        }}
      />
    </FloatingLabel>
  );
}

function Scenarios({
  api,
  type,
  id,
}: {
  api: API<RequestMatching>;
  type: Machines;
  id: string;
}) {
  const [scenarios, setScenarios] = useState<MyTypes.ScenarioDefenition[]>([]);
  function defStartCondition(type: Machines): MyTypes.ScenarioStartCondition {
    switch (type) {
      case "MD":
        return {
          type: "MD",
          state: "on_pins_support",
          level: 0,
        };
      case "MM":
        return {
          address: { cassete: 0, pos: 0 },
          type: "MM",
          state: "standby",
        };
      default:
        return {
          address: { cassete: 0, pos: 0 },
          type: "MM",
          state: "standby",
        };
    }
  }
  const def_scenario: MyTypes.ScenarioDefenition = {
    name: "",
    starting_condition: defStartCondition(type),
    script: "[]",
  };
  const scenario_status = useScenarioStatus(api);

  useEffect(() => {
    api.getByAPI_get("scenarios").then((value) => setScenarios(value));
  }, [api]);

  const handleSaveScenario = (scenario: MyTypes.ScenarioDefenition) => {
    const scenarios_copy = scenarios.slice();
    const element = scenarios_copy.find((sc, index) => {
      if (sc.name === scenario.name) {
        scenarios_copy[index] = scenario;
        return true;
      }
      return false;
    });
    if (element === undefined) scenarios_copy.push(scenario);
    setScenarios(scenarios_copy);
    api.getByAPI_post("save_scenario", scenario).then((value) => {
      setScenarios(value.scenarios);
      console.log(`scenario validation on saving: ${value.status}`);
    });
  };
  const [editMode, setEditMode] = useState(false);
  return (
    <Tab.Container
      // id="list-group-tabs-example"
      defaultActiveKey="create_new_scenario"
    >
      <Row>
        <Col>
          <Dropdown>
            <Dropdown.Toggle
              variant="success"
              // id="dropdown-basic"
            >
              Select scenario
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item eventKey="create_new_scenario">
                Create new item
              </Dropdown.Item>
              <Dropdown.Divider />
              {scenarios.map((element) => (
                <Dropdown.Item
                  key={element.name}
                  // action
                  eventKey={`${element.name}`}
                >
                  {element?.name}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </Col>
        <Col>
          <ButtonToggle
            radios={[
              { name: "Use", value: 0 },
              { name: "Edit", value: 1 },
            ]}
            callback={(value) => {
              setEditMode(value === 1);
            }}
            reference={editMode}
            id={id}
          />{" "}
        </Col>
      </Row>

      <Row>
        <Col>
          <Tab.Content>
            {scenarios.map((element) => (
              <Tab.Pane key={element.name} eventKey={`${element.name}`}>
                <Scenario
                  api={api}
                  key={`scenario_${element.name}`}
                  value={element}
                  current_index={
                    scenario_status?.name === element.name
                      ? scenario_status?.step_index
                      : null
                  }
                  saveCallback={handleSaveScenario}
                  mode={editMode ? "edit" : "use"}
                />
              </Tab.Pane>
            ))}
            <Tab.Pane eventKey={"create_new_scenario"}>
              <Scenario
                api={api}
                value={def_scenario}
                saveCallback={handleSaveScenario}
              />
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );
}
function ButtonToggle({
  radios,
  reference,
  callback,
  id,
}: {
  radios: { name: string; value: number }[];
  reference: boolean;
  callback: (value: number) => void;
  id: string;
}) {
  return (
    <ButtonGroup>
      {radios.map((radio, idx) => (
        <ToggleButton
          key={`key_${radio.name}_${id}`}
          id={`radio-${radio.name}_${id}`}
          type="radio"
          variant="outline-success"
          name={`radio_${id}`}
          value={radio.value}
          checked={radio.value ? reference : !reference}
          onChange={(e) => callback(radio.value)}
        >
          {radio.name}
        </ToggleButton>
      ))}
    </ButtonGroup>
  );
}

type MachineConfig = { name: string; api: API<RequestMatching> } & AddParams;

function MachinePresentation({ machine }: { machine: MachineConfig }) {
  const controller_status = useControllerStatus(machine.api);

  return (
    <Container fluid>
      <Row>
        <Col>
          <GraphImage api={machine.api} />
        </Col>
        <Col xs={4}>
          <Jumbotron>
            <Tabs
              defaultActiveKey="scenario"
              // id={`graph-controll_${machine.name}`}
              className="mb-3"
            >
              <Tab eventKey="commands" title="Direct control">
                <DirectControls
                  api={machine.api}
                  available={controller_status?.state === "available"}
                />
              </Tab>
              <Tab eventKey="scenario" title="By scenario">
                <Scenarios
                  api={machine.api}
                  type={machine.type}
                  id={machine.name}
                />
              </Tab>
              <Tab eventKey="status" title="Status">
                {controller_status?.type === "MD" ? (
                  <div>level: {controller_status?.machine_status.level}</div>
                ) : controller_status?.type === "MM" ? (
                  <div>
                    casette: {controller_status?.machine_status.address.cassete}
                    <br />
                    pos: {controller_status?.machine_status.address.pos} <br />
                  </div>
                ) : (
                  <div></div>
                )}
              </Tab>
            </Tabs>
          </Jumbotron>
        </Col>
      </Row>
    </Container>
  );
}

// function AdditionalMD({ port }: { port: number }) {
//   // const [api, setApi] = useState<API<RepeaterRequestMatching>>(
//   //   () => new API<RepeaterRequestMatching>("http://localhost", port)
//   // );
//   // const plc_vars = useAdditionalMD(api);
//   return <MnemoMD port={port} />;
// }

function App() {
  const [machineConfig, setMachineConfig] = useState<MachineConfig[]>([]);
  useEffect(() => {
    const startup_api = new API<RequestMatching>("http://localhost", 5000);
    startup_api.getByAPI_get("get_machines_info").then((machines_info) => {
      const machines = Promise.all(
        machines_info.map(async (machine, id) => {
          const api = new API("http://localhost", machine.port);
          const t = {
            api: api,
            ...machine,
          };
          return t;
        })
      );
      machines.then((value) => setMachineConfig(value));
    });
  }, []);

  return (
    <Container fluid>
      <Row>
        <Col>
          <Tabs id="page">
            {machineConfig.map((machine) => (
              <Tab
                key={machine.name + "tab"}
                eventKey={machine.name}
                title={machine.name}
              >
                <MachinePresentation
                  key={machine.name + "presentation"}
                  machine={machine}
                />
                {machine.type === "MD" ? (
                  <Jumbotron>
                    hydro: {machine.hydro}
                    <MnemoMD
                      read_port={machine.reading_port.ui}
                      write_port={machine.seting_port.ui}
                    />
                  </Jumbotron>
                ) : machine.type === "MM" ? (
                  <Jumbotron>
                    <NeuroImage
                      ipcl={machine.neuro.ipcl}
                      ipcr={machine.neuro.ipcr}
                      port={machine.neuro.port}
                    />
                  </Jumbotron>
                ) : (
                  <Alert variant={"danger"}>unknown machine type</Alert>
                )}
              </Tab>
            ))}
          </Tabs>
        </Col>
      </Row>
      {/* <Row>
        <Col>
          <Jumbotron>
            <h4>Debug info</h4>
            <CurrentState machine_status={st?.machine_status} />
            <pre>{JSON.stringify(st, null, 2)}</pre>
          </Jumbotron>
        </Col>
      </Row> */}
    </Container>
  );
}

export default App;
