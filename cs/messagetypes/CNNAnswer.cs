using OpenCvSharp;


namespace json_converter
{
	public class CNNAnswer
	{
		public int res { get; set; }
		public Mat image { get; set; }
		public CNNAnswer()
		{
			image = new Mat();
		}
	}
}