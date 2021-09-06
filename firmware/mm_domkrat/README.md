# MM Domkrat
This is Sysmac studio project for PLC of mm domkrat.

Clone this repo into `C:\OMRON\Data\Solution` and restart Sysmac studio.

    cd C:\OMRON\Data\Solution
    git clone https://github.com/koorya/mm_domkrat


Or by using symlinks

    git clone https://github.com/koorya/mm_domkrat
    New-Item -Path C:\OMRON\Data\Solution\mm_domkrat -ItemType SymbolicLink -Target $(Convert-Path .\mm_domkrat)
