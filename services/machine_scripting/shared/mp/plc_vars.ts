
export const init_vars = {
	FC1_Error: false, // - ошибка на ПЧ1 (грузоподъемный механизм)
	// FC2_Error: false, // - ошибка на ПЧ2 (механизм перемещения)
	Global_Emergency_Lock: false, // - программный аварийный стоп

	EmAlrm: false, // - аварийная кнопка (грибок) на шкафу МП
	// Если не активны Global_Emergency_Lock и EmAlrm - активируется Relay_K1_LowPL.
	// Если же становится активным хоть один из сигналов EmAlrm или Global_Emergency_Lock - деактивируются FC1_M1_State, FC1_M2_State, сбрасываются на 0 состояние FC1_State, FC2_State, активируются Lock_Brake_M1_State, Lock_Brake_M2_State.
	// Если стал активным EmAlrm то делается активным и Global_Emergency_Lock.
	Relay_K1_LowPL: false, // - реле(К1) на контактор (КМ1), включает раздачу питания на ПЧ1 и ПЧ2, электрические тормоза и прочие неприоритетные потребители).
	// ---
	FC1_State: 1, // - переменная состояния (автомат для ПЧ1, грузоподъемный механизм).
	FC1_Cmd: 0, // - команда для ПЧ1 (0-Стоп, 1-Вниз, 2-Вверх).
	FC1_Frequency: 0, // - задатчик частоты (Гц * 100).
	FC1_M1_State: false, // - сигнал для включения реле (К2) контактора (КМ2) электропитания ПЧ1.
	Relay_FC1_M1: false, // - реле (К2) для ПЧ1.
	Lock_Brake_M1_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ1.
	Relay_BRK_M1: false, // - сигнал для выключения аппаратного электротормоза двигателя М1.
	// ---
	// FC2_State: 0, // - переменная состояния (автомат для ПЧ2, механизм перемещения).
	// FC2_Forward: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение туда.
	// FC2_Reverse: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение оттуда.
	// FC2_Frequency: 0, // - задатчик частоты (Гц * 100).
	// FC2_M2_State: false, // - сигнал для включения реле электропитания ПЧ2.
	// Lock_Brake_M2_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ2.
	// Relay_BRK_M2: false, // - сигнал для выключения аппаратного электротормоза двигателя М2.
	// ---
	// Переменные (больше информативные):
	Led_Red: false, // - есть какая-то авария.
	// Welding_at_Drums: 0, // - слово (16бит) в котором битово обозначены состояния для оптических дискретных датчиков, т.е намотка троса по уровням для каждого из 2 барабанов (4+4 / 4+4).

	SVU_MD_ViewWork: false, // Состояние удержания кассеты с подтягиванием каната. Кассета должна быть внизу, чтобы было допустимо устанавливать эту переменную
	SVU_Ready: false, // Это команда для отклюючения пульта подъемника. На нее  опирается плк подъемника

	Forced_Frame_Height: 0, // Высота низа силовой рамы относительно пола в метрах
	Height_To_Bottom: 0, // Расстояние от пола до низа ТПК
	TPK_Home: false, //Флаг прижатия кассеты к раме 


};

