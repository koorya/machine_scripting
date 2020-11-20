using json_converter;
namespace PlcConnector_module
{
	public class PlcConnector
	{
		public static PlcVar[] plc_vars;
		static PlcConnector()
		{
			plc_vars = new PlcVar[4];
			plc_vars[0] = new PlcVar();
			plc_vars[1] = new PlcVar();
			plc_vars[2] = new PlcVar();
			plc_vars[3] = new PlcVar();

			plc_vars[0].id = 1;
			plc_vars[0].type = "int";
			plc_vars[0].name = "state1";
			plc_vars[0].value = 0;

			plc_vars[1].id = 2;
			plc_vars[1].type = "float";
			plc_vars[1].name = "x";
			plc_vars[1].value = 2.4;

			plc_vars[2].id = 4;
			plc_vars[2].type = "float";
			plc_vars[2].name = "y";
			plc_vars[2].value = 2.2;

			plc_vars[3].id = 3;
			plc_vars[3].type = "bool";
			plc_vars[3].name = "enable";
			plc_vars[3].value = true;
		}
		public static PlcVarsArray getPlcVars()
		{

			PlcVarsArray wrapper = new PlcVarsArray();
			wrapper.arr = plc_vars;
			return wrapper;

		}
	}
}
