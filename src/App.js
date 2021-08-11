import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/ListGroup";
import Image from "react-bootstrap/Image";
import Toast from "react-bootstrap/Toast";
import Container from "react-bootstrap/Container";
import Spinner from "react-bootstrap/Spinner";
import Form from "react-bootstrap/Form";
import FloatingLabel from "react-bootstrap/FloatingLabel";
import Alert from "react-bootstrap/Alert";
import Accordion from "react-bootstrap/Accordion";
import ToggleButton from "react-bootstrap/ToggleButton";

function Jumbotron(props) {
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
  const [cmds, setCmds] = useState([]);
  useEffect(() => {
    const cmds_upd = setInterval(() => {
      fetch("http://localhost:5001/commands")
        .then((res) => res.json())
        .then((res) => {
          setCmds(res);
        });
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(cmds_upd);
    };
  }, []);
  return cmds;
}
function useCycState() {
  const [val, setVal] = useState(null);
  useEffect(() => {
    const upd = setInterval(() => {
      fetch("http://localhost:5001/cycle_state")
        .then((res) => res.json())
        .then((res) => {
          setVal(res);
        });
    }, 100);
    return () => {
      console.log("useCmds is unmounted");
      clearInterval(upd);
    };
  }, []);
  return val;
}

function GraphImage() {
  const [image, setImage] = useState(null);
  useEffect(() => {
    const image_upd = setInterval(() => {
      fetch("http://localhost:5001/image")
        .then((res) => res.text())
        .then((res) => {
          setImage(res);
        });
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

function El() {
  const btnClick = (cmd) => {
    fetch("http://localhost:5001/command", {
      method: "POST",
      body: JSON.stringify({ command: cmd }),
      headers: { "Content-Type": "application/json" },
    });
  };
  const cmds = useCmds();
  return cmds.includes("step") ? (
    <Spinner animation="border" />
  ) : (
    <>
      {cmds.map((cmd) => (
        <Button
          className="mx-1"
          disabled={cmd === "step"}
          key={cmd}
          onClick={() => btnClick(cmd)}
          size="sm"
        >
          {cmd}
        </Button>
      ))}
    </>
  );
}
function CurrentState() {
  const st = useCycState();
  return (
    <div>
      {st != null ? (
        <>
          state: {st.state} <br />
          step: {st.cycle_step}
          <br />
          level: {st.current_level}
        </>
      ) : (
        "not load"
      )}
    </div>
  );
}
function useCompile(script) {
  const [compiled, setCompiled] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    fetch("http://localhost:5001/compile_scenario", {
      method: "POST",
      body: JSON.stringify({ script: script }),
      headers: { "Content-Type": "application/json" },
      signal: signal,
    })
      .then(
        (res) => res.json(),
        () => console.log("useCompile fetch aborted")
      )
      .then((res) => {
        setCompiled(res);
      });
    return () => {
      controller.abort();
    };
  }, [script]);
  return compiled;
}

function useAllStates() {
  const [allStates, setAllStates] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5001/get_all_states", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        setAllStates(res);
      });
    return () => {};
  }, []);
  return allStates;
}
function useValidation(condition, scenario) {
  const [error, setError] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    if (scenario && scenario.length == 0) {
      setError({ error: "scenario is empty" });
    } else {
      fetch("http://localhost:5001/is_scenario_valid", {
        method: "POST",
        body: JSON.stringify({
          compiled_scenario: scenario,
          starting_condition: condition,
        }),
        headers: { "Content-Type": "application/json" },
        signal: signal,
      })
        .then(
          (res) => res.json(),
          () => console.log("fetch aborted")
        )
        .then((res) => {
          setError(res);
        });
    }
    return () => {
      controller.abort();
    };
  }, [scenario, condition]);
  return error;
}

