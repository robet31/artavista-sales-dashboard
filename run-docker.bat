@echo off
echo ========================================
echo   PIZZA DASHBOARD - DOCKER RUNNER
echo ========================================
echo.
echo Memeriksa Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker tidak berjalan!
    echo Silakan buka Docker Desktop terlebih dahulu
    pause
    exit /b 1
)
echo Docker OK!
echo.
echo ========================================
echo MENJALANKAN SEMUA SERVICE...
echo ========================================
echo.
echo - Next.js:    http://localhost:8080
echo - FastAPI:    http://localhost:8000/docs
echo - SQL Server: localhost:1433
echo.
echo Tekan CTRL+C untuk berhenti
echo.

docker-compose up -d

echo.
echo ========================================
echo SERVICE SEDANG RUNNING!
echo ========================================
echo.
echo Tunggu beberapa detik hingga semua service siap...
timeout /t 15 /nobreak

echo.
echo Coba akses:
echo - Next.js: http://localhost:8080
echo - FastAPI: http://localhost:8000/docs

pause
