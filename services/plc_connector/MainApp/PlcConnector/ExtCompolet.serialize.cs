using System;
using System.Collections.Generic;

namespace PlcConnector_module
{
    // Список из именно этих объектов сериализуется в файл и десериализуется из него
    // Когда нужно достать из файла данные о плк и переменных, мы достаем этот объект
    // а затем уже из него получаем данные для создания объекта связи с плк
    [Serializable]
    public class ExtComp_serial
    {
        // название плк
        public string plc_name { get; set; }
        
        // номер порта в sysmac geteway, на котором находится плк 
        public int LocalPort { get; set; }
        
        // ip адрес манипулятора
        public string PeerAddress { get; set; }

        // список переменных, которые заданы для этого контроллера как сетевые
        public List<plcvariable> var_name_list { get; set; }
        public List<string> cam_ip_list {get; set; }

    }

    // Продолжене писания класса ExtCompolet, в котором описаны два метода 
    // для распаковки и упаковки даных в промежуточный объект для сериализакции
    partial class ExtCompolet 
    {
        // метод, который упаковывает этот объект в тот, который будет сериализоваться в файл.
        public ExtComp_serial convert_to_serial()
        {
            ExtComp_serial ser = new ExtComp_serial();
            ser.plc_name = this.plc_name;
            ser.PeerAddress = this.PeerAddress;
            ser.LocalPort = this.LocalPort;

            ser.var_name_list = new List<plcvariable>();
            foreach (var v in this.plc_var_list)
            {
                ser.var_name_list.Add(v.Value);
            }
            ser.cam_ip_list = cam_ip_list;
            
            return ser;
        }

        // этот метод принимает промежуточный объект и по нему заполняет поля основного объекта
        public void deserialize(ExtComp_serial deser)
        {

            this.Active = false;
            this.ConnectionType = OMRON.Compolet.CIPCompolet64.ConnectionType.UCMM;
            this.LocalPort = deser.LocalPort;
            this.PeerAddress = deser.PeerAddress;//"192.168.250.1";
            this.ReceiveTimeLimit = ((long)(750));
            this.RoutePath = "2%172.16.201.14\\1%0";//"2%192.168.250.1\\1%0"; // в нашем контексте не используется
            this.UseRoutePath = false;
            this.plc_name = deser.plc_name;

            // задаем всем переменным этого плк ссылку на объект с методами для чтения и записи переменных
            foreach(plcvariable v in deser.var_name_list)
            {
                v.plc_conection = this;
                Console.WriteLine(v.name);
            }
			this.plc_var_list = new Dictionary<string, plcvariable>();
			foreach(var item in deser.var_name_list)
            	this.plc_var_list.Add(item.name, item);

            cam_ip_list = deser.cam_ip_list;

        }
    }
}