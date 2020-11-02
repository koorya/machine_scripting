
using System;
using System.Threading;
using json_converter;
using NetMQ;
using NetMQ.Sockets;

namespace MainApp
{
	class Listener 
	{
		Thread listener;
		public delegate void ServiceCommandHandler(ServiceTask task);
		public event ServiceCommandHandler service_received;
		public delegate iResponse ServiseCommandResponderDelegate(ServiceTask task); //ServiceResponse
		public ServiseCommandResponderDelegate ServiseCommandResponder;
		public bool working { get; set; }
		ResponseSocket server;
		public Listener() 
		{
			working = true;
			listener = new Thread(new ThreadStart(()=>
				{
					server = new ResponseSocket();
					server.Bind("tcp://*:5554");
					
					string message;
					while (working)
					{
						if (server.TryReceiveFrameString(System.TimeSpan.FromSeconds(2), out message))
						{
							Console.WriteLine("receive message: {0}", message);
							var message_obj = json_converter.JsonConverter.deserialaze(message);
							ProcessMessage(message_obj as iMessage);
						}
						else
						{
							Console.WriteLine("No message recieve");
						}
					}
				}));     
			listener.IsBackground = true;
		}
		public void Start()
		{
			listener.Start();
		}
		private void ProcessMessage(iMessage message)
		{
			if (message is null)
				return;
			if (Object.ReferenceEquals(message.GetType(), typeof(ServiceTask)))
			{
				var service_task = message as ServiceTask;
				service_received(service_task); //подписчики
				var resp = ServiseCommandResponder(service_task);
				
				string answer_delegate_str = json_converter.JsonConverter.serialaze(resp); // отвечающий
				server.TrySendFrame(System.TimeSpan.FromSeconds(5), answer_delegate_str);
			}
		}
	}
}
