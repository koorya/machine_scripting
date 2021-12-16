import { Badge, Button, ButtonGroup, ToggleButton } from "react-bootstrap";

export function YesNoBadge({
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

export function YesNoButton<PlcVAriables extends string>({
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

export function ButtonToggle<PlcVAriables extends string>({
  var_name,
  handle_button_click,
  plc_vars,
  radios,
}: {
  var_name: PlcVAriables;
  handle_button_click: (name: PlcVAriables, value: number) => void;
  plc_vars: { [key in PlcVAriables]: any };
  radios: {
    name: string;
    value: number;
    variant?: "outline-danger" | "outline-success";
  }[];
}) {
  return (
    <ButtonGroup>
      {radios.map((radio, idx) => (
        <ToggleButton
          size="sm"
          key={`radio-${var_name}-${idx}`}
          id={`radio-${var_name}-${idx}`}
          type="radio"
          variant={radio.variant || "outline-success"}
          name={`radio-${var_name}`}
          value={radio.value}
          checked={plc_vars[var_name] === radio.value}
          onChange={(e) => {
            handle_button_click(var_name, parseInt(e.target.value));
          }}
        >
          {radio.name}-{radio.value}
        </ToggleButton>
      ))}
    </ButtonGroup>
  );
}
