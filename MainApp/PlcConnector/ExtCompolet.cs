using System;
using OMRON.Compolet.CIPCompolet64;
using System.Collections.Generic;


namespace PlcConnector_module
{
	// ExtCompolet - Extended Compolet (Расширеный клас омроовского комполета)
	// Класс объектов для связи с контроллером через CIP
	// вся работа с сетью реализована внутри родительского класса от омрона
	// Тут добавлены методы для удобого чтения-записи переменных, а
	// кроме - методы для строкового представления структур и массивов - ои были взяты из примера и могут еще пригодиться
	// Класс является составным (partial), в другом файле описаны методы для упаковки нужных полей в другой объект 
	// для последующей сериализации в файл и методы для обратного действия.
	// Этот класс содержит список переменных плк, который заполняется руками (либо при десериализации)
	// Этот объект обеспечивет интерфейс IPLCConnect, в котором заданы возможности чтения и записи переменных
	public partial class ExtCompolet : OMRON.Compolet.CIPCompolet64.CommonCompolet, IPLCConnect
	{
		// название плк (емеля, etc)
		public string plc_name;
		// список переменных в плк
		public Dictionary<string, plcvariable> plc_var_list;
		public List<string> cam_ip_list;
		// Конструктор, который используется при создании в процессе работы программы, не по сохраненному в файле
		public ExtCompolet(System.ComponentModel.IContainer cont) : base(cont)
		{
			plc_var_list = new Dictionary<string, plcvariable>();
		}
		// Конструкотр, который принимает объект с упакованными в него полями (ip адрес, имя, список переменных и т.д.)
		public ExtCompolet(System.ComponentModel.IContainer cont, ExtComp_serial deser) : base(cont)
		{
			this.deserialize(deser);
		}
		// Запись переменной в плк и последующее чтение ее же из плк, возвращая значение через значение функции
		public object WriteVar(string name, object value)
		{
			try
			{
				// write
				object val = value.ToString();
				if (this.GetVariableInfo(name).Type == VariableType.STRUCT)
				{
					val = this.ObjectToByteArray(val);
				}
				this.WriteVariable(name, val);

				// read
				return this.readFromPlc(name);
			}
			catch (Exception ex)
			{
				Console.WriteLine("WriteVar exeption, {0}", ex.Message);
				return null;
			}
		}
		// Чтение переменной из плк
		public object readFromPlc(string varname)
		{
			try
			{
				object obj = this.ReadVariable(varname);
				if (obj == null)
				{
					throw new NotSupportedException();
				}

				VariableInfo info = this.GetVariableInfo(varname);

				return obj;
			}
			catch (Exception ex)
			{
				System.Console.WriteLine("exept");
				Console.WriteLine("WriteVar exeption, {0}", ex.Message);
				return null;
			}
		}

		// Следующие 4 функции исппользуются когда нужно прочитать или записать массив или структуру данных.
		// Они взяты из примера
		public byte[] ObjectToByteArray(object obj)
		{
			if (obj is Array)
			{
				Array arr = obj as Array;
				Byte[] bin = new Byte[arr.Length];
				for (int i = 0; i < bin.Length; i++)
				{
					bin[i] = Convert.ToByte(arr.GetValue(i));
				}
				return bin;
			}
			else
			{
				return new Byte[1] { Convert.ToByte(obj) };
			}
		}

		public static string GetValueOfVariables(object val)
		{
			string valStr = string.Empty;
			if (val.GetType().IsArray)
			{
				Array valArray = val as Array;
				if (valArray.Rank == 1)
				{
					valStr += "[";
					foreach (object a in valArray)
					{
						valStr += ExtCompolet.GetValueString(a) + ",";
					}
					valStr = valStr.TrimEnd(',');
					valStr += "]";
				}
				else if (valArray.Rank == 2)
				{
					for (int i = 0; i <= valArray.GetUpperBound(0); i++)
					{
						valStr += "[";
						for (int j = 0; j <= valArray.GetUpperBound(1); j++)
						{
							valStr += ExtCompolet.GetValueString(valArray.GetValue(i, j)) + ",";
						}
						valStr = valStr.TrimEnd(',');
						valStr += "]";
					}
				}
				else if (valArray.Rank == 3)
				{
					for (int i = 0; i <= valArray.GetUpperBound(0); i++)
					{
						for (int j = 0; j <= valArray.GetUpperBound(1); j++)
						{
							valStr += "[";
							for (int z = 0; z <= valArray.GetUpperBound(2); z++)
							{
								valStr += ExtCompolet.GetValueString(valArray.GetValue(i, j, z)) + ",";
							}
							valStr = valStr.TrimEnd(',');
							valStr += "]";
						}
					}
				}
			}
			else
			{
				valStr = ExtCompolet.GetValueString(val);
			}
			return valStr;
		}
		static private object RemoveBrackets(string val)
		{
			object obj = string.Empty;
			if (val.IndexOf("[") >= 0)
			{
				string str = val.Trim('[', ']');
				str = str.Replace("][", ",");
				obj = str.Split(',');
			}
			else
			{
				obj = val;
			}
			return obj;
		}

		static private string GetValueString(object val)
		{
			if (val is float || val is double)
			{
				return string.Format("{0:R}", val);
			}
			else
			{
				return val.ToString();
			}
		}
	}

}