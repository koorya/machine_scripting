using System;
using System.Threading;
using json_converter;
using PlcConnector_module;

namespace MainApp
{
	class Program
	{
		static bool working = true;
		static void Main(string[] args)
		{
			Console.WriteLine("Main thread start");

			var cnn_service = new ServiceStarter();
			cnn_service.StartService();

			var listener = new Listener();
			listener.service_received += (m) => { Console.WriteLine("rec1: {0}", m); };
			listener.service_received += (m) => { Console.WriteLine("rec2: command == {0}", m.command); };
			listener.ServiseCommandResponder = (m) =>
				{
					var rec = new ServiceTask();
					rec.command = "default info";
					if (m.command == "kill")
					{
						cnn_service.KillService();
						working = false;
						listener.Stop();
						rec.command = "ok, kill";
					}
					else if (m.command == "capture")
					{
						var proc_resp = cnn_service.ProcessResponse(m);
						return proc_resp;
					}
					else if (m.command == "get all plc vars")
					{
						return PlcConnector.getPlcVars();
					}
					return (iResponse)rec;
				};

			listener.plcvar_recived += (m) =>
				{
					Console.WriteLine(m);
					foreach(PlcVar plc_var in PlcConnector.plc_vars)
					{
						foreach(PlcVar req_var in m.arr)
							if(plc_var.id == req_var.id)
								plc_var.value = req_var.value;
					}
					
				};

			listener.Start();

			while (working)
			{
				Thread.Sleep(5000);
				Console.WriteLine("Hello main thread. For exit press [ESC]");
				if (Console.KeyAvailable && Console.ReadKey(true).Key == ConsoleKey.Escape)
				{
					cnn_service.KillService();
					listener.Stop();
					working = false;
				}
			}
			cnn_service.WaitForExit();
		}
	}
}
