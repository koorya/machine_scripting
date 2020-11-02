using OpenCvSharp;

namespace json_converter
{
	public class CNNTask : Request
	{
		public int a { get; set; }
		public int b { get; set; }
		public Mat image { get; set; }
		public CNNTask()
		{
			image = new Mat();
		}
	}
}