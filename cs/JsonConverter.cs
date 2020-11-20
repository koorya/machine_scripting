using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace json_converter
{
	public partial class JsonConverter
	{

		public static string serialaze(iMessage o)
		{
			return JsonConvert.SerializeObject(o.getWrapper(), Formatting.Indented);
		}
		public static object deserialaze(string json_str)
		{
			JObject res = JsonConvert.DeserializeObject<JObject>(json_str);

			if (res.ContainsKey("CNNAnswer"))
				return res["CNNAnswer"].ToObject<CNNAnswer>();
			else if (res.ContainsKey("CNNTask"))
				return res["CNNTask"].ToObject<CNNTask>();
			else if (res.ContainsKey("PlcVarsArray"))
				return res["PlcVarsArray"].ToObject<PlcVarsArray>();
			else if (res.ContainsKey("ServiceTask"))
				return res["ServiceTask"].ToObject<ServiceTask>();

			return res;
		}

	}
}