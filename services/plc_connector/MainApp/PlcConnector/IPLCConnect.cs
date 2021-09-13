
namespace PlcConnector_module
{
    // этот интерфейс должен быть у всех объектов, которые 
    // обеспечивают связь с контроллером и позволяют читать 
    // и писать их переменные
    public interface IPLCConnect 
    {
        object WriteVar(string name, object value);

        object readFromPlc(string varname);

    }

}
