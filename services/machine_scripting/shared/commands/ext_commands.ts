import { MM_address } from "../types/types"
import { BuildingComponent } from "../types/types"

type ColumnAddres = Extract<BuildingComponent, { type: "column" }>["address"];
type LinkAddres = MM_address;

const init_commands = {
	setAddres: { cassete: 0, pos: 0 } as LinkAddres,
	setColumnArdess: { pos: 0 } as ColumnAddres,
	startMountCycle: { pos: 0 } as ColumnAddres,

	// p200Start: { skip: [] } as { skip: number[]; },
	// p300Start: { skip: [] } as { skip: number[]; },
	// p500Start: { skip: [] } as { skip: number[]; },
	// p700Start: { skip: [] } as { skip: number[]; },
	// p800Start: { skip: [] } as { skip: number[]; },
	// p600Start: { skip: [] } as { skip: number[]; },
	// next: { skip: [] } as { skip: number[]; },


} as const;
export type CommandsVithParameters = typeof init_commands;

export { init_commands }
