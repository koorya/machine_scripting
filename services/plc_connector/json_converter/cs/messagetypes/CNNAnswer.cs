

namespace json_converter
{
	public class CNNAnswer : iResponse
	{
		public int res { get; set; }
		public Image image { get; set; }
		public CNNAnswer()
		{
			image = new Image();
		}
		public object getWrapper()
		{
			return new { CNNAnswer = this };
		}
	}
}