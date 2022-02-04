import { AddressListType } from "../types/types";


export const address_list: AddressListType[] = [
	{
		name: "fake_mm",
		zmq_port: 5554,
		ui_port: 5003,
		is_fake: true,
		specific_params: {
			type: "MM",
			neuro: {

				ipcl: "172.16.201.137",
				ipcr: "172.16.201.142",
				port: 8090
			}
		},
	},
	{
		name: "fake Подъемник",
		zmq_port: 5556,
		ui_port: 5006,
		is_fake: true,
		specific_params: {
			type: "MP",
			length: 11,
			reading_port: { zmq: 5800, ui: 5810 },
			seting_port: { zmq: 5801, ui: 5811 },
		},
	},
	{
		name: "fake_md",
		zmq_port: 5555,
		ui_port: 5004,
		is_fake: true,
		specific_params: {
			type: "MD",
			hydro: 10,
			reading_port: { zmq: 5700, ui: 5710 },
			seting_port: { zmq: 5701, ui: 5711 },
		},
	},

	{
		name: "master machine",
		zmq_port: 5558,
		ui_port: 5008,
		is_fake: false,
		ip: "not used",
		specific_params: {
			type: "MASTER",
			md_port: 5004,
			mm_port: 5003,
			mp_port: 5006,
		},
	},

];
