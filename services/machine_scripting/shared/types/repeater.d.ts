export type RepeaterRequestMatching =
	| {
		type: "read_vars_by_array";
		request: {
			var_names: string[];
		};
		response: { vars: { [key: string]: any; }; };
		method: "POST";
	}
	| {
		type: "set_vars_by_array";
		request: { vars: { [key: string]: any; }; };
		response: { vars: { [key: string]: any; }; };
		method: "POST";
	}
	;
