
namespace json_converter
{
	public class CNNTask : iRequest
	{
		public int a { get; set; }
		public int b { get; set; }
		public Image image { get; set; }
			
		public CNNTask()
		{
			 image = new Image();
		}
		public object getWrapper()
		{
			return new {CNNTask = this};
		}
	}

}