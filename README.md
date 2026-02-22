# Adidas Sales Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Version-2.0.0-orange" alt="Version">
</p>

---

A comprehensive sales dashboard built with **Next.js 16**, **FastAPI**, and **Supabase**.

## Features

- **Sales Dashboard** - Interactive data visualization with ECharts
- **Analytics** - Filter and analyze sales data by retailer, product, method, city, and month
- **Forecasting** - Sales predictions using Holt-Winters method
- **Data Upload** - Excel/CSV file upload with automatic data cleaning using Polars
- **CRUD Operations** - Manage retailers, users, staff, and transactions

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, ECharts |
| **Backend** | FastAPI (Python) with Polars |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | NextAuth.js |

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/robet31/artavista-sales-dashboard.git
cd artavista-sales-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` with your Supabase configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

For backend, copy `backend-fastapi/.env.example` to `.env`:

```bash
cp backend-fastapi/.env.example backend-fastapi/.env
```

### 4. Run the Application

```bash
npm run dev
```

This will start:
- Frontend at **http://localhost:3000**
- Backend at **http://localhost:8000**

### 5. Access the Dashboard

Open: **http://localhost:3000**

Login credentials (example):
- **Email:** `gm@adidas.id`
- **Password:** `admin123`

---

## 📋 Requirements

| Software | Version | Notes |
|----------|---------|-------|
| **Node.js** | 18+ | [Download](https://nodejs.org/) |
| **Python** | 3.10+ | [Download](https://www.python.org/) |
| **npm** | 9+ | Comes with Node.js |

---

## 📂 Project Structure

```
artavista-sales-dashboard/
├── src/                      # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   └── api/            # API routes
│   ├── components/          # React components
│   │   └── charts/         # ECharts components
│   └── lib/                # Utilities & services
├── backend-fastapi/         # FastAPI backend
│   └── app/
│       ├── routers/        # API endpoints
│       └── main.py         # Entry point
├── .env.example            # Frontend environment template
├── backend-fastapi/.env.example  # Backend environment template
└── README.md               # This file
```

---

## 🔧 Common Issues & Solutions

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### Clean Install

```bash
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend-fastapi
pip install -r requirements.txt
```

---

## 📄 Environment Variables Reference

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `NEXTAUTH_URL` | Yes | Application base URL |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | FastAPI backend URL |

### Backend (backend-fastapi/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase PostgreSQL connection string |
| `APP_NAME` | No | Application name |
| `DEBUG` | No | Debug mode (true/false) |
| `HOST` | No | Server host (default: 127.0.0.1) |
| `PORT` | No | Server port (default: 8000) |
| `CORS_ORIGINS` | No | Allowed CORS origins |

---

## 🔐 Security Notes

1. **Never commit** `.env.local` or `backend-fastapi/.env` files
2. **Change** `NEXTAUTH_SECRET` in production
3. **Update** Supabase credentials for production
4. **Use** HTTPS in production

---

## 📝 License

MIT License - Copyright (c) 2026

---

<div align="center">
  <p>Built with ❤️ using Next.js & FastAPI</p>
</div>
