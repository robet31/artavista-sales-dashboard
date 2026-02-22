# Artavista Sales Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Version-2.0.0-orange" alt="Version">
</p>

---

A comprehensive sales dashboard built with **Next.js 16**, **FastAPI**, **Supabase**, and **Prisma**.

## Features

- **Sales Analytics** - Real-time sales data visualization with interactive charts
- **Forecasting** - AI-powered sales predictions with collapsible insights
- **Data Upload** - Excel/CSV file upload support with automatic parsing
- **RAG-powered Insights** - Intelligent analytics using contextual AI
- **Upload History** - Public access to view upload history

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, Recharts |
| **Backend** | FastAPI (Python) |
| **Database** | SQLite with Prisma ORM |
| **Storage** | Supabase |
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

This will automatically:
- Install frontend dependencies (node_modules)
- Install backend dependencies (Python)
- Generate Prisma client
- Create SQLite database

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Database (auto-configured for local SQLite)
DATABASE_URL="file:./prisma/dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars

# RAG Configuration
RAG_CONTEXT_TYPE=adidas

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 4. Run the Application

#### Option A: Run Both Services Together (Recommended)

```bash
# Windows
python start-all.py

# Mac/Linux
python3 start-all.py
```

#### Option B: Run Separately

**Terminal 1 - Backend:**
```bash
cd backend-fastapi
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Access the Dashboard

Open: **http://localhost:3000**

Login credentials:
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
│   ├── components/          # React components
│   │   ├── auth/           # Authentication components
│   │   ├── dashboard/      # Dashboard components
│   │   └── ui/             # UI components
│   └── lib/                # Utilities & services
├── backend-fastapi/         # FastAPI backend
│   └── app/
│       ├── routers/         # API endpoints
│       └── main.py          # Entry point
├── prisma/                  # Database schema
│   └── schema.prisma
├── public/                  # Static assets
├── start-all.py            # Start both services
├── .env.example            # Environment template
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

### Database Issues

```bash
npx prisma db push
npx prisma db seed
```

### Clean Install

```bash
rm -rf node_modules package-lock.json
npm install
```

### Python Module Not Found

```bash
cd backend-fastapi
pip install -r requirements.txt
```

---

## 📄 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key |
| `DATABASE_URL` | Yes | Prisma database connection |
| `NEXTAUTH_URL` | Yes | Application base URL |
| `NEXTAUTH_SECRET` | Yes | Random string for JWT (min 32 chars) |
| `RAG_CONTEXT_TYPE` | No | Context type for RAG (default: adidas) |
| `NEXT_PUBLIC_BACKEND_URL` | Yes | FastAPI backend URL |

---

## 🔐 Security Notes

1. **Never commit** `.env.local` or `.env` files
2. **Change** `NEXTAUTH_SECRET` in production
3. **Update** Supabase credentials for production
4. **Use** HTTPS in production

---

## 📝 License

MIT License - Copyright (c) 2026 Artavista

---

<div align="center">
  <p>Built with ❤️ using Next.js & FastAPI</p>
</div>
