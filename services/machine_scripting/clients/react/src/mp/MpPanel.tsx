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
          </Alert>
        </Col>
        <Col md={5}>
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

        <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="SVU_MD_ViewWork"
                />
                <Col md={7}>SVU_MD_ViewWork: false, // Состояние удержания кассеты с подтягиванием каната. Кассета должна быть внизу, чтобы было допустимо устанавливать эту переменную.</Col>
                                <YesNoButton
                  handle_button_click={handle_button_click}
                  plc_vars={plc_vars}
                  var_name="SVU_Ready"
                />
                <Col md={7}>SVU_Ready: false, // Это команда для отклюючения пульта подъемника. На нее  опирается плк подъемника.</Col>
                                <YesNoBadge
                  value={plc_vars.TPK_Home}
                  className="container-fluid"
                />
                <Col md={7}>TPK_Home: false, //Флаг прижатия кассеты к раме.</Col>

  <Col md={1}>
                <Badge bg="secondary">{plc_vars.Forced_Frame_Height}</Badge>
              </Col>
              <Col md={7}>FC1_Frequency - Высота низа силовой рамы относительно пола в метрах.</Col>
  <Col md={1}>
                <Badge bg="secondary">{plc_vars.Height_To_Bottom}</Badge>
              </Col>
              <Col md={7}>Height_To_Bottom - Расстояние от пола до низа ТПК.</Col>
        </Col>
      </Row>

      <Alert variant="success">
        <pre>Высота: {machine.length}</pre>
      </Alert>
    </Container>
  );
}
