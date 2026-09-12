@echo off
title School OS Bridge - Setup Dapodik Auto-Sync
color 0b
echo ========================================================
echo         SCHOOL OS LOCAL BRIDGE - INSTALLER
echo   Sinkronisasi Otomatis Dapodik ke Cloud School OS
echo ========================================================
echo.

set TARGET_DIR=%LOCALAPPDATA%\SchoolOS
set TARGET_EXE=%TARGET_DIR%\schoolos-bridge.exe
set SOURCE_EXE=%~dp0schoolos-bridge.exe

echo [1/3] Menyiapkan direktori instalasi...
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

echo [2/3] Memeriksa file aplikasi...
if exist "%SOURCE_EXE%" (
    echo Menghentikan proses lama jika ada...
    taskkill /F /IM schoolos-bridge.exe >nul 2>&1
    timeout /t 1 /nobreak >nul
    copy /y "%SOURCE_EXE%" "%TARGET_EXE%" >nul
    echo File aplikasi berhasil dipasang ke: %TARGET_EXE%
) else if exist "%TARGET_EXE%" (
    echo Menggunakan file instalasi yang sudah ada.
) else (
    echo [ERROR] File schoolos-bridge.exe tidak ditemukan di folder ini!
    echo Pastikan schoolos-bridge.exe berada di folder yang sama dengan file .bat ini.
    pause
    exit /b 1
)

echo [3/3] Mendaftarkan Autostart Windows (Menyala otomatis saat komputer hidup)...
reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "SchoolOSBridge" /t REG_SZ /d "\"%TARGET_EXE%\" --daemon" /f >nul

echo Menjalankan School OS Bridge di latar belakang...
start "" "%TARGET_EXE%" --daemon

echo.
echo ========================================================
echo  SUKSES! School OS Bridge telah aktif di latar belakang!
echo  Port: 5775 (Localhost)
echo  Autostart: AKTIF (Sekali pasang, aktif selamanya)
echo ========================================================
echo.
echo Anda dapat menutup jendela ini dan langsung kembali ke
echo browser web School OS untuk 'Tarik Data Siswa'.
echo.
pause
