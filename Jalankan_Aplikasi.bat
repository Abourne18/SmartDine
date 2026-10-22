@echo off
color 0A
echo ===================================================
echo     MEMULAI APLIKASI SMARTDINE (CAPSTONE PROJECT)
echo ===================================================
echo.

echo [1/4] Menyalakan MySQL (Database)...
start /MIN C:\xampp\mysql_start.bat
ping 127.0.0.1 -n 3 > nul
echo OK! Database berjalan.
echo.

echo [2/4] Menyalakan Node.js (Backend)...
start "SmartDine Backend Server" cmd /k "cd /d "%~dp0backend" && node server.js"
ping 127.0.0.1 -n 4 > nul
echo OK! Server Backend berjalan di Port 5500.
echo.

echo [3/4] Menyalakan Cloudflare Tunneling...
start "SmartDine Tunnel (Cloudflare)" cmd /k "cd /d "%~dp0" && .\cloudflared.exe --edge-ip-version 4 tunnel run --url http://127.0.0.1:5500 c16a8105-129b-487a-a5a7-de66dbb93b9f"
echo OK! Tunneling diaktifkan.
echo.

echo [4/4] Menghubungkan ke Cloudflare Edge...
echo Mohon tunggu sejenak agar koneksi tunnel siap...
ping 127.0.0.1 -n 9 > nul
start https://smartdine.my.id
echo OK! Browser dibuka ke https://smartdine.my.id.
echo.

echo ===================================================
echo SEMUA SISTEM BERJALAN! JANGAN TUTUP JENDELA INI.
echo ===================================================
pause
