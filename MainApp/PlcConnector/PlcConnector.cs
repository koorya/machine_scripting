using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using json_converter;
using Newtonsoft.Json;

namespace PlcConnector_module
{

	public class PlcConnector
	{
		public static PlcVar[] plc_vars;
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
		static public void connect(System.ComponentModel.IContainer cont)
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

			var plc_con1 = plc_conn[0];

			plc_con1.Active = true;
			while (!plc_con1.IsConnected) ;

			plc_vars = new PlcVar[plc_con1.plc_var_list.Count];

			readPlcVariablesFromPLC();

		}
		public static void readPlcVariablesFromPLC()
		{
			int i = 0;
			foreach (var variable in plc_conn[0].plc_var_list)
			{
				variable.Value.readFromPlc();
				Console.WriteLine(variable.Value.Plc_value);

				plc_vars[i] = new PlcVar();
				plc_vars[i].id = i;
				plc_vars[i].name = variable.Value.name;
				plc_vars[i].value = variable.Value.Plc_value;
				plc_vars[i].type = getMyType(variable.Value.Plc_value.GetType());
				plc_vars[i].valueref = variable.Value;
				i++;

			}
		}
		public static void updatePlcVariablesByArray(PlcVar[] var_arr)
		{
			foreach(var upd_var in var_arr)
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
