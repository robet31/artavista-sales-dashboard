#!/bin/bash

echo "========================================"
echo "  Adidas Sales Dashboard - Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python &> /dev/null; then
    echo "[ERROR] Python is not installed. Please install Python from https://python.org/"
    exit 1
fi

echo "[1/4] Installing Frontend Dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install frontend dependencies"
    exit 1
fi
echo "     Done!"
echo ""

echo "[2/4] Installing Backend Dependencies..."
cd backend-fastapi
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install backend dependencies"
    exit 1
fi
cd ..
echo "     Done!"
echo ""

echo "[3/4] Setting up Environment Variables..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "     Created .env from .env.example"
        echo "     Please configure your .env file with your credentials"
    else
        echo "     Warning: .env.example not found"
    fi
else
    echo "     .env already exists"
fi
echo ""

echo "[4/4] Generating Prisma Client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "[WARNING] Prisma generation failed, but continuing..."
fi
echo "     Done!"
echo ""

echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "  To start the application, run:"
echo "  - npm run dev    (starts both backend and frontend)"
echo "  - npm start:all  (alternative using Python script)"
echo ""
echo "  Or manually:"
echo "  - Backend:  cd backend-fastapi && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "  - Frontend: npm run dev"
echo ""
echo "  Access the dashboard at: http://localhost:3000"
echo "========================================"
