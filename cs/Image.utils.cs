using OpenCvSharp;

namespace json_converter
{
	public partial class Image  
	{

		// # encode ndarray to base64
		static string ndarray2base64(Mat img) //проверил, конечная строка сошлась с той, которую получал функцией на питоне
		{
			byte[] im_arr1;
			OpenCvSharp.Cv2.ImEncode(".png", img, out im_arr1);
			var im_b64 = System.Convert.ToBase64String(im_arr1);
			return im_b64;
		}

	// # decode from base64 to ndarray
		static Mat base642ndarray(string str)
		{
			var im_b64 = str;
			var im_bytes = System.Convert.FromBase64String(im_b64);
			Mat img = OpenCvSharp.Cv2.ImDecode(im_bytes,ImreadModes.Unchanged);
			return img;	
		}
		public bool generateCV()
		{
			if(__base64img__ != null)
				image_cv = base642ndarray(__base64img__);
			else 
				return false;
			return true;
		}
		public bool generateBase64()
		{
			if(image_cv != null)
				__base64img__ = ndarray2base64(image_cv);
			else 
				return false;
			return true;
		}
	}
}