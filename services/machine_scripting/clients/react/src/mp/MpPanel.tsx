import React, { useEffect, useState } from "react";
import { API } from "../api";
import { RepeaterRequestMatching } from "../repeater";
import { RequestMatching } from "../types";
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";

const init_vars = {
  FC1_Error: false, // - ошибка на ПЧ1 (грузоподъемный механизм)
  FC2_Error: false, // - ошибка на ПЧ2 (механизм перемещения)
  Global_Emergency_Lock: false, // - программный аварийный стоп

  EmAlrm: false, // - аварийная кнопка (грибок) на шкафу МП
  // Если не активны Global_Emergency_Lock и EmAlrm - активируется Relay_K1_LowPL.
  // Если же становится активным хоть один из сигналов EmAlrm или Global_Emergency_Lock - деактивируются FC1_M1_State, FC1_M2_State, сбрасываются на 0 состояние FC1_State, FC2_State, активируются Lock_Brake_M1_State, Lock_Brake_M2_State.
  // Если стал активным EmAlrm то делается активным и Global_Emergency_Lock.
  Relay_K1_LowPL: false, // - реле(К1) на контактор (КМ1), включает раздачу питания на ПЧ1 и ПЧ2, электрические тормоза и прочие неприоритетные потребители).
  // ---
  FC1_State: 0, // - переменная состояния (автомат для ПЧ1, грузоподъемный механизм).
  FC1_Cmd: 0, // - команда для ПЧ1 (0-Стоп, 1-Вниз, 2-Вверх).
  FC1_Frequency: 0, // - задатчик частоты (Гц * 100).
  FC1_M1_State: false, // - сигнал для включения реле (К2) контактора (КМ2) электропитания ПЧ1.
  Relay_FC1_M1: false, // - реле (К2) для ПЧ1.
  Lock_Brake_M1_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ1.
  Relay_BRK_M1: false, // - сигнал для выключения аппаратного электротормоза двигателя М1.
  // ---
  FC2_State: 0, // - переменная состояния (автомат для ПЧ2, механизм перемещения).
  FC2_Forward: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение туда.
  FC2_Reverse: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение оттуда.
  FC2_Frequency: 0, // - задатчик частоты (Гц * 100).
  FC2_M2_State: false, // - сигнал для включения реле электропитания ПЧ2.
  Lock_Brake_M2_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ2.
  Relay_BRK_M2: false, // - сигнал для выключения аппаратного электротормоза двигателя М2.
  // ---
  // Переменные (больше информативные):
  Led_Red: false, // - есть какая-то авария.
  Welding_at_Drums: 0, // - слово (16бит) в котором битово обозначены состояния для оптических дискретных датчиков, т.е намотка троса по уровням для каждого из 2 барабанов (4+4 / 4+4).
};
type PlcVAriables = keyof typeof init_vars;

