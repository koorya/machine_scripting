type error_answ = {
	error: string;
}
export type NeuroServiceMatching =
	| {
		type: "segment";
		request: {
			ipcl: string;
			ipcr: string;
			last_req?: string;
		};
		response: {
			RESULT: {
				predict_image_L: string;
				predict_image_R: string;
				predict_L: "NG" | "OK";
				predict_R: "NG" | "OK";
				text_L: string;
				text_R: string;
			};
			TIMING: { request: string; predict: string; response: string; total: string; };
			PATH: { image_L: string; image_R: string };
		};
		method: "GET";
	}
	| {
		type: "class";
		request: {
			ipcl: string;
			ipcr: string;
			last_req?: string;
		};
		response: {
			RESULT: { predict: string[]; labels: ("NG" | "OK")[] };
			TIMING: { request: string; predict: string; response: string; total: string; };
			PATH: { image_L: string; image_R: string };
		};
		method: "GET";
	}
	;


// Запустить СЕГМЕНТИРУЮЩУЮ сеть можно перейдя по этой ссылки: http://localhost:8090/segment?ipcl=172.16.201.137&ipcr=172.16.201.142
// Запустить КЛАССИФИЦИРУЮЩУЮ сеть можно перейдя по этой ссылки: http://localhost:8090/class?ipcl=172.16.201.137&ipcr=172.16.201.142