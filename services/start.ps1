mkdir ./logs -Force

$plc_connector_options = @{
	FilePath               = "dotnet"
	ArgumentList           = 'run'
	RedirectStandardOutput = "./logs/plc_connector.txt"
	WorkingDirectory       = "./plc_connector/MainApp"

}

$machine_scripting_options = @{
	FilePath               = "npm"
	ArgumentList           = "start"
	RedirectStandardOutput = "./logs/machile_scripting_connector.txt"
	WorkingDirectory       = "./machine_scripting/backend"
}

Start-Process @plc_connector_options  
Start-Process @machine_scripting_options