function usePlcVaribles(
  reading_port: number,
  cancel: { should_cancel: boolean }
) {
  // eslint-disable-next-line
  const [readApi, setReadApi] = useState<API<RepeaterRequestMatching>>(
    () => new API<RepeaterRequestMatching>("http://localhost", reading_port)
  );
  const [plc_vars, setPlcVars] = useState(init_vars);

  useEffect(() => {
    const stop = { should_stop: false };
    const run = async () => {
      await readApi
        .getByAPI_post("read_vars_by_array", {
          var_names: Object.keys(init_vars),
        })
        .then((value) => {
          if (!cancel.should_cancel && !stop.should_stop)
            setPlcVars(value.vars as typeof init_vars);
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
  }, [readApi, cancel]);
  return { plc_vars, setPlcVars };
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
}) {
  // eslint-disable-next-line
  const [writeApi, setWriteApi] = useState<API<RepeaterRequestMatching>>(
    () =>
      new API<RepeaterRequestMatching>(
        "http://localhost",
        machine.seting_port.ui
      )
  );
  // eslint-disable-next-line
  const [cancelUpdate, setCancelUpdate] = useState({ should_cancel: false });

  const { plc_vars, setPlcVars } = usePlcVaribles(
    machine.reading_port.ui,
    cancelUpdate
  );

  const handle_button_click = (var_name: PlcVAriables, value?: any) => {
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

  return (
    <Container fluid>
      <Row>
        <Col md={4}>
          <Alert variant="warning">
            <Alert.Heading>Сигналы в машине</Alert.Heading>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.Led_Red}
                  className="container-fluid"
                  active_variant="danger"
                />
              </Col>
              <Col>Led_Red - есть какая-то авария.</Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.FC1_Error}
                  className="container-fluid"
                  active_variant="danger"
                />
              </Col>
              <Col>FC1_Error - ошибка на ПЧ1 (грузоподъемный механизм) </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.FC2_Error}
                  className="container-fluid"
                  active_variant="danger"
                />
              </Col>
              <Col>FC2_Error - ошибка на ПЧ2 (механизм перемещения) </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.EmAlrm}
                  className="container-fluid"
                  active_variant="danger"
                />
              </Col>
              <Col>EmAlrm - аварийная кнопка (грибок) на шкафу МП </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={5}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Global_Emergency_Lock"
                  active_variant="danger"
                />
              </Col>
              <Col> - программный аварийный стоп </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={5}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Relay_K1_LowPL"
                />
              </Col>
              <Col>
                - реле(К1) на контактор (КМ1), включает раздачу питания на ПЧ1 и
                ПЧ2, электрические тормоза и прочие неприоритетные потребители).
              </Col>
            </Row>
            <br />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x1) === 0x1}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x2) === 0x2}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x4) === 0x4}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x8) === 0x8}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x10) === 0x10}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x20) === 0x20}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x40) === 0x40}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x80) === 0x80}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x100) === 0x100}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x200) === 0x200}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x400) === 0x400}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x800) === 0x800}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x1000) === 0x1000}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x2000) === 0x2000}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x4000) === 0x4000}
              digit
            />
            <YesNoBadge
              value={(plc_vars.Welding_at_Drums & 0x8000) === 0x8000}
              digit
            />
            Welding_at_Drums - слово (16бит) в котором битово обозначены
            состояния для оптических дискретных датчиков, т.е намотка троса по
            уровням для каждого из 2 барабанов (4+4 / 4+4).
            <br />
            <Button
              variant="secondary"
              onClick={() => {
                handle_button_click("Welding_at_Drums", 22254);
              }}
            >
              setvalue
            </Button>
          </Alert>
        </Col>
        <Col>
          <Alert variant="warning">
            <Alert.Heading>Управление подъемом</Alert.Heading>
            <Row className="align-items-center py-1">
              <Col md={4}>
                <Badge bg="secondary" className="container-fluid">
                  {plc_vars.FC1_State}
                </Badge>
              </Col>
              <Col>
                FC1_State - переменная состояния (автомат для ПЧ1,
                грузоподъемный механизм).
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={5}>
                <Badge bg="secondary" className="container-fluid">
                  {plc_vars.FC1_Cmd}-
                  {plc_vars.FC1_Cmd === 0
                    ? "Стоп"
                    : plc_vars.FC1_Cmd === 1
                    ? "Вниз"
                    : plc_vars.FC1_Cmd === 2
                    ? "Вверх"
                    : "impossible"}
                </Badge>
              </Col>
              <Col>FC1_Cmd - команда для ПЧ1 (0, 1, 2)</Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Range
                  value={plc_vars.FC1_Frequency}
                  min={0}
                  max={5000}
                  title=""
                  onChange={(e) => {
                    handle_button_click(
                      "FC1_Frequency",
                      parseInt(e.target.value)
                    );
                  }}
                />
              </Col>
              <Col md={1}>
                <Badge bg="secondary">{plc_vars.FC1_Frequency}</Badge>
              </Col>
              <Col md={7}>FC1_Frequency - задатчик частоты (Гц * 100).</Col>
            </Row>

            <Row className="align-items-center py-1">
              <Col md={4}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="FC1_M1_State"
                />
              </Col>
              <Col>
                - сигнал для включения реле (К2) контактора (КМ2) электропитания
                ПЧ1.
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={4}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Relay_FC1_M1"
                />
              </Col>
              <Col>- реле (К2) для ПЧ1.</Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={5}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Lock_Brake_M1_State"
                />
              </Col>
              <Col>
                - программный сигнал для блокировки тормоза двигателя М1 для
                ПЧ1.
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={4}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Relay_BRK_M1"
                />
              </Col>
              <Col>
                - сигнал для выключения аппаратного электротормоза двигателя М1.
              </Col>
            </Row>
          </Alert>
        </Col>
        <Col>
          <Alert variant="warning">
            <Alert.Heading>
              Управление горизонтальным перемещением
            </Alert.Heading>
            <Row className="align-items-center py-1">
              <Col md={3}>
                <Badge bg="secondary" className="container-fluid">
                  0
                </Badge>
              </Col>
              <Col>
                FC2_State - переменная состояния (автомат для ПЧ2, механизм
                перемещения).
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.FC2_Forward}
                  className="container-fluid"
                />
              </Col>
              <Col>
                FC2_Forward - команда (дискретный выходной сигнал с ПЛК и через
                аппаратный концевой переключатель идет на ПЧ2) на движение туда.
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={2}>
                <YesNoBadge
                  value={plc_vars.FC2_Reverse}
                  className="container-fluid"
                />
              </Col>
              <Col>
                FC2_Reverse - команда (дискретный выходной сигнал с ПЛК и через
                аппаратный концевой переключатель идет на ПЧ2) на движение
                оттуда.
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Range
                  // defaultValue={plc_vars.FC2_Frequency}
                  value={plc_vars.FC2_Frequency}
                  min={0}
                  max={5000}
                  title=""
                  onChange={(e) => {
                    handle_button_click(
                      "FC2_Frequency",
                      parseInt(e.target.value)
                    );
                  }}
                />
              </Col>
              <Col md={1}>
                <Badge bg="secondary">{plc_vars.FC2_Frequency}</Badge>
              </Col>
              <Col md={7}>FC2_Frequency - задатчик частоты (Гц * 100).</Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={4}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="FC2_M2_State"
                />
              </Col>
              <Col>- сигнал для включения реле электропитания ПЧ2.</Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={5}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Lock_Brake_M2_State"
                />
              </Col>
              <Col>
                - программный сигнал для блокировки тормоза двигателя М1 для
                ПЧ2.
              </Col>
            </Row>
            <Row className="align-items-center py-1">
              <Col md={4}>
                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="Relay_BRK_M2"
                />
              </Col>
              <Col>
                - сигнал для выключения аппаратного электротормоза двигателя М2.
              </Col>
            </Row>
          </Alert>
        </Col>
      </Row>

      <Alert variant="success">
        <pre>Высота: {machine.length}</pre>
      </Alert>
    </Container>
  );
}

function YesNoBadge({
  value,
  className,
  digit,
  active_variant = "success",
}: {
  value: boolean;
  className?: string;
  digit?: boolean;
  active_variant?: "success" | "danger";
}) {
  return (
    <Badge bg={value ? active_variant : "secondary"} className={className}>
      {digit === undefined ? (value ? "yes" : "no") : value ? "1" : "0"}
    </Badge>
  );
}

function YesNoButton({
  var_name,
  plc_vars,
  handle_button_click,
  active_variant = "success",
}: {
  var_name: PlcVAriables;
  plc_vars: { [key in PlcVAriables]: any };
  handle_button_click: (v: PlcVAriables) => void;
  active_variant?: "success" | "danger";
}) {
  return (
    <Button
      size="sm"
      className="container-fluid"
      onClick={() => {
        handle_button_click(var_name);
      }}
    >
      {var_name}
      <YesNoBadge value={plc_vars[var_name]} active_variant={active_variant} />
    </Button>
  );
}
