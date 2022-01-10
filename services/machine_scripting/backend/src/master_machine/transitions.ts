import { GraphOfStates, } from "../fsm_types"

// надо комментарии вынести на рисунок

export const graph: GraphOfStates = {
	transitions: [
		{ name: "liftUpOneLevel", from: "init", to: "lifting_one_level", comment: "Подъем на этаж" },
		{ name: "step", from: "lifting_one_level", to: "ready_to_column_mounting", comment: "" },
		{ name: "startMountCycle", from: "ready_to_column_mounting", to: "cassette_charging_by_operator", comment: "Начать установку колонны" },
		{ name: "cassetteCharged", from: "cassette_charging_by_operator", to: "docking_cassette_by_mt", comment: "Кассета заполнена" }, // когда кассета загружена (параметр тип колонны)
		{ name: "cassetteDocked", from: "docking_cassette_by_mt", to: "lifting_cassette_column", comment: "Траверса передвинута, Кассета готова к подъему" }, // кнопка ТПК с колонной готова к подъёму
		{ name: "step", from: "lifting_cassette_column", to: "column_in_cassette_on_level", comment: "" }, // 
		{ name: "holdColumn", from: "column_in_cassette_on_level", to: "column_holded", comment: "Извлечь колонну" }, // 
		{ name: "mountColumnInPlace", from: "column_holded", to: "column_mounting", comment: "Установить колонну на этаже" }, // параметр адресс колонны, МП монтирует колонну и МП паркуется одновременно
		{ name: "step", from: "column_mounting", to: "some_column_mounted", comment: "" }, // параметр адресс колонны, МП монтирует колонну и МП паркуется одновременно
		{ name: "startMountCycle", from: "some_column_mounted", to: "cassette_charging_by_operator", comment: "Начать установку колонны" },

		{ name: "prepareToHorizontal", from: "some_column_mounted", to: "horizontal_prepareing1", comment: "Частично нагрузить колонны" }, //проверяет, что все колонны установлены
		{ name: "step", from: "horizontal_prepareing1", to: "horizontal_prepareing2", comment: "" }, // перевод МП в состояние виса 
		{ name: "step", from: "horizontal_prepareing2", to: "horizontal_prepareing3", comment: "" }, // МД в новое состояние 
		{ name: "step", from: "horizontal_prepareing3", to: "ready_to_horizontal_movement", comment: "" }, // МП в парковку 
		{ name: "moveHorizontal", from: "ready_to_horizontal_movement", to: "horizontal_movement_cycle", comment: "Спозицонировать по горизонтали" }, // 
		{ name: "moveHorizontal", from: "horizontal_movement_cycle", to: "horizontal_movement_cycle", comment: "Повторно спозиционировать по горизонтали" }, // 
		{ name: "preapareToLinksMounting", from: "horizontal_movement_cycle", to: "ready_to_links_mounting", comment: "Подтверждение позиционирования по горизонтали" }, // 


		{ name: "startMountLinksCycle", from: "ready_to_links_mounting", to: "links_charging_cassette_by_operator", comment: "Начать установку связей" }, // 
		{ name: "cassetteChargingCompete", from: "links_charging_cassette_by_operator", to: "links_docking_by_mt", comment: "Кассета заполнена свзями верно" }, //
		{ name: "cassetteDocked", from: "links_docking_by_mt", to: "lifting_cassette_links", comment: "Траверса передвинута, Кассета готова к подъему" }, // кнопка ТПК с колонной готова к подъёму
		{ name: "step", from: "lifting_cassette_links", to: "links_in_cassette_on_level", comment: "" }, // 
		{ name: "mountLinkByAddress", from: "links_in_cassette_on_level", to: "links_in_cassette_on_level", comment: "Установить связь на место" }, // параметры - адресс связи в кассете и на этаже
		{ name: "cassteReleaseDown", from: "links_in_cassette_on_level", to: "mp_parking", comment: "Спустить кассету вниз" }, // 
		{ name: "step", from: "mp_parking", to: "some_links_mounted", comment: "" }, // 
		{ name: "startMountLinksCycle", from: "some_links_mounted", to: "links_charging_cassette_by_operator", comment: "Начать установку связей" }, // 

		{ name: "parkMD", from: "some_links_mounted", to: "md_parking", comment: "Перевести МД в парковку" }, // 
		{ name: "step", from: "md_parking", to: "init", comment: "" }, // 
	],

	states: [
		{ name: "init", comment: "Исходное состояние" },
		{ name: "lifting_one_level", comment: "МП: вис<BR/>МД: Подъем на новый этаж" },
		{ name: "ready_to_column_mounting", comment: "Готовность к установке колонн" },
		{ name: "cassette_charging_by_operator", comment: "Оператор устанавливает<BR/> колонну в кассету" },
		{ name: "docking_cassette_by_mt", comment: "Транспортер перемещает траверсу<BR/> подъемника на кассету с колонной" },
		{ name: "lifting_cassette_column", comment: "Подъем кассеты наверх" },
		{ name: "column_in_cassette_on_level", comment: "Кассета с колонной поднята на этаж" },
		{ name: "column_holded", comment: "Колонна захвачена монтажником" },
		{ name: "column_mounting", comment: "Монтирование колонны монтажником<BR/>Пустая кассета едет вниз" },
		{ name: "some_column_mounted", comment: "Этаж частично или полностью<BR/> наполнен колоннами" },
		{ name: "horizontal_prepareing1", comment: "Подъемник переходит в состояние виса" },
		{ name: "horizontal_prepareing2", comment: "Домкрат переходит в новое состояние<BR/>частичной загрузки колонн" },
		{ name: "horizontal_prepareing3", comment: "Парковка подъемника" },
		{ name: "ready_to_horizontal_movement", comment: "Готов к горизонтальным смещениям рамы" },
		{ name: "horizontal_movement_cycle", comment: "Позиционирование рамы в<BR/>горизонтальной плоскости" },
		{ name: "ready_to_links_mounting", comment: "Можно устанавливать связи" },
		{ name: "links_charging_cassette_by_operator", comment: "Наполнение кассеты связями<BR/>под контролем оператора" },
		{ name: "links_docking_by_mt", comment: "Транспортер перемещает траверсу<BR/> подъемника на кассету со связями" },
		{ name: "lifting_cassette_links", comment: "Подъем кассеты со связями на этаж" },
		{ name: "links_in_cassette_on_level", comment: "Кассета со связями поднята на этаж" },
		{ name: "mp_parking", comment: "парковка подъемника" },
		{ name: "some_links_mounted", comment: "Этаж частично или полностью<BR/>заполнен связями" },
		{ name: "md_parking", comment: "парковка домкрата" },


	]
}
//
