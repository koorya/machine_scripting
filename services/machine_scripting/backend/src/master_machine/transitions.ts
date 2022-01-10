import { GraphOfStates, } from "../fsm_types"

// надо комментарии вынести на рисунок

export const graph: GraphOfStates = {
	transitions: [
		{ name: "liftUpOneLevel", from: "init", to: "lifting_one_level", comment: "" },
		{ name: "step", from: "lifting_one_level", to: "ready_to_column_mounting", comment: "" },
		{ name: "startMountCycle", from: "ready_to_column_mounting", to: "cassette_charging_by_operator", comment: "" },
		{ name: "cassetteCharged", from: "cassette_charging_by_operator", to: "docking_cassette_by_mt", comment: "" }, // когда кассета загружена (параметр тип колонны)
		{ name: "cassetteDocked", from: "docking_cassette_by_mt", to: "lifting_cassette_column", comment: "" }, // кнопка ТПК с колонной готова к подъёму
		{ name: "step", from: "lifting_cassette_column", to: "column_in_cassette_on_level", comment: "" }, // 
		{ name: "holdColumn", from: "column_in_cassette_on_level", to: "column_holded", comment: "" }, // 
		{ name: "mountColumnInPlace", from: "column_holded", to: "column_mounting", comment: "" }, // параметр адресс колонны, МП монтирует колонну и МП паркуется одновременно
		{ name: "step", from: "column_mounting", to: "some_column_mounted", comment: "" }, // параметр адресс колонны, МП монтирует колонну и МП паркуется одновременно
		{ name: "startMountCycle", from: "some_column_mounted", to: "cassette_charging_by_operator", comment: "" },

		{ name: "prepareToHorizontal", from: "some_column_mounted", to: "horizontal_prepareing1", comment: "" }, //проверяет, что все колонны установлены
		{ name: "step", from: "horizontal_prepareing1", to: "horizontal_prepareing2", comment: "" }, // перевод МП в состояние виса 
		{ name: "step", from: "horizontal_prepareing2", to: "horizontal_prepareing3", comment: "" }, // МД в новое состояние 
		{ name: "step", from: "horizontal_prepareing3", to: "ready_to_horizontal_movement", comment: "" }, // МП в парковку 
		{ name: "moveHorizontal", from: "ready_to_horizontal_movement", to: "horizontal_movement_cycle", comment: "" }, // 
		{ name: "moveHorizontal", from: "horizontal_movement_cycle", to: "horizontal_movement_cycle", comment: "" }, // 
		{ name: "preapareToLinksMounting", from: "horizontal_movement_cycle", to: "ready_to_links_mounting", comment: "" }, // 


		{ name: "startMountLinksCycle", from: "ready_to_links_mounting", to: "links_charging_cassette_by_operator", comment: "" }, // 
		{ name: "cassetteChargingCompete", from: "links_charging_cassette_by_operator", to: "links_docking_by_mt", comment: "" }, //
		{ name: "cassetteDocked", from: "links_docking_by_mt", to: "lifting_cassette_links", comment: "" }, // кнопка ТПК с колонной готова к подъёму
		{ name: "step", from: "lifting_cassette_links", to: "links_in_cassette_on_level", comment: "" }, // 
		{ name: "mountLinkByAddress", from: "links_in_cassette_on_level", to: "links_in_cassette_on_level", comment: "" }, // параметры - адресс связи в кассете и на этаже
		{ name: "cassteReleaseDown", from: "links_in_cassette_on_level", to: "pm_parking", comment: "" }, // 
		{ name: "step", from: "pm_parking", to: "some_links_mounted", comment: "" }, // 
		{ name: "startMountLinksCycle", from: "some_links_mounted", to: "links_charging_cassette_by_operator", comment: "" }, // 

		{ name: "parkMD", from: "some_links_mounted", to: "md_parking", comment: "" }, // 
		{ name: "step", from: "md_parking", to: "init", comment: "" }, // 
	],

	states: [
		{ name: "init", comment: "Исходное состояние" },


	]
}
//
