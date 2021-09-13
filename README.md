## PLC Connector

Сервис отвечающий за общение с ПЛК.  
Написан с использованием CX-Compolet/SYSMAC Gateway.
За основу взят другой проект, из которого постарались вырезать только часть для общения с ПЛК, поэтому в коде могут встречаться необоснованные решения.

### ZMQ API
Сервис предоставляет доступ через запросы ZeroMQ, описание ниже

    ServiceTask:{command: "kill"|"get all plc vars"}
    
    PlcVarsArray:{
        arr: [{name: string; value?: any}, ...];
        update?: bool; //should it update in plc, or just read
        }

### Запуск сервиса

    cd MainApp
    dotnet run

