import fetch from "node-fetch";
import { NeuroServiceMatching } from "../types/neuroservice";
import { IRequest, IResponse, ReqTypes_get, ReqTypes_post } from "../types/types";

export async function checkCam() {


	const neuro_segment: IResponse<"segment", NeuroServiceMatching> = await (await fetch("http://localhost:8090/segment?ipcl=172.16.201.137&ipcr=172.16.201.142")).json();
	const neuro_class: IResponse<"class", NeuroServiceMatching> = await (await fetch("http://localhost:8090/class?ipcl=172.16.201.137&ipcr=172.16.201.142")).json();

	console.log(neuro_segment);
	console.log(neuro_class);
	return neuro_segment.RESULT.predict_L == "OK" && neuro_segment.RESULT.predict_R == "OK"
}
// checkCam().then((res) => console.log(`checkCam: ${res}`));