# Machine Scripting

It is the main repo of **machine scripting** project developed by the Energozapas team.

## Project dependencies

### PLC firmwares
 - Manipulator domkrat
 - Manipulator montagnik


### PC services
 - State machine scripting
 - PLC connector
 - Web UI


## Developer instructions


Take symlinks of PLC firmware parts to Sysmac Studio..  
In project folder execute lines(powershell):

	New-Item -Path C:\OMRON\Data\Solution\mm_domkrat -ItemType SymbolicLink -Target $(Convert-Path .\firmware\mm_domkrat)
	...
	...

After clone this repo add remotes as shown below

	git remote add firmware_domkrat https://github.com/koorya/mm_domkrat
	...
	...

Push changes to subtree

	git subtree push --prefix=firmware/mm_domkrat firmware_domkrat [master|dev]
	...

Pull changes from subtree

	git subtree pull --prefix=firmware/mm_domkrat firmware_domkrat master


Если случилось изменение, затрагивающее взаимосвязь подпроектов. Надо запушить в dev ветки подпроектов. Затем доведя до результата, запушить в master ветки (либо из dev веток подпроекта, либо из главного репозитория). В самый последний момент нужно сделать pull master веток подпроектов в главный репозиторий.