@echo off
title School OS Bridge - Uninstaller
color 0c
echo ========================================================
echo        SCHOOL OS LOCAL BRIDGE - UNINSTALLER
echo ========================================================
echo.

set TARGET_DIR=%LOCALAPPDATA%\SchoolOS
set TARGET_EXE=%TARGET_DIR%\schoolos-bridge.exe

echo Menghentikan proses latar belakang...
taskkill /F /IM schoolos-bridge.exe >nul 2>&1
taskkill /F /IM schoolos-sync.exe >nul 2>&1

echo Menghapus autostart dari Windows Registry...
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SchoolOSBridge" /f >nul 2>&1

echo Menghapus file instalasi...
if exist "%TARGET_EXE%" del /f /q "%TARGET_EXE%" >nul 2>&1

echo.
echo ========================================================
echo  School OS Bridge berhasil dinonaktifkan & dicopot.
echo ========================================================
echo.
pause
