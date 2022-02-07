import { GraphOfStates, } from "../fsm_types"

export const root_graph = {
  transitions: [
    { "name": "setAddres", "from": "standby", "to": "ready_to_mount" },
    { "name": "setAddres", "from": "ready_to_mount", "to": "ready_to_mount" },
    { "name": "p200Start", "from": "ready_to_mount", "to": "p200" },
    { "name": "p300Start", "from": "p200", "to": "p300" },
    { "name": "p500Start", "from": "p300", "to": "p500" },
    { "name": "p600Start", "from": "p500", "to": "p600_near" },
    { "name": "step", "from": "p600_near", "to": "p600_far" },
    { "name": "step", "from": "p600_far", "to": "p600_finish" },
    { "name": "p700Start", "from": "p600_finish", "to": "p700" },
    { "name": "p800Start", "from": "p700", "to": "p800" },
    { "name": "step", "from": "p800", "to": "standby" },

    { name: "setColumnArdess", from: "standby", to: "ready_to_column" },
    { name: "setColumnArdess", from: "ready_to_column", to: "ready_to_column" },
    { name: "next", from: "ready_to_column", to: "p20" },
    { name: "next", from: "p20", to: "p25" },
    { name: "next", from: "p25", to: "p30" },
    { name: "next", from: "p30", to: "p40" },
    { name: "next", from: "p40", to: "p50" },
    { name: "next", from: "p50", to: "p55" },
    { name: "step", from: "p55", to: "standby" },
  ],
  states: [
    { name: "standby", comment: "Ожидание команды" },
    { name: "ready_to_mount", comment: "Цикл установик связи<br />Задан адресс связи" },
    { name: "p200", comment: "Захват связи из кассеты" },
    { name: "p300", comment: "Перемещение ММ в ПТМ" },
    { name: "p500", comment: "Поиск монтажной позиции связи" },
    { name: "p600_near", comment: "Прессование 1 заклепки<br />проверка камерой" },
    { name: "p600_far", comment: "Прессование 2 заклепки<br />проверка камерой" },
    { name: "p600_finish", comment: "Связь заклепана" },
    { name: "p700", comment: "Возврат узлов манипулятора в ТП" },
    { name: "p800", comment: "Перемещение ММ В ПТМ" },


    { name: "ready_to_column", comment: "Цикл установик колонны<br />Задан адресс колонны" },
    { name: "p20", comment: "Изъятие колонны из кассеты" },
    { name: "p25", comment: "Транспортировка колонны к месту установки" },
    { name: "p30", comment: "Поиск монтажной позиции колонны" },
    { name: "p40", comment: "Монтаж колонны" },
    { name: "p50", comment: "Возврат ММ в ТП" },
    { name: "p55", comment: "Возврат ММ к кассете" },

  ],
  init: "standby",
} as const;

export const graph: GraphOfStates = (root_graph as unknown) as GraphOfStates;

export type States = typeof root_graph.transitions[number]["from"];
export type Transitions = typeof root_graph.transitions[number]["name"];

