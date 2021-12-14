import { doFakePlcLogic, md_vault, SocketServer } from "./fake_plc";
import MMLogic from "./fake-mm";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).array("zmq_port").argv;
console.log(argv);
const zmq_port: number[] = argv["zmq_port"] ? argv["zmq_port"] : [5552];
console.log(`zmq_port: ${zmq_port}`);

appendMPVarsToMDVAULT();

const fake_mm = new MMLogic();
fake_mm.run();

const srv_inst = zmq_port.map((zmq_port) => new SocketServer(zmq_port, (mess) => {
  const rec_obj = JSON.parse(mess);
  if (!rec_obj.PlcVarsArray.update) {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      element["value"] = undefined;
      const md_var = md_vault.find((value) => value.name == element.name);
      if (md_var != undefined) element["value"] = md_var.value;
      else {
        element.value = fake_mm.getPLCVarByName(element.name);
      }
    });
  } else {
    rec_obj.PlcVarsArray.arr.forEach((element) => {
      console.log(`element ${JSON.stringify(element, null, 2)}`)
      const md_var = md_vault.find((value) => value.name == element.name);
      if (md_var != undefined) {
        md_var.value = element["value"];
      } else if (fake_mm.getPLCVarByName(element.name) != undefined) {
        fake_mm.setPLCVarByName(element.name, element.value);
      } else md_vault.push({ name: element.name, value: element["value"] });
    });
    // console.log(md_vault);
    doFakePlcLogic();
  }
  return JSON.stringify(rec_obj);
}));

function appendMPVarsToMDVAULT() {
  const init_vars = {
    FC1_Error: true, // - ошибка на ПЧ1 (грузоподъемный механизм)
    FC2_Error: false, // - ошибка на ПЧ2 (механизм перемещения)
    Global_Emergency_Lock: false, // - программный аварийный стоп

    EmAlrm: false, // - аварийная кнопка (грибок) на шкафу МП
    // Если не активны Global_Emergency_Lock и EmAlrm - активируется Relay_K1_LowPL.
    // Если же становится активным хоть один из сигналов EmAlrm или Global_Emergency_Lock - деактивируются FC1_M1_State, FC1_M2_State, сбрасываются на 0 состояние FC1_State, FC2_State, активируются Lock_Brake_M1_State, Lock_Brake_M2_State.
    // Если стал активным EmAlrm то делается активным и Global_Emergency_Lock.
    Relay_K1_LowPL: false, // - реле(К1) на контактор (КМ1), включает раздачу питания на ПЧ1 и ПЧ2, электрические тормоза и прочие неприоритетные потребители).
    // ---
    FC1_State: 0, // - переменная состояния (автомат для ПЧ1, грузоподъемный механизм).
    FC1_Cmd: 0, // - команда для ПЧ1 (0-Стоп, 1-Вниз, 2-Вверх).
    FC1_Frequency: 0, // - задатчик частоты (Гц * 100).
    FC1_M1_State: false, // - сигнал для включения реле (К2) контактора (КМ2) электропитания ПЧ1.
    Relay_FC1_M1: false, // - реле (К2) для ПЧ1.
    Lock_Brake_M1_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ1.
    Relay_BRK_M1: false, // - сигнал для выключения аппаратного электротормоза двигателя М1.
    // ---
    FC2_State: 0, // - переменная состояния (автомат для ПЧ2, механизм перемещения).
    FC2_Forward: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение туда.
    FC2_Reverse: false, // - команда (дискретный выходной сигнал с ПЛК и через аппаратный концевой переключатель идет на ПЧ2) на движение оттуда.
    FC2_Frequency: 0, // - задатчик частоты (Гц * 100).
    FC2_M2_State: false, // - сигнал для включения реле электропитания ПЧ2.
    Lock_Brake_M2_State: false, // - программный сигнал для блокировки тормоза двигателя М1 для ПЧ2.
    Relay_BRK_M2: false, // - сигнал для выключения аппаратного электротормоза двигателя М2.
    // ---
    // Переменные (больше информативные):
    Led_Red: false, // - есть какая-то авария.
    Welding_at_Drums: 0, // - слово (16бит) в котором битово обозначены состояния для оптических дискретных датчиков, т.е намотка троса по уровням для каждого из 2 барабанов (4+4 / 4+4).
  };

  Object.entries(init_vars).map(([key, value]) => { md_vault.push({ name: key, value: value }) });
}
