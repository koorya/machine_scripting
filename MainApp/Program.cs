using System;
using System.Collections.Generic;
using System.Threading;
using json_converter;
using PlcConnector_module;

namespace MainApp
{
	class Program
	{
		static bool working = true;
		static async System.Threading.Tasks.Task Main(string[] args)
		{
			Console.WriteLine("Main thread start");
			await PlcConnector.connect(new System.ComponentModel.Container());
			// return;

			var cnn_service = new ServiceStarter();
			cnn_service.StartService();

			List<Listener> listener_list = new List<Listener>();
			listener_list.Add(new Listener("tcp://*:5554"));
			listener_list.Add(new Listener("tcp://*:5553"));

			foreach (var listener in listener_list)
			{

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

						PlcConnector.updatePlcVariablesByArray(m.arr);

						// foreach(PlcVar plc_var in PlcConnector.plc_vars)
						// {
						// 	foreach(PlcVar req_var in m.arr)
						// 		if(plc_var.id == req_var.id)
						// 			plc_var.value = req_var.value;
						// }

					};

				listener.Start();
			}



			int time = 0;
			while (working)
			{
				Thread.Sleep(100);
				time += 100;
				if (time == 5000)
				{
					time = 0;
					Console.WriteLine("Hello main thread. For exit press [ESC]");
				}
				if (Console.KeyAvailable && Console.ReadKey(true).Key == ConsoleKey.Escape)
				{
					cnn_service.KillService();
					listener_list.ForEach(delegate (Listener listener) { listener.Stop(); });
					working = false;
				}
			}
			cnn_service.WaitForExit();
		}
	}
}
