import React, { useState, useEffect } from "react";

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

function Image() {
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
    <img
      style={{ border: "red 1px solid" }}
      src={`data:image/svg+xml;base64,${image}`}
      alt="states"
    />
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
  return (
    <ul>
      {useCmds().map((cmd) => (
        <li
          key={cmd}
          style={{ float: "left", marginLeft: "10px", listStyleType: "none" }}
        >
          <input
            disabled={cmd === "step"}
            type="button"
            value={cmd}
            key={cmd}
            onClick={() => btnClick(cmd)}
          />
        </li>
      ))}
      <li style={{ clear: "both", listStyleType: "none" }}></li>
    </ul>
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
function Scenarios() {
  const [scenarios, setScenarios] = useState([]);
  useEffect(
    () =>
      fetch("http://localhost:5001/scenarios")
        .then((res) => res.json())
        .then((res) => {
          setScenarios(res);
        }),
    []
  );
  return (
    <div>
      <ul>
        {scenarios.map((element) => (
          <li key={element.name}>{element?.name}</li>
        ))}
      </ul>
    </div>
  );
}
function App() {
  return (
    <div>
      <Scenarios />
      <Image />
      <El />
      <CurrentState />
    </div>
  );
}

export default App;
