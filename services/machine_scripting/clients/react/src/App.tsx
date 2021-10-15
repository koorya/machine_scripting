import React, { useState, useEffect, useRef } from "react";
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

const mm_api = new API("http://localhost", 5001);

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
function useCmds() {
  const [cmds, setCmds] = useState<string[]>([]);
  useEffect(() => {
    const cmds_upd = setInterval(() => {
      mm_api.getByAPI_get("commands").then((value) => setCmds(value));
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(cmds_upd);
    };
  }, []);
  return cmds;
}
function useCycState() {
  const [val, setVal] = useState<MyTypes.ControllerStatus | null>(null);
  useEffect(() => {
    const upd = setInterval(() => {
      mm_api.getByAPI_get("controller_status").then((value) => setVal(value));
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(upd);
    };
  }, []);
  return val;
}

function GraphImage() {
  const [image, setImage] = useState<string | null>(null);
  useEffect(() => {
    const image_upd = setInterval(() => {
      mm_api.getByAPI_get("image").then((value) => setImage(value));
    }, 100);
    return () => {
      console.log("useimage is unmounted");
      clearInterval(image_upd);
    };
  }, []);
  return (
    <Image src={`data:image/svg+xml;base64,${image}`} alt="states" fluid />
  );
}
const sendCommand = (cmd: MyTypes.Command) => {
  mm_api.getByAPI_post("command", cmd).then((res) => console.log(res));
};

function DirectControls() {
  const cmds = useCmds();
  return (
    <>
      {cmds.map((cmd) =>
        cmd === "step" ? (
          <Spinner key={cmd} animation="border" />
        ) : (
          <Button
            className="mx-1"
            disabled={cmd === "step"}
            key={cmd}
            onClick={() =>
              sendCommand({ command: "execCommand", payload: cmd })
            }
            size="sm"
          >
            {cmd}
          </Button>
        )
      )}
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
          {machine_status.type === "MM"
            ? `cassete: ${machine_status.address.cassete} <br/>
          pos: ${machine_status.address.pos}`
            : ""}
          <br />
          message: {machine_status.status_message}
        </>
      ) : (
        "not load"
      )}
    </div>
  );
}

function useAllStates() {
  const [allStates, setAllStates] = useState<string[]>([]);
  useEffect(() => {
    mm_api.getByAPI_get("get_all_states").then((value) => setAllStates(value));
    return () => {};
  }, []);
  return allStates;
}

function useCompile(script: string) {
  const [compiled, setCompiled] = useState<string[]>([]);
  useEffect(() => {
    const controller = new AbortController();

    async function fetchData(abortSignal: AbortSignal) {
      try {
        const res_data = await mm_api.getByAPI_post(
          "compile_scenario",
          { script: script },
          abortSignal
        );
        setCompiled(res_data);
      } catch {
        console.log("useCompile: fetch aborted");
      }
    }
    fetchData(controller.signal);
    return () => {
      controller.abort();
    };
  }, [script]);
  return compiled;
}

function useValidation(
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

        const res_data = await mm_api.getByAPI_post(
          "is_scenario_valid",
          scenario_req,
          abortSignal
        );
        setError(res_data);
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
  }, [scenario, condition]);
  return error;
}

type ScenarioProps = {
  value: any;
  mode?: string;
  saveCallback: (saveprop: MyTypes.ScenarioDefenition) => void;
  current_index?: number | null;
};

