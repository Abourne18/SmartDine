@echo off
color 0A
echo ===================================================
echo     MEMULAI APLIKASI SMARTDINE (CAPSTONE PROJECT)
echo ===================================================
echo.

echo [1/4] Menyalakan MySQL (Database)...
start /MIN C:\xampp\mysql_start.bat
timeout /t 2 /nobreak > nul
echo OK! Database berjalan.
echo.

echo [2/4] Menyalakan Node.js (Backend)...
start "SmartDine Backend Server" cmd /k "cd backend && node server.js"
timeout /t 3 /nobreak > nul
echo OK! Server Backend berjalan di Port 3000.
echo.

echo [3/4] Menyalakan Cloudflare Tunneling...
start "SmartDine Tunnel (Cloudflare)" cmd /k ".\cloudflared.exe tunnel run --url http://localhost:3000 --protocol http2 2515dd7d-6561-4215-818c-4b88f71cd0c4"
echo OK! Tunneling diaktifkan.
echo.

echo [4/4] Membuka Aplikasi di Browser...
timeout /t 4 /nobreak > nul
start https://smartdine.my.id
echo OK! Browser dibuka ke https://smartdine.my.id.
echo.

echo ===================================================
echo SEMUA SISTEM BERJALAN! TUTUP JENDELA INI JIKA SELESAI.
echo ===================================================
pause
