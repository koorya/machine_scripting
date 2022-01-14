import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  Row,
} from "react-bootstrap";
import { init_vars } from "../shared/mp/plc_vars";
import { API } from "../shared/api/api";
import { usePlcContainer } from "../plcvarcontainer/PlcVarConainer";
import { RequestMatching } from "../shared/types/types";
import { ButtonToggle, YesNoBadge, YesNoButton } from "../utils/panel_utils";

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
  const { plc_vars, handle_button_click } = usePlcContainer(
    machine.reading_port.ui,
    machine.seting_port.ui,
    init_vars
  );
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
              <Col md={6}>
                <ButtonToggle
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="FC1_State"
                  radios={[
                    { name: "error", value: 8, variant: "outline-danger" },
                    { name: "Сброс", value: 9, variant: "outline-danger" },
                    { name: "Вверх", value: 2 },
                    { name: "Стоп", value: 1 },
                    { name: "Вниз", value: 5 },
                  ]}
                />
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
                  active_variant="danger"
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
              <Col md={6}>
                <ButtonToggle
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="FC2_State"
                  radios={[
                    { name: "Сброс", value: 5, variant: "outline-danger" },
                    { name: "Лево", value: 2 },
                    { name: "Стоп", value: 1 },
                    { name: "Право", value: 3 },
                  ]}
                />
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
                  active_variant="danger"
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
