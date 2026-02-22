@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Adidas Sales Dashboard - Setup
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed. Please install Python from https://python.org/
    exit /b 1
)

echo [1/4] Installing Frontend Dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    exit /b 1
)
echo      Done!
echo.

echo [2/4] Installing Backend Dependencies...
cd backend-fastapi
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    exit /b 1
)
cd ..
echo      Done!
echo.

echo [3/4] Setting up Environment Variables...
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env
        echo      Created .env from .env.example
        echo      Please configure your .env file with your credentials
    ) else (
        echo      Warning: .env.example not found
    )
) else (
    echo      .env already exists
)
echo.

echo [4/4] Generating Prisma Client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [WARNING] Prisma generation failed, but continuing...
)
echo      Done!
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo   To start the application, run:
echo   - npm run dev    (starts both backend and frontend)
echo   - npm start:all  (alternative using Python script)
echo.
echo   Or manually:
echo   - Backend:  cd backend-fastapi ^&^& python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
echo   - Frontend: npm run dev
echo.
echo   Access the dashboard at: http://localhost:3000
echo ========================================
