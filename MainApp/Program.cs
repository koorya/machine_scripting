using System;
using System.Threading;
using NetMQ.Sockets;
using NetMQ;
using json_converter;
using OpenCvSharp;
using System.Diagnostics;
using System.IO;

namespace MainApp
{
	class Program
	{
		static bool working = true;
		static void Main(string[] args)
		{
			Console.WriteLine("Main thread start");


			var py = new Process();
			py.StartInfo.FileName = "python";
			py.StartInfo.Arguments = @" C:\programming\cnn_zmq_service\start.py";
			py.StartInfo.WorkingDirectory = @"C:\programming\cnn_zmq_service\";
			py.StartInfo.WindowStyle = ProcessWindowStyle.Hidden;
			py.StartInfo.UseShellExecute = false;
			py.StartInfo.RedirectStandardOutput = true; 
			py.StartInfo.RedirectStandardError = true;
			string cnn_outputPath = @"./log/output_cnn.txt";
			using (StreamWriter sw = new StreamWriter(cnn_outputPath, false, System.Text.Encoding.Default))
			{
				sw.WriteLine(DateTime.Now);
			}
			py.OutputDataReceived += new DataReceivedEventHandler( (s, e) => {
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
			py.ErrorDataReceived += new DataReceivedEventHandler((s, e) => {
				if (!String.IsNullOrEmpty(e.Data))
					using (StreamWriter sw = new StreamWriter(cnn_errorPath, true, System.Text.Encoding.Default))
					{
						sw.WriteLine(e.Data);
					}
			});
			py.Start();
			py.BeginOutputReadLine();
			py.BeginErrorReadLine();

			var listener = new Thread(new ThreadStart(()=>
				{
					var server = new NetMQ.Sockets.ResponseSocket();
					server.Bind("tcp://*:5554");
					
					var client = new RequestSocket();
					client.Connect("tcp://localhost:5555");
					string message;
					while (true)
					{
						if (server.TryReceiveFrameString(System.TimeSpan.FromSeconds(2), out message))
						{
							Console.WriteLine("receive message: {0}", message);
							var messaje_obj = json_converter.JsonConverter.deserialaze(message);
							if (Object.ReferenceEquals(messaje_obj.GetType(), typeof(ServiceTask)))
							{
								var service_task = messaje_obj as ServiceTask;
								if (service_task.command == "kill")
								{
									bool service_up = client?.TrySendFrame(System.TimeSpan.FromSeconds(2), message) ?? false;
									if(service_up)
									{
										Console.WriteLine("kill command was sent to cnn service");

									}
									else
									{
										Console.WriteLine("cnn service kill");
										py.Kill();
									}
									working = false;
									break;
								}
								else if (service_task.command == "capture")
								{
									if(client == null)
									{
										client = new RequestSocket();
										client.Connect("tcp://localhost:5555");
									}
									CNNTask cnn_task = new CNNTask();
									cnn_task.image = Capture.getImage();
									string cnn_task_str = json_converter.JsonConverter.serialaze(cnn_task);
									string service_message;
									if (client.TrySendFrame(System.TimeSpan.FromSeconds(5), cnn_task_str) && 
										client.TryReceiveFrameString(System.TimeSpan.FromSeconds(5), out service_message))
									{
										var service_obj = json_converter.JsonConverter.deserialaze(service_message);
										if(Object.ReferenceEquals(service_obj.GetType(), typeof(CNNAnswer)))
										{
											CNNAnswer cnn_rec_answ = service_obj as CNNAnswer;
											System.Console.WriteLine("service resp.res: {0}", cnn_rec_answ.res);
											var cnn_answer = new CNNAnswer();
											cnn_answer.image = cnn_rec_answ.image;
											string capture_answer = json_converter.JsonConverter.serialaze(cnn_answer); 
											server.SendFrame(capture_answer);                                    
										}
										else
										{
											System.Console.WriteLine("server illegal answer");
											var error_answer = new ServiceTask();
											error_answer.command = "service illegal answer";
											string error_answer_str = json_converter.JsonConverter.serialaze(error_answer); 
											server.SendFrame(error_answer_str);                                              
										}
									}
									else
									{
										client = null;
										System.Console.WriteLine("service is down");
										var error_answer = new ServiceTask();
										error_answer.command = "service is down";
										string error_answer_str = json_converter.JsonConverter.serialaze(error_answer); 
										server.SendFrame(error_answer_str);                              
									}
									continue;
								}
							}
							string answer_str = json_converter.JsonConverter.serialaze(new ServiceTask()); 
							server.SendFrame(answer_str);
						}
						else
						{
							Console.WriteLine("No message recieve");
						}
					}
				}));     
			listener.IsBackground = true;
			listener.Start();
			while (working)
			{
				Thread.Sleep(5000);
				Console.WriteLine("Hello main thread");
			}
			py.WaitForExit();
		}
	}
}
