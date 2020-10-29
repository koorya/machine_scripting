using OpenCvSharp;


namespace json_converter
{
	public class CNNAnswer: Response
	{
		public int res { get; set; }
		public Mat image { get; set; }
		public CNNAnswer()
		{
			image = new Mat();
		}
	}
}