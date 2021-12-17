


export const address_list = [
	// {
	//   zmq_port: 5552,
	//   ui_port: 5001,
	//   is_fake: false,
	//   ip: "192.168.250.1",
	//   type: "MM",
	// },
	// {
	//   zmq_port: 5552,
	//   ui_port: 5001,
	//   is_fake: false,
	//   ip: "172.16.201.89",
	//   type: "MM",
	// },
	// {
	//   name: "Монтажник",
	//   zmq_port: 5553,
	//   ui_port: 5002,
	//   is_fake: false,
	//   ip: "172.16.201.79",
	//   type: "MM",
	//   photo: "photo address"
	// },
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

];
