import { useEffect, useState } from "react";

import { API } from "../api";
import { RepeaterRequestMatching } from "../repeater";
import { RequestMatching } from "../types";

function usePlcVaribles<T>(
  reading_port: number,
  cancel: { should_cancel: boolean },
  def_values: T
) {
  // eslint-disable-next-line
  const [readApi, setReadApi] = useState<API<RepeaterRequestMatching>>(
    () => new API<RepeaterRequestMatching>("http://localhost", reading_port)
  );
  const [plc_vars, setPlcVars] = useState(def_values);

  useEffect(() => {
    const stop = { should_stop: false };
    const run = async () => {
      await readApi
        .getByAPI_post("read_vars_by_array", {
          var_names: Object.keys(def_values),
        })
        .then((value) => {
          if (!cancel.should_cancel && !stop.should_stop)
            setPlcVars(value.vars as T);
          else cancel.should_cancel = false;
        })
        .catch((reason) => console.log(reason));
      if (!stop.should_stop) setTimeout(run, 500);
    };
    run();
    return () => {
      console.log("useAdditionalMD is unmounted");
      // clearInterval(plcvar_upd);
      stop.should_stop = true;
    };
  }, [readApi, cancel, def_values]);
  return { plc_vars, setPlcVars };
}

export function usePlcContainer<T>(
  read_port: number,
  writing_port: number,
  def_values: T
) {
  // eslint-disable-next-line
  const [writeApi, setWriteApi] = useState<API<RepeaterRequestMatching>>(
    () => new API<RepeaterRequestMatching>("http://localhost", writing_port)
  );
  // eslint-disable-next-line
  const [cancelUpdate, setCancelUpdate] = useState({ should_cancel: false });

  const { plc_vars, setPlcVars } = usePlcVaribles(
    read_port,
    cancelUpdate,
    def_values
  );

  const handle_button_click = (var_name: keyof T, value?: any) => {
    if (value === undefined) value = !plc_vars[var_name];
    var obj = {};
    Object.defineProperty(obj, var_name, {
      value: value,
      enumerable: true,
    });
    setPlcVars({
      ...plc_vars,
      ...obj,
    });
    // setCancelUpdate({ should_cancel: true });
    cancelUpdate.should_cancel = true;
    writeApi.getByAPI_post("set_vars_by_array", obj);
  };

  return { plc_vars, handle_button_click };
}

export function MpPanel({
  machine,
}: {
  machine: { name: string; api: API<RequestMatching> } & {
    type: "MP";
    length: number;
    reading_port: { zmq: number; ui: number };
    seting_port: { zmq: number; ui: number };
  };
}) {}
