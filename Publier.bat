@echo off
title L'Echiquier de Saint-Andre - preparer une mise en ligne
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0outils\publier.ps1" -Demander
pause
