@echo off
echo ========================================
echo   MENJALANKAN FASTAPI - PIZZA DASHBOARD
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Menginstall dependencies...
pip install --user fastapi uvicorn sqlalchemy pydantic pydantic-settings polars python-multipart python-dotenv email-validator 2>nul

echo.
echo [2/3] Menjalankan server FastAPI...
echo.
echo Akses API di: http://127.0.0.1:8000/docs
echo.
echo Tekan CTRL+C untuk berhenti
echo.

python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

pause
