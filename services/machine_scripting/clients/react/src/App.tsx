import { useState, useEffect } from "react";
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
import * as MyTypes from "./shared/types/types";
import {
  ButtonGroup,
  Dropdown,
  FormControl,
  InputGroup,
  SplitButton,
  Tabs,
} from "react-bootstrap";
import { API } from "./shared/api/api";
import { AddParams, Machines, RequestMatching } from "./shared/types/types";
import MnemoMD from "./md/MnemoMD";
import NeuroImage from "./mm/NeuroImage";
import { MpPanel } from "./mp/MpPanel";
import { address_list } from "./shared/config/machines_config";

function Jumbotron(props: any) {
  return (
    <div
      style={{
        ...props.style,
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
  const [val, setVal] = useState<
    MyTypes.ControllerStatus<Machines> | undefined
  >(undefined);
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
  const [notUpdated, setNotUpdated] = useState(true);
  useEffect(() => {
    const image_upd = setInterval(() => {
      api
        .getByAPI_get("image")
        .then((value) => {
          if (value) {
            setNotUpdated(false);
            setImage(value);
          } else {
            setNotUpdated(true);
          }
        })
        .catch((t) => setNotUpdated(true));
    }, 100);
    return () => {
      console.log("useimage is unmounted");
      clearInterval(image_upd);
    };
  }, [api]);
  return (
    <Image
      style={{
        opacity: notUpdated ? "0.5" : "1.0",
        border: `5px ${notUpdated ? "red" : "white"} solid`,
      }}
      src={`data:image/svg+xml;base64,${image}`}
      alt="states"
      fluid
    />
  );
}

function DirectControls({
  api,
  available,
  all_states,
}: {
  api: API<RequestMatching>;
  available: boolean;
  all_states: string[];
}) {
  const cmds = useCmds(api);
  const [gotoState, setGotoState] = useState(all_states[1]);
  return (
    <>
      {cmds.map((cmd) =>
        cmd === "step" ? (
          <Button
            className="mx-1"
            disabled={available !== true}
            key={`${cmd}_Button`}
            onClick={() =>
              api
                .getByAPI_post("exec_graph_command", { command: cmd })
                .then((res) => console.log(res))
            }
            size="sm"
          >
            {cmd}
          </Button>
        ) : cmd === "goto" ? (
          <InputGroup size="sm" className="p-1">
            <SplitButton
              variant="primary"
              title="goto"
              id="segmented-button-dropdown-1"
              className="mx-1"
              key={`${cmd}_SplitButton`}
              onClick={() =>
                api
                  .getByAPI_post("exec_graph_command", {
                    command: `${cmd}({"state": "${gotoState}"})`,
                  })
                  .then((res) => console.log(res))
              }
            >
              {all_states.map((state) => {
                return (
                  <Dropdown.Item
                    onSelect={() => setGotoState(state)}
                    href="#"
                    key={`${state}_Dropdown.Item`}
                  >
                    {state}
                  </Dropdown.Item>
                );
              })}
            </SplitButton>
            <FormControl
              disabled
              value={gotoState}
              aria-label="Text input with dropdown button"
            />
          </InputGroup>
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
      {available !== true ? <Spinner size="sm" animation="border" /> : ""}
    </>
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
  status?: string;
  all_states: string[];
};

function Scenario({
  api,
  value,
  mode = "edit",
  saveCallback,
  current_index,
  status,
  all_states,
}: ScenarioProps) {
  const [script, setScript] = useState<string>(value.script);
  const [condition, setCondition] = useState<MyTypes.ScenarioStartCondition>(
    value.starting_condition
  );
  const [name, setName] = useState<string>(value.name);

  const sc = useCompile(api, script);
  const error = useValidation(api, condition, sc);

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
          <Alert
            variant={
              status === "available"
                ? "secondary"
                : status === "paused"
                ? "warning"
                : "primary"
            }
          >
            {status}
          </Alert>
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
  status,
  all_states,
}: {
  api: API<RequestMatching>;
  type: Machines;
  id: string;
  status?: string;
  all_states: string[];
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
                  status={status}
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
                  all_states={all_states}
                />
              </Tab.Pane>
            ))}
            <Tab.Pane eventKey={"create_new_scenario"}>
              <Scenario
                api={api}
                value={def_scenario}
                saveCallback={handleSaveScenario}
                all_states={all_states}
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
  const all_states = useAllStates(machine.api);

  return (
    <Container fluid>
      <Row>
        <Col>
          <GraphImage api={machine.api} />
        </Col>
        <Col xs={4}>
          <Jumbotron style={{ position: "sticky", top: "0px" }}>
            <Tabs
              defaultActiveKey="commands"
              // id={`graph-controll_${machine.name}`}
              className="mb-3"
            >
              <Tab eventKey="commands" title="Direct control">
                <DirectControls
                  api={machine.api}
                  available={controller_status?.state === "available"}
                  all_states={all_states}
                />
              </Tab>
              <Tab eventKey="scenario" title="By scenario">
                <Scenarios
                  status={controller_status?.state}
                  api={machine.api}
                  type={machine.type}
                  id={machine.name}
                  all_states={all_states}
                />
              </Tab>
              <Tab eventKey="status" title="Status">
                {controller_status?.machine_status.type === "MD" ? (
                  <div>level: {controller_status?.machine_status.level}</div>
                ) : controller_status?.machine_status.type === "MM" ? (
                  <div>
                    casette: {controller_status?.machine_status.address.cassete}
                    <br />
                    pos: {controller_status?.machine_status.address.pos} <br />
                  </div>
                ) : controller_status?.machine_status.type === "MP" ? (
                  <div>length: {controller_status?.machine_status.lenght}</div>
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

function App() {
  const [machineConfig, setMachineConfig] = useState<MachineConfig[]>([]);
  const [mode, setMode] = useState("");
  useEffect(() => {
    const get_machines_info = () => {
      return address_list.map((value) => {
        const t = {
          port: value.ui_port,
          name: value.name,
          ...value.specific_params,
        };
        return t;
      });
    };

    console.log(`window.location.href: ${window.location.href}`);
    setMode(window.location.pathname.slice(1));
    const machines = get_machines_info().map((machine) => {
      const api = new API("http://localhost", machine.port);
      const t = {
        api: api,
        ...machine,
      };
      return t;
    });
    setMachineConfig(machines as MachineConfig[]);
  }, [setMode]);

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
                mountOnEnter
                unmountOnExit
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
                    {mode !== "dev" ? (
                      <NeuroImage
                        ipcl={machine.neuro.ipcl}
                        ipcr={machine.neuro.ipcr}
                        port={machine.neuro.port}
                      />
                    ) : (
                      ""
                    )}
                  </Jumbotron>
                ) : machine.type === "MP" ? (
                  <Jumbotron>
                    <MpPanel machine={machine} />
                  </Jumbotron>
                ) : (
                  <Alert variant={"danger"}>unknown machine type</Alert>
                )}
              </Tab>
            ))}
          </Tabs>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
