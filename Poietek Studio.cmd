@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Poietek Studio needs Node.js LTS for this repository launcher.
  echo The standalone native installer does not have that requirement once built.
  pause
  exit /b 1
)
node "%~dp0scripts\local-studio.mjs"
if errorlevel 1 pause
