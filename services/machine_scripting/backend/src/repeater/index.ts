import * as express from "express";
import * as cors from "cors";

import yargs, { options } from "yargs";
import { hideBin } from "yargs/helpers";

import { PlcConnector } from "../zmq_network";

import { RepeaterRequestMatching } from "~shared/types/repeater";

const argv = yargs(hideBin(process.argv)).argv;

const zmq_port = argv["zmq_port"] ? argv["zmq_port"] : 5562;
const ui_port = argv["ui_port"] ? argv["ui_port"] : 5061;
console.log(`zmq_port: ${zmq_port}`);
console.log(`ui_port: ${ui_port}`);

const plc = new PlcConnector(zmq_port);


const app = express();
app.use(express.json());
app.use(cors());

app.post("/read_vars_by_array", (request, response) => {
	type ReqType = Extract<RepeaterRequestMatching, { type: "read_vars_by_array" }>["request"];
	type ResType = Extract<RepeaterRequestMatching, { type: "read_vars_by_array" }>["response"];

	const { var_names }: ReqType = request.body;
	plc.readVarToObj(var_names).then(
		(plc_vars) => {
			const res: ResType = { vars: plc_vars };
			return response.send(JSON.stringify(res));
		}
	).catch((reason) => {
		console.log(`error during readVarToObj: ${reason}`);
		return response.status(400).send("service is busy");
	})
});

app.post("/set_vars_by_array", (request, response) => {
	type ReqType = Extract<RepeaterRequestMatching, { type: "set_vars_by_array" }>["request"];
	type ResType = Extract<RepeaterRequestMatching, { type: "set_vars_by_array" }>["response"];
	const vars: ReqType = request.body;
	console.log(`set_vars_by_array vars: ${JSON.stringify(vars, null, 2)}`)
	plc.writeVar(vars).then(
		(plc_vars) => {
			const res: ResType = { vars: plc_vars };
			return response.send(JSON.stringify(res));
		}
	)
});

const server = app.listen(ui_port, () => console.log(`running on port ${ui_port}`));

process.on("SIGTERM", () => {
	server.close(() => {
		console.log("Process terminated");
	});
});
