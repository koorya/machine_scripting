using System;
using System.Collections.Generic;
using System.Threading;
using json_converter;
using NDesk.Options;
using Newtonsoft.Json;
using PlcConnector_module;

namespace MainApp
{
	class Program
	{
		static bool working = true;
		static async System.Threading.Tasks.Task Main(string[] args)
		{

			bool show_help = false;
			List<int> ports = new List<int>();
			int sgw_port = 2;
			string ip = "172.16.201.89";

			var p = new OptionSet() {
		{ "p|port=", "the {PORT} of zmq listener. default 5554, 5553, 5552",
			 v => ports.Add (Int32.Parse(v)) },
		{ "a|ip_address=", "the {IP} of PLC. default 172.16.201.89",
			 v => ip = v },
		{ "s|sgw_port=", "the {PORT} of sysmac gateway. default 2",
			 v => sgw_port = Int32.Parse(v) },
		{ "h|help",  "show this message and exit",
			 v => show_help = v != null },
};
			List<string> extra;
			try
			{
				extra = p.Parse(args);
			}
			catch (OptionException e)
			{
				Console.Write("greet: ");
				Console.WriteLine(e.Message);
				Console.WriteLine("Try `greet --help' for more information.");
				return;
			}

			Console.WriteLine("Main thread start");
			await PlcConnector.connect(new System.ComponentModel.Container(), sgw_port, ip);
			// return;

			List<Listener> listener_list = new List<Listener>();
			if (ports.Count == 0)
			{
				ports.Add(5554);
				ports.Add(5553);
				ports.Add(5552);
			}
			ports.ForEach(port =>
			{
				listener_list.Add(new Listener(String.Format("tcp://*:{0}", port)));
				Console.WriteLine("Listen on port: {0}", port);
			});

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
				try
				{

					if (Console.KeyAvailable && Console.ReadKey(true).Key == ConsoleKey.Escape)
					{
						listener_list.ForEach(delegate (Listener listener) { listener.Stop(); });
						working = false;
					}
				}
				catch
				{
				}
			}
		}
	}
}