function Scenario({ value, mode = "edit", saveCallback }) {
  const [script, setScript] = useState(value.script);
  const [condition, setCondition] = useState(value.starting_condition);
  const [name, setName] = useState(value.name);

  // const sc = ["dd", "ss"];
  // const error = {};
  // const all_states = useAllStates();

  const sc = useCompile(script);
  const error = useValidation(condition, sc);
  const all_states = useAllStates();
  const handleChangeScript = (el) => {
    setScript(el.target.value);
  };
  const handleChangeLevel = (el) => {
    const new_condition = Object.assign({}, condition);
    new_condition.level = el.target.value;
    console.log(new_condition);
    setCondition(new_condition);
  };
  const handleChangeState = (el) => {
    const new_condition = Object.assign({}, condition);
    new_condition.state = el.target.value;
    setCondition(new_condition);
  };
  const handleChangeName = (el) => {
    setName(el.target.value);
  };

  const handleSaveButton = () => {
    if (name === "" || error?.error) return;
    saveCallback({
      name: name,
      starting_condition: condition,
      script: script,
    });
    handleResetButton();
  };
  const handleResetButton = () => {
    setScript(value.script);
    setCondition(value.starting_condition);
    setName(value.name);
  };
  return (
    <Alert variant={error?.error ? "warning" : "light"}>
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
        <>
          <Button className="mx-1">Run</Button>
          <Button className="mx-1">Stop</Button>
        </>
      )}
      <Row>
        <Col>
          {" "}
          <Accordion defaultActiveKey="0" className="py-1">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Resault Command list</Accordion.Header>
              <Accordion.Body>
                <ListGroup>
                  {sc?.map((el, index) => (
                    <ListGroup.Item
                      size="sm"
                      key={"Scenario_btn" + el + "_" + index}
                      variant={error?.index == index ? "danger" : null}
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
function Scenarios() {
  const [scenarios, setScenarios] = useState([
    {
      name: "scenario 1",
      starting_condition: {
        level: 2,
        state: "on_pins_support",
      },
      script:
        'function (){n = 1; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 2",
      starting_condition: {
        level: 1,
        state: "on_pins_support",
      },
      script:
        'function (){n = 2; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 3",
      starting_condition: {
        level: 0,
        state: "on_pins_support",
      },
      script:
        'function (){n = 3; return [  "pushinCrab",\n  "liftDownBottomFrame",\n  ...repeat("liftUpFrame", n),\n  ...repeat("liftDownFrame",n-1),\n  "holdFrame",\n  "horizontalMoveTopFrame",\n  "prepareToTopFrameMoveing",\n  "liftUpFrame",\n  "liftUpFrame",\n  "liftUpFrame",\n]}()',
    },
    {
      name: "scenario 4",
      starting_condition: {
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
  useEffect(
    () =>
      fetch("http://localhost:5001/scenarios")
        .then((res) => res.json())
        .then((res) => {
          setScenarios(res);
        }),
    []
  );

  const handleSaveScenario = (scenario) => {
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

    fetch("http://localhost:5001/save_scenario", {
      method: "POST",
      body: JSON.stringify(scenario),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        if (!res?.error) setScenarios(res);
      });
  };
  const [editMode, setEditMode] = useState(true);
  return (
    <Jumbotron>
      <Tab.Container id="list-group-tabs-example">
        <Row>
          <Col>
            <ListGroup>
              {scenarios.map((element) => (
                <ListGroup.Item
                  key={element.name}
                  action
                  href={`#${element.name}`}
                >
                  {element?.name}
                </ListGroup.Item>
              ))}
            </ListGroup>
          </Col>
        </Row>
        <Row>
          <Col>
            <Accordion className="py-1">
              <Accordion.Header>Create new scenario</Accordion.Header>
              <Accordion.Body>
                <Scenario
                  value={def_scenario}
                  saveCallback={handleSaveScenario}
                />
              </Accordion.Body>
            </Accordion>
          </Col>
        </Row>
        <Row>
          <Col>
            <ToggleButton
              id="toggle-check"
              className="mb-2"
              type="checkbox"
              variant="outline-primary"
              checked={editMode}
              value="1"
              onChange={(e) => setEditMode(e.currentTarget.checked)}
            >
              Edit mode
            </ToggleButton>
            <Tab.Content>
              {scenarios.map((element) => (
                <Tab.Pane key={element.name} eventKey={`#${element.name}`}>
                  <Scenario
                    key={`scenario_${element.name}`}
                    value={element}
                    saveCallback={handleSaveScenario}
                    mode={editMode ? "edit" : "use"}
                  />
                </Tab.Pane>
              ))}
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Jumbotron>
  );
}
const ExampleToast = ({ children }) => {
  const [show, toggleShow] = useState(true);

  return (
    <>
      {!show && <Button onClick={() => toggleShow(true)}>Show Toast</Button>}
      <Toast show={show} onClose={() => toggleShow(false)}>
        <Toast.Header>
          <strong className="mr-auto">React-Bootstrap</strong>
        </Toast.Header>
        <Toast.Body>{children}</Toast.Body>
      </Toast>
    </>
  );
};

function App() {
  return (
    <Container fluid>
      <Row>
        <Col>
          <GraphImage />
        </Col>
        <Col xs={4}>
          <Scenarios />
          <Jumbotron>
            <El />
            <CurrentState />
          </Jumbotron>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
