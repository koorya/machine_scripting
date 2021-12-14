import {
	createPlcFsm as createPlcFsmMM,
	transitions as transitionsMM
} from "./mm/plc_fsm";
import {
	createPlcFsm as createPlcFsmMD,
	transitions as transitionsMD
} from "./md/plc_fsm";
import {
	createPlcFsm as createPlcFsmMP,
	transitions as transitionsMP,
} from "./mp/plc_fsm";

import * as MyTypes from "~shared/types/types";
import { ImageRender } from "./image_render";

export function createPlcFsmWithRender(machine_type: MyTypes.Machines, zmq_port: number) {
	if (machine_type == "MM")
		return {
			plc_fsm: createPlcFsmMM(zmq_port),
			render: new ImageRender(transitionsMM),
		};
	if (machine_type == "MD")
		return {
			plc_fsm: createPlcFsmMD(zmq_port),
			render: new ImageRender(transitionsMD),
		};
	if (machine_type == "MP")
		return {
			plc_fsm: createPlcFsmMP(zmq_port),
			render: new ImageRender(transitionsMP),
		};
};
