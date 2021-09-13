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

			List<Listener> listener_list = new List<Listener>();
			listener_list.Add(new Listener("tcp://*:5554"));
			listener_list.Add(new Listener("tcp://*:5553"));
			listener_list.Add(new Listener("tcp://*:5552"));

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
							working = false;
							listener.Stop();
							rec.command = "ok, kill";
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
						if (m.update)
						{
							foreach (var upd_var in m.arr)
							{
								PlcConnector.updateSinglePlcVariable(upd_var);
							}
						}
					};

				listener.plcvar_recived += (m) =>
					{
						if (!m.update)
						{
							PlcConnector.readFromPlcByArray(m.arr);
						}
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
					listener_list.ForEach(delegate (Listener listener) { listener.Stop(); });
					working = false;
				}
			}
		}
	}
}
