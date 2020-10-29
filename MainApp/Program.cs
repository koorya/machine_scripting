using System;
using System.Threading;
using NetMQ.Sockets;
using NetMQ;
using json_converter;

namespace MainApp
{
	class Program
	{
		static bool working = true;
		static void Main(string[] args)
		{
			Console.WriteLine("Main thread start");

			var cnn_service = new ServiceStarter();

			var listener = new Listener();
			listener.service_received += (m) => {Console.WriteLine("rec1: {0}", m);};
			listener.service_received += (m) => {Console.WriteLine("rec2: command == {0}", m.command);};
			// listener.service_received += (m) => {if (m.command == "kill") cnn_service.KillService();};
			listener.ServiseCommandResponder = (m) => 
				{
					var rec = new ServiceTask();
					rec.command = "default info";
					if (m.command == "kill")
					{
						cnn_service.KillService();
			 			working = false;
						listener.working = false;
						rec.command = "ok, kill";
					}else if (m.command == "capture")
					{
						var proc_resp = cnn_service.ProcessResponse(m);
						return proc_resp;
					}
					return (Response)rec;
			 	};

			listener.Start();

			while (working)
			{
				Thread.Sleep(5000);
				Console.WriteLine("Hello main thread");
			}
			cnn_service.WaitForExit();
		}
	}
}
