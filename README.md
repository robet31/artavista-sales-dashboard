# Artavista Sales Dashboard

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Version-2.0.0-orange" alt="Version">
</p>

---

Aplikasi Sales Monitoring Dashboard berbasis web yang dibangun dengan **Next.js 16**, **FastAPI**, dan **Supabase**.

## ✨ Fitur Utama

- **Dashboard** - Visualisasi data penjualan interaktif dengan ECharts
- **Analytics** - Filter dan analisis data berdasarkan retailer, produk, metode, kota, dan bulan
- **Forecasting** - Prediksi penjualan menggunakan metode Holt-Winters
- **Upload Data** - Import file Excel dengan automatic data cleaning menggunakan Polars
- **AI Assistant** - Chatbot untuk mendapatkan insights dari data
- **CRUD Operations** - Kelola retailer, user, staff, dan transaksi
- **Notifications** - Notifikasi real-time dari chat AI

## 🛠️ Teknologi

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, Tailwind CSS 4, ECharts |
| **Backend** | FastAPI (Python) with Polars |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | NextAuth.js |

---

## 🚀 Cara Clone dan Run di Lokal

### 1. Clone Project

```bash
git clone https://github.com/robet31/artavista-sales-dashboard.git
cd artavista-sales-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

```bash
# Copy file contoh
copy .env.example .env.local    # Windows
# cp .env.example .env.local   # Mac/Linux
```

Edit `.env.local` dengan konfigurasi Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
DATABASE_URL=postgresql+asyncpg://postgres.xxx:password@xxx.supabase.com:6543/postgres?pgbouncer=true
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-change-in-production-123456789
RAG_CONTEXT_TYPE=adidas
OPENROUTER_API_KEY=sk-or-xxxxx
```

### 4. Setup Database Supabase

1. Buka **Supabase Dashboard** > **SQL Editor**
2. Copy isi dari `supabase/seed-users.sql`
3. Paste dan Run

### 5. Run Aplikasi

```bash
npm run dev
```

Buka: **http://localhost:3000**

---

## 🔑 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **GM (Admin)** | `gm@adidas.id` | `admin123` |
| **Manager** | `manager.jakarta@adidas.id` | `admin123` |
| **Staff** | `staff.jakarta@adidas.id` | `admin123` |

---

## 📋 Requirements

| Software | Version | Notes |
|----------|---------|-------|
| **Node.js** | 18+ | [Download](https://nodejs.org/) |
| **Python** | 3.10+ | [Download](https://www.python.org/) |
| **npm** | 9+ | Comes with Node.js |

---

## 📂 Struktur Project

```
artavista-sales-dashboard/
├── src/                      # Next.js frontend
│   ├── app/                 # App router pages
│   │   ├── (dashboard)/    # Dashboard pages
│   │   └── api/            # API routes
│   ├── components/          # React components
│   └── lib/                # Utilities & services
├── backend-fastapi/         # FastAPI backend
├── public/                  # Static assets
├── supabase/               # Database scripts
├── SETUP_LOCALLY.md        # Panduan setup lengkap
└── README.md               # This file
```

---

## ❓ Troubleshooting

### Port Already in Use

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Reinstall Dependencies

```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🔐 Catatan Keamanan

1. **Jangan pernah commit** file `.env.local` ke GitHub
2. **Ganti** `NEXTAUTH_SECRET` di environment production
3. **Gunakan** HTTPS saat production

---

## 📝 License

MIT License - Copyright (c) 2026

---

<div align="center">
  <p>Built with ❤️ using Next.js & FastAPI</p>
</div>
