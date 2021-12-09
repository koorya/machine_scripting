
export class CommandConveyor {

	eCommands: IterableIterator<string> = [][Symbol.iterator]();
	saved_cmd_seq: IterableIterator<string> = [][Symbol.iterator]();
	cmd_iterator: Generator<string, "", string>;
	end_callback: () => Promise<void>;
	cmd_callback: () => Promise<void>;
	constructor() {
		this.cmd_iterator = this.nextCmd();
		this.end_callback = async () => { };
	}
	*nextCmd(): Generator<string, "", string> {
		let callback_exec = false;
		while (true) {
			yield "error";
			yield "step";
			const cmd = this.eCommands.next();
			if (!cmd.done && cmd.value) {
				callback_exec = false;
				this.cmd_callback();
				console.log(`nextCmdGenerator | cmd_callback | cmd: ${cmd.value}`);
				yield cmd.value;
			} else {
				if (!callback_exec) {
					callback_exec = true;
					this.end_callback();
					console.log(`calback executed`)
				}
			}
		}
	}
	addCommandSequence(cmd_seq: string[]) {
		const cmds: string[] = [];
		var cmd_i = null;
		while (!cmd_i?.done) {
			cmd_i = this.eCommands.next()
			if (!cmd_i.done)
				cmds.push(cmd_i.value)
		}
		cmds.push(...cmd_seq);
		this.eCommands = cmds[Symbol.iterator]();
		this.cmd_iterator = this.nextCmd();
	}
	clearCmdSequenceFull() {
		this.eCommands = [,][Symbol.iterator]();
		this.saved_cmd_seq = [,][Symbol.iterator]();
		this.cmd_iterator = this.nextCmd();
		this.end_callback = async () => { };
	}
	clearCmdSequenceAndSave() {
		this.saved_cmd_seq = this.eCommands;
		this.eCommands = [,][Symbol.iterator]();
		this.cmd_iterator = this.nextCmd();
		this.end_callback = async () => { };
	}
	getNextCmd() {
		return this.cmd_iterator.next().value;
	}
	addCommandSeqVithCallback(cmd_seq: string[], end_callback: () => Promise<void>, cmd_callback: () => Promise<void> = async () => { }) {
		this.addCommandSequence(cmd_seq);
		this.end_callback = end_callback;
		this.cmd_callback = cmd_callback;
	}
	resumeSavedCmdSeq(end_callback: () => Promise<void>, cmd_callback: () => Promise<void> = async () => { }) {
		this.eCommands = this.saved_cmd_seq;
		this.saved_cmd_seq = [,][Symbol.iterator]();
		this.cmd_iterator = this.nextCmd();
		this.end_callback = end_callback;
		this.cmd_callback = cmd_callback;
	}
}
