namespace json_converter
{

	public class PlcVarsArray : iRequest, iResponse
	{
		public PlcVar[] arr { get; set; }
		public bool update { get; set; } = true;
		public PlcVarsArray()
		{

		}
		public object getWrapper()
		{
			return new { PlcVarsArray = this };
		}
	}
}