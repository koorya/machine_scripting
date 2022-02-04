import { MM_address } from "../types/types"


enum MD_LIFTMECH_CMDS {
	stop = 0,
	expand = 1,
	reduce = 2,
}
enum MD_LIFTMECH_STATES {
	holding = 0,
	expanding = 200,
	reducing = 300,
	expand_end = 400,
	reduce_end = 500,
	error = 98,

};

const init_commands = {
	setAddres: { cassete: 0, pos: 0 } as MM_address,

};

export { init_commands, MD_LIFTMECH_CMDS, MD_LIFTMECH_STATES }
