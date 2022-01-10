import {
	createPlcFsm as createPlcFsmMM,
	graph as graphMM
} from "./mm/plc_fsm";
import {
	createPlcFsm as createPlcFsmMD,
	graph as graphMD
} from "./md/plc_fsm";
import {
	createPlcFsm as createPlcFsmMP,
	graph as graphMP,
} from "./mp/plc_fsm";
import {
	createPlcFsm as createPlcFsmMASTER,
	graph as graphMASTER,
} from "./master_machine/plc_fsm";

import * as MyTypes from "~shared/types/types";
import { ImageRender } from "./image_render";

export function createPlcFsmWithRender(machine_type: MyTypes.Machines, zmq_port: number) {
	if (machine_type == "MM")
		return {
			plc_fsm: createPlcFsmMM(zmq_port),
			render: new ImageRender(graphMM),
		};
	if (machine_type == "MD")
		return {
			plc_fsm: createPlcFsmMD(zmq_port),
			render: new ImageRender(graphMD),
		};
	if (machine_type == "MP")
		return {
			plc_fsm: createPlcFsmMP(zmq_port),
			render: new ImageRender(graphMP),
		};
	if (machine_type == "MASTER")
		return {
			plc_fsm: createPlcFsmMASTER(zmq_port),
			render: new ImageRender(graphMASTER),
		};
};
