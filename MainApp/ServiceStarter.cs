using System;
using System.Diagnostics;
using System.IO;

namespace MainApp
{
	class ServiceStarter : Process	
	{
		public ServiceStarter() : base()
		{
			this.StartInfo.FileName = "python";
			this.StartInfo.Arguments = @" C:\programming\cnn_zmq_service\start.py";
			this.StartInfo.WorkingDirectory = @"C:\programming\cnn_zmq_service\";
			this.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
			this.StartInfo.UseShellExecute = false;
			this.StartInfo.RedirectStandardOutput = true; 
			this.StartInfo.RedirectStandardError = true;
			string cnn_outputPath = @"./log/output_cnn.txt";
			using (StreamWriter sw = new StreamWriter(cnn_outputPath, false, System.Text.Encoding.Default))
			{
				sw.WriteLine(DateTime.Now);
			}
			this.OutputDataReceived += new DataReceivedEventHandler( (s, e) => {
				if (!String.IsNullOrEmpty(e.Data))
					using (StreamWriter sw = new StreamWriter(cnn_outputPath, true, System.Text.Encoding.Default))
					{
						sw.WriteLine(e.Data);
					}
			});
			string cnn_errorPath = @"./log/error_cnn.txt";
			using (StreamWriter sw = new StreamWriter(cnn_errorPath, false, System.Text.Encoding.Default))
			{
				sw.WriteLine(DateTime.Now);
			}
			this.ErrorDataReceived += new DataReceivedEventHandler((s, e) => {
				if (!String.IsNullOrEmpty(e.Data))
					using (StreamWriter sw = new StreamWriter(cnn_errorPath, true, System.Text.Encoding.Default))
					{
						sw.WriteLine(e.Data);
					}
			});
			this.Start();
			this.BeginOutputReadLine();
			this.BeginErrorReadLine();			
		}

	}
}
