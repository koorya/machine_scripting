using OpenCvSharp;

namespace MainApp
{
	class Capture
	{
		public static Mat getImage()
		{
			VideoCapture capture = new VideoCapture(0);
			Mat img = new Mat();
			capture.Read(img);
			var ret = img.Clone();
			capture.Release();	
			return ret;
		}
	}
}