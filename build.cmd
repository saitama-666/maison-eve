@echo off
REM ------------------------------------------------------------------
REM  Build de VERIFICATION.
REM
REM  Ecrit dans .next-verif, pas dans .next : le serveur de dev peut
REM  continuer a tourner pendant ce temps sans se faire ecraser sa
REM  version compilee.
REM ------------------------------------------------------------------
cd /d "%~dp0"
set NEXT_DIST_DIR=.next-verif
echo Build de verification dans .next-verif ...
call npx.cmd next build
pause
