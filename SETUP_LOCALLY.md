# Artavista Sales Dashboard - Panduan Setup Lokal

## Prerequisites (Instalasi Awal)

Sebelum memulai, pastikan komputer Anda sudah terinstall:

1. **Node.js** (v18 atau lebih tinggi)
   - Download: https://nodejs.org/
   - Cara install: Double click installer, Next > Next > Finish

2. **Python** (v3.10 atau lebih tinggi)
   - Download: https://www.python.org/downloads/
   - ⚠️ IMPORTANT: Saat install, centang "Add Python to PATH"

3. **Git**
   - Download: https://git-scm.com/
   - Biasa semua default saja saat install

---

## Clone Project dari GitHub

Buka terminal/command prompt, lalu jalankan:

```bash
# Clone project
git clone https://github.com/robet31/artavista-sales-dashboard.git

# Masuk ke folder project
cd artavista-sales-dashboard
```

---

## Setup Environment Variables

1. Copy file `.env.example` menjadi `.env.local`:

```bash
# Windows
copy .env.example .env.local

# Mac/Linux
cp .env.example .env.local
```

2. Edit file `.env.local` dan isi dengan konfigurasi Supabase Anda:

```env
# Supabase Configuration (DATABASE ONLINE)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx

# Backend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Database (for FastAPI backend)
DATABASE_URL=postgresql+asyncpg://postgres.xxx:password@aws-xxx.pooler.supabase.com:6543/postgres?pgbouncer=true

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=super-secret-key-change-in-production-123456789

# RAG Configuration
RAG_CONTEXT_TYPE=adidas

# OpenRouter API (for AI features)
OPENROUTER_API_KEY=sk-or-xxxxx
```

⚠️ **PENTING**: Untuk mendapatkan konfigurasi Supabase:
1. Buka https://supabase.com/
2. Login ke project Anda
3. Go to Settings > API
4. Copy URL dan Anon Key

---

## Install Dependencies

```bash
# Install dependencies frontend
npm install
```

---

## Setup Database Supabase

### Cara 1: Menggunakan Seed Script (Recommend)

1. Buka **Supabase Dashboard** > **SQL Editor**
2. Copy semua isi dari file `supabase/seed-users.sql`
3. Paste di SQL Editor dan Run

Ini akan membuat:
- Tabel-tabel yang diperlukan
- User default untuk login

### Cara 2: Manual Setup

1. Buat project di Supabase
2. Run SQL dari `supabase/schema.sql`
3. Run SQL dari `supabase/seed-users.sql`

---

## Menjalankan Aplikasi

### Cara 1: Menjalankan Semua (Frontend + Backend)

```bash
npm run dev
```

Akan menjalankan:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000

### Cara 2: Hanya Frontend (Jika Backend sudah online)

```bash
npm run frontend
```

### Cara 3: Hanya Backend (Python/FastAPI)

```bash
npm run backend
```

---

## Login Credentials

Setelah setup selesai, gunakan akun berikut untuk login:

| Role | Email | Password |
|------|-------|----------|
| **GM (Admin)** | `gm@adidas.id` | `admin123` |
| **Manager Jakarta** | `manager.jakarta@adidas.id` | `admin123` |
| **Manager Surabaya** | `manager.surabaya@adidas.id` | `admin123` |
| **Staff Jakarta** | `staff.jakarta@adidas.id` | `admin123` |
| **Staff Surabaya** | `staff.surabaya@adidas.id` | `admin123` |

---

## Struktur Project

```
artavista-sales-dashboard/
├── src/                    # Source code frontend (Next.js)
│   ├── app/              # Halaman dan API routes
│   │   ├── (dashboard)/  # Halaman dashboard
│   │   └── api/         # API endpoints
│   ├── components/       # Komponen UI
│   └── lib/             # Utility functions
├── backend-fastapi/      # Backend API (Python/FastAPI)
├── public/              # Static assets
├── supabase/            # Database scripts
└── package.json         # Dependencies
```

---

## Troubleshooting

### Error: "Port 3000 already in use"

```bash
# Kill process di port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# atau gunakan port berbeda
npm run dev -- -p 3001
```

### Error: "Module not found"

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Error: "Database connection failed"

1. Cek `.env.local` sudah benar
2. Cek Supabase project masih aktif
3. Cek konfigurasi DATABASE_URL

### Error: "NextAuth"

1. Pastikan `NEXTAUTH_SECRET` ada di `.env.local`
2. Generate secret baru: `openssl rand -base64 32`

---

## Fitur Utama

1. **Dashboard** - Visualisasi data penjualan
2. **Analytics** - Analisis data dengan filter
3. **Upload Data** - Import data dari Excel
4. **Forecasting** - Prediksi penjualan
5. **AI Assistant** - Chatbot untuk insights
6. **Retailer Management** - Kelola retailer (GM only)
7. **Notifications** - Notifikasi real-time dari chat

---

## Support

Jika ada masalah, buat issue di:
https://github.com/robet31/artavista-sales-dashboard/issues
