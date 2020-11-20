namespace json_converter
{
	public class ServiceTask : iRequest, iResponse
	{
		public string command { get; set; }
		public ServiceTask()
		{
			command = "empty";
		}
		public object getWrapper()
		{
			return new { ServiceTask = this };
		}
	}
}