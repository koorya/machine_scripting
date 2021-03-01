using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using json_converter;
using Newtonsoft.Json;

namespace PlcConnector_module
{
	// Объект, который создает и хранит список переменных манипулятора
	// по файлу описания. В настоящий момент реализовано использование 
	// переменных только одного манипулятора. Исходя из этого переменные 
	// имеют в качестве характеристики только собственное название,
	// идентификации по разным контроллерам нет.
	public class PlcConnector
	{
		public static PlcVar[] plc_vars = new PlcVar[0];
		static PlcConnector()
		{

		}
		public static PlcVarsArray getPlcVars()
		{
			readPlcVariablesFromPLC();
			PlcVarsArray wrapper = new PlcVarsArray();
			wrapper.arr = plc_vars;
			return wrapper;

		}

		static List<ExtCompolet> plc_conn; // список объектов для связи с плк через CIP
		static public async void connect(System.ComponentModel.IContainer cont)
		{
			plc_conn = new List<ExtCompolet>();

			string fs = File.ReadAllText("./MainApp/user.json");

			List<ExtComp_serial> _deser = JsonConvert.DeserializeObject<List<ExtComp_serial>>(fs); // десериализация промежуточных объектов, 

			// по каждому из прочитанных промежуточных объектов создаем нормальный объект для связи с плк
			foreach (ExtComp_serial deser in _deser)
			{
				ExtCompolet plc = new ExtCompolet(cont, deser);
				// добавляем этот объект в список объектов для связи с плк
				plc_conn.Add(plc);
			}

			foreach (var plc_con__ in plc_conn)
			{
				plc_con__.Active = true;
				int wait_time = 0;
				while (!plc_con__.IsConnected && wait_time < 30)
				{ //три секунды ожидаем
					wait_time++;
					await Task.Delay(100);
				}

				if (plc_con__.IsConnected)
					Array.Resize(ref plc_vars, plc_vars.Length + plc_con__.plc_var_list.Count);
				else
					plc_con__.Active = false;
			}

			readPlcVariablesFromPLC();

		}
		public static void readPlcVariablesFromPLC()
		{

			int i = 0;
			foreach (var plc in plc_conn)
			{
				if (plc.IsConnected)
				{

					foreach (var variable in plc.plc_var_list)
					{
						Console.WriteLine("variable for read: {0}", variable.Key);
						variable.Value.readFromPlc();
						Console.WriteLine(variable.Value.Plc_value);

						plc_vars[i] = new PlcVar();
						plc_vars[i].id = i;
						plc_vars[i].name = variable.Value.name;
						plc_vars[i].value = variable.Value.Plc_value;
						plc_vars[i].type = getMyType(variable.Value.Plc_value?.GetType());
						plc_vars[i].valueref = variable.Value;
						i++;

					}
				}
			}
		}
		public static void updatePlcVariablesByArray(PlcVar[] var_arr)
		{
			foreach (var upd_var in var_arr)
			{
				plcvariable plc_var_ref = plc_vars[upd_var.id].valueref as plcvariable;
				plc_var_ref.Plc_value = upd_var.value;
			}
		}

		static public string getMyType(Type type)
		{
			Console.WriteLine(type);
			if (object.Equals(typeof(System.Boolean), type))
				return "bool";
			if (object.Equals(typeof(System.Int32), type))
				return "int";
			if (object.Equals(typeof(System.Double), type))
				return "float";

			return "int";
		}

	}
}
