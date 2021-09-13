using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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
		static public async Task connect(System.ComponentModel.IContainer cont)
		{
			plc_conn = new List<ExtCompolet>();

			string fs = File.ReadAllText("./user.json");

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
				while (wait_time < 30)
				{ //три секунды ожидаем
					wait_time++;
					await Task.Delay(100);
					Console.WriteLine("wait {0}", wait_time);
					if (plc_con__.IsConnected)
						wait_time = 30;
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
					var var_names = plc.plc_var_list.Keys.ToArray();
					Hashtable var_hash;
					try
					{
						var_hash = plc.ReadVariableMultiple(var_names);
					}
					catch (Exception e)
					{
						Console.WriteLine(e.Data);
						continue;
					}
					foreach (var variable in plc.plc_var_list)
					{
						// Console.WriteLine("variable for read: {0}", variable.Key);
						// variable.Value.readFromPlc();
						// Console.WriteLine(variable.Value.Plc_value);

						plc_vars[i] = new PlcVar();
						plc_vars[i].id = i;
						plc_vars[i].name = variable.Value.name;
						plc_vars[i].value = var_hash[variable.Value.name];
						plc_vars[i].type = getMyType(var_hash[variable.Value.name]?.GetType());
						plc_vars[i].valueref = variable.Value;
						i++;

					}
				}
			}
		}

		public static void updateSinglePlcVariable(PlcVar upd_var)
		{
			foreach (var plc in plc_conn)
			{
				if (plc.IsConnected) plc.WriteVar(upd_var.name, upd_var.value);
			}
		}


		public static Hashtable[] readFromPlcsByArrayOfNames(string[] arr)
		{
			Console.WriteLine(JsonConvert.SerializeObject(arr));
			Hashtable[] var_hash = new Hashtable[0];
			foreach (var plc in plc_conn)
			{
				if (plc.IsConnected)
				{
					try
					{
						Hashtable currentplc_table = plc.ReadVariableMultiple(arr);
						var_hash.Append(currentplc_table);
						Console.WriteLine("reading success");
						foreach (var v in arr)
						{
							var value = currentplc_table[v];
							Console.WriteLine(v + ": " + JsonConvert.SerializeObject(value));
						}
					}
					catch (Exception e)
					{
						Console.WriteLine(e.Data);
						Console.WriteLine("May be, invalid variable list to read");
						continue;
					}
				}
			}
			return var_hash;
		}
		public static void readFromPlcByArray(PlcVar[] var_arr)
		{
			string[] var_names = var_arr.Select(v => v.name).ToArray();
			Hashtable[] hashtables = readFromPlcsByArrayOfNames(var_names);
			if (hashtables.Length > 1)
			{
				Console.WriteLine("multiple plcs contain that variable");
			}
			if (hashtables.Length > 0)
			{
				var var_hash = hashtables[0];
				foreach (var v in var_arr)
				{
					v.value = var_hash[v.name];
					v.type = getMyType(var_hash[v.name]?.GetType());
				}
			}
		}

		static public string getMyType(Type type)
		{
			// Console.WriteLine(type);
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