function Scenario({
  value,
  mode = "edit",
  saveCallback,
  current_index,
}: ScenarioProps) {
  const [script, setScript] = useState<string>(value.script);
  const [condition, setCondition] = useState(value.starting_condition);
  const [name, setName] = useState(value.name);

  const sc = useCompile(script);
  const error = useValidation(condition, sc);
  const all_states = useAllStates();

  const handleChangeScript = (el: any) => {
    setScript(el.target.value);
  };
  const handleChangeLevel = (el: any) => {
    const new_condition = Object.assign({}, condition);
    new_condition.level = el.target.value;
    setCondition(new_condition);
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
              <FloatingLabel label="Starting Level">
                <Form.Control
                  value={condition.level}
                  onChange={handleChangeLevel}
                />
              </FloatingLabel>
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
                  sendCommand({
                    command: "execScenario",
                    payload: {
                      name: name,
                      commands: sc,
                    },
                  });
                }}
              >
                Run
              </Button>
              <Button
                onClick={() => {
                  sendCommand({ command: "pause" });
                }}
              >
                Pause
              </Button>
              <Button
                onClick={() => {
                  sendCommand({ command: "resume" });
                }}
              >
                Resume
              </Button>
              <Button
                onClick={() => {
                  sendCommand({ command: "stop" });
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
function Scenarios({ status }: { status?: MyTypes.ScenarioStatus }) {
  const [scenarios, setScenarios] = useState<MyTypes.ScenarioDefenition[]>([
    {
      name: "scenario 1",
      starting_condition: {
        type: "MD",
        level: 2,
        state: "on_pins_support",
      },
      script:
        'function (){n = 1; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 2",
      starting_condition: {
        type: "MD",
        level: 1,
        state: "on_pins_support",
      },
      script:
        'function (){n = 2; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 3",
      starting_condition: {
        type: "MD",
        level: 0,
        state: "on_pins_support",
      },
      script:
        'function (){n = 3; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 4",
      starting_condition: {
        type: "MD",
        level: 3,
        state: "on_pins_support",
      },
      script:
        'function (){n = 4; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
  ]);
  const def_scenario = {
    name: "",
    starting_condition: {
      level: 0,
      state: "on_pins_support",
    },
    script: "[]",
  };
  useEffect(() => {
    mm_api.getByAPI_get("scenarios").then((value) => setScenarios(value));
  }, []);

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
    mm_api.getByAPI_post("save_scenario", scenario).then((value) => {
      setScenarios(value);
    });
  };
  const [editMode, setEditMode] = useState(false);
  const radios = [
    { name: "Use", value: 0 },
    { name: "Edit", value: 1 },
  ];
  return (
    <Tab.Container
      id="list-group-tabs-example"
      defaultActiveKey="create_new_scenario"
    >
      <Row>
        <Col>
          <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
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
          <ButtonGroup>
            {radios.map((radio, idx) => (
              <ToggleButton
                key={idx}
                id={`radio-${idx}`}
                type="radio"
                variant="outline-success"
                name="radio"
                value={radio.value}
                checked={radio.value ? editMode : !editMode}
                onChange={(e) => setEditMode(radio.value ? true : false)}
              >
                {radio.name}
              </ToggleButton>
            ))}
          </ButtonGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <Tab.Content>
            {scenarios.map((element) => (
              <Tab.Pane key={element.name} eventKey={`${element.name}`}>
                <Scenario
                  key={`scenario_${element.name}`}
                  value={element}
                  current_index={
                    status?.name === element.name ? status?.step_index : null
                  }
                  saveCallback={handleSaveScenario}
                  mode={editMode ? "edit" : "use"}
                />
              </Tab.Pane>
            ))}
            <Tab.Pane eventKey={"create_new_scenario"}>
              <Scenario
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
function App() {
  const st = useCycState();
  return (
    <Container fluid>
      <Row>
        <Col>
          <Tabs id="page">
            <Tab eventKey="mm" title="MM">
              <Container fluid>
                <Row>
                  <Col>
                    <GraphImage />
                  </Col>
                  <Col xs={4}>
                    <Jumbotron>
                      <Tabs
                        defaultActiveKey="scenario"
                        id="graph-controll"
                        className="mb-3"
                      >
                        <Tab eventKey="commands" title="Direct control">
                          <DirectControls />
                        </Tab>
                        <Tab eventKey="scenario" title="By scenario">
                          <Scenarios status={st?.scenario_status} />
                        </Tab>
                      </Tabs>
                    </Jumbotron>
                  </Col>
                </Row>
              </Container>
            </Tab>
            <Tab eventKey="md" title="MD">
              DOmkrat
            </Tab>
          </Tabs>
        </Col>
      </Row>
      <Row>
        <Col>
          <Jumbotron>
            <h4>Debug info</h4>
            <CurrentState machine_status={st?.machine_status} />
            <pre>{JSON.stringify(st, null, 2)}</pre>
          </Jumbotron>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
