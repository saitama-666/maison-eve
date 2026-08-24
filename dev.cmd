@echo off
REM ------------------------------------------------------------------
REM  Lanceur de developpement MAISON EVE.
REM
REM  PowerShell refuse d'executer npm.ps1 quand l'ExecutionPolicy est
REM  Restricted. Ce fichier .cmd contourne le probleme : double-clic,
REM  ou `dev.cmd` dans n'importe quel terminal.
REM ------------------------------------------------------------------
cd /d "%~dp0"

if not exist "node_modules" (
  echo Installation des dependances...
  call npm.cmd install
  if errorlevel 1 goto :erreur
)

if not exist ".env.local" (
  echo.
  echo   ATTENTION : .env.local est absent.
  echo   Copie .env.local.example en .env.local et remplis les cles Firebase.
  echo   Le site demarre quand meme, mais sans compte ni reservation.
  echo.
)

echo Demarrage du serveur de developpement sur http://localhost:3000
call npx.cmd next dev
goto :fin

:erreur
echo.
echo   L'installation a echoue. Verifie que Node.js est installe.
pause

:fin
