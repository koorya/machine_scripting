import * as fs from "fs";
import { getCompiledScenarioError, compileScenario } from "./scenario";
import * as MyTypes from "~shared/types/types";
import { iController, iPLCStateMachine } from "./fsm_types";
import { createEndPointGet, createEndPointPost } from "./endpoints_utils";
import { ScenarioDefenition } from "~shared/types/types";
import { ImageRender } from "./image_render";



export function generateEndPoints(render: ImageRender, plc_controller: iController, scenarios: ScenarioDefenition[], algorithms_path: string) {

	const end_points_get = [
		createEndPointGet("commands", async () => {
			return plc_controller.slave_fsm.js_fsm.transitions();
		}
		),
		createEndPointGet("controller_status", async () => {
			return plc_controller.getControllerStatus();
		}),
		createEndPointGet("image", async () => {
			return render.rendered_image;
		}),
		createEndPointGet("get_all_states", async () => plc_controller.slave_fsm.js_fsm.allStates()
		),
		createEndPointGet("scenarios", async () => {
			return scenarios;
		}),
		createEndPointGet("machine_type", async () => {
			return plc_controller.slave_fsm.type;
		}),
		createEndPointGet("scenario_status", async () => {
			return {
				step_index: plc_controller.scenario?.index,
				name: plc_controller.scenario?.name,
			};
		}),
	];

	const end_points_post = [
		createEndPointPost("exec_graph_command", async (req) => {
			console.log(req);
			console.log(
				`cnt_state: ${plc_controller.state}; trs: ${plc_controller.transitions()}`
			);

			try {
				if (plc_controller.can("execCommand") &&
					plc_controller.execCommand(req.command))
					return { result: "valid cmd" };
				else
					return { result: "invalid cmd" };
			} catch {
				throw new Error("exec_graph_command | error durind command executing");
			}
		}),

		createEndPointPost("exec_scenario", async (req) => {
			try {
				if (plc_controller.can("execScenario") &&
					plc_controller.execScenario(req))
					return { result: "valid cmd" };
				else
					return { result: "invalid cmd" };
			} catch {
				throw new Error("exec_scenario | error durind command executing");
			}
		}),
		createEndPointPost("exec_controller_command", async (req) => {
			try {
				if (plc_controller.can(req.command)) {
					plc_controller[req.command]();
					return { result: "exec simple command" };
				} else
					return { result: "invalid req" };
			} catch {
				throw new Error("exec_controller_command | error durind command executing");
			}
		}),
		createEndPointPost("compile_scenario", async (req) => {
			console.log(req);
			try {
				const compiled = compileScenario(req.script);
				console.log(compiled);
				return { compiled: compiled, status: "ok" };
			} catch (error) {
				console.log(JSON.stringify(error, null, 2));
				return { compiled: [], status: "fail" };
			}
		}),
		createEndPointPost("is_scenario_valid", async (req) => {
			console.log(req);
			try {
				const err = await getCompiledScenarioError(
					req.compiled_scenario,
					plc_controller.slave_fsm,
					req.starting_condition
				);
				console.log(err);
				if (err != null)
					return { status: "notok", details: err };
				else
					return { status: "ok", details: null };
			} catch {
				console.log("is_scenario_valid: getCompiledScenarioError error");
			}
		}),
		createEndPointPost("save_scenario", async (req) => {
			const scenario = req;
			console.log(scenario);

			const compiled = compileScenario(scenario.script);
			try {
				const err = await getCompiledScenarioError(
					compiled,
					plc_controller.slave_fsm,
					scenario.starting_condition
				);
				console.log(err);
				if (err != null)
					return { status: "fail", scenarios: scenarios };
				else {
					const found = scenarios.find((el, index) => {
						if (el.name === scenario.name) {
							scenarios[index] = scenario;
							return true;
						}
					});
					if (found == undefined)
						scenarios.push(scenario);
					fs.writeFile(
						algorithms_path,
						JSON.stringify(scenarios, null, 2),
						() => {
							console.log("File uptaded");
						}
					);

					return { status: "ok", scenarios: scenarios };
				}
			} catch {
				console.log("fail while save new scenario");
			}
		}),
	];
	return { end_points_get: end_points_get, end_points_post: end_points_post }
}
