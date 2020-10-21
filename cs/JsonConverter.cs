using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;


namespace json_converter
{
	public partial class JsonConverter  
	{

		public static string serialaze(object o)
		{
			var collection = getDictionaryByObject(o);
			string json_coll = JsonConvert.SerializeObject(collection, Formatting.Indented);
			return json_coll;
		}
		public static object deserialaze(string json_str)
		{
			JObject res = JsonConvert.DeserializeObject<JObject>(json_str);
			
			return getObjectByDictionary(res);
		}
		
	} 
}