
using Newtonsoft.Json;
using OpenCvSharp;

namespace json_converter
{
	public partial class Image
	{
		[JsonIgnore]
		public Mat image_cv { get; set; }
		public string __base64img__ { get; set; }
	}
}