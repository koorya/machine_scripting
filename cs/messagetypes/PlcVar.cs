
using Newtonsoft.Json;

namespace json_converter
{
	public class PlcVar
	{
		public int id { get; set; }
		public string type { get; set; }
		public string name { get; set; }
		public object value { get; set; }
		[JsonIgnore]
		public object valueref { get; set; }

	}
}