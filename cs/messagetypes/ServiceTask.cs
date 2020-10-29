namespace json_converter
{
	public class ServiceTask: Request, Response
	{
		public string command { get; set; }
		public ServiceTask()
		{
			command = "empty";
		}
	}
}