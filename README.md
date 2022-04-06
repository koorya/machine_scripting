# Machine Scripting

Это основной репозиторий программы управления стройкой, разработанной в энергозапасе.

## Структура проекта

### ПЛК (firmware)

- ПО манипулятора домкрата (mm_domkrat)

### ПК сервисы

- Логика (machine_scripting):
  - Web UI (clients/react)
  - shared - разделяемые файлы бэка и фронта, ts
  - backend (node, ts)
    - zmq
    - express
    - javascript-state-machine
    - graphviz
- PLC connector - модуль связи с ПЛК через SysmacGateway
- NeuroNets_MM - модуль распознования дефектов заклепывания

## Инструкции по развертыванию

Для создания symlink в win10 требуется включить разрешения в системе.

Чтобы SysmacStudio имел доступ к проекту домкрата, требуется
в корне проекта в powershell исполнить следующую команду:

    New-Item -Path C:\OMRON\Data\Solution\mm_domkrat -ItemType SymbolicLink -Target $(Convert-Path .\firmware\mm_domkrat)

Для запуска nodejs сервисов требуется создать symlink на разделяемые бэком и фронтом части проекта.
Для этого из `services\machine_scripting\clients\react\src` надо выполнить

New-Item -Path .\shared -ItemType SymbolicLink -Target $(Convert-Path ..\..\..\shared)

### Зависимости

По [ссылке архив](http://dd) с требуемыми зависимостями

Для комфортной работы требуется установить
свежий **Powershell**, **git**, модуль **posh-git** ниже
инструкция.

    PowerShellGet\Install-Module posh-git -Scope CurrentUser -Force

    Add-PoshGitToProfile -AllHosts

Устанавливаем
К6СМ\Framework\dotnetfx35.exe

Далее устанавливаем SysmacGateWay - программу для связи с контроллерами Omron.
К6СМ\SGW\Disk1\setup.exe
Появится файл
C:\Program Files (x86)\OMRON\SYSMAC Gateway\bin\CIPCoreConsole.exe
Для удобства делаем ссылку на этот файл в доступном месте. При запуске системы
для связи с манипуляторами требуется в этой программе настроить подключение.

После перезагрузки удается настроить подключение.
