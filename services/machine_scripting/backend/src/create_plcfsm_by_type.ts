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
import { ImageRender } from "./image_render";
import { ExtConfig, iData, MachineData } from "./fsm_types";



export function createPlcFsmWithRender(config: ExtConfig) {
	if (config.type == "MM")
		return {
			plc_fsm: createPlcFsmMM(config.ext_config.zmq_port),
			render: new ImageRender(graphMM),
		};
	if (config.type == "MD")
		return {
			plc_fsm: createPlcFsmMD(config.ext_config.zmq_port),
			render: new ImageRender(graphMD),
		};
	if (config.type == "MP")
		return {
			plc_fsm: createPlcFsmMP(config.ext_config.zmq_port),
			render: new ImageRender(graphMP),
		};
	if (config.type == "MASTER")
		return {
			plc_fsm: createPlcFsmMASTER(config.ext_config),
			render: new ImageRender(graphMASTER),
		};
};
