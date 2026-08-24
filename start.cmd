@echo off
REM Demarre le site en mode production (apres `npx next build`).
cd /d "%~dp0"
call npx.cmd next start
pause
