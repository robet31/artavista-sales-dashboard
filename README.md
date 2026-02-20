# Pizza Dashboard - Sunest Systems Delivery Monitoring

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange" alt="Version">
</p>

---

## 🏢 Tentang Project

**Pizza Dashboard** adalah aplikasi web untuk monitoring dan analisis data delivery pizza yang dikembangkan oleh **PT Sunest Solutions**.

Project ini dirancang untuk:
- Melacak performa delivery beberapa restoran pizza
- Menganalisis faktor-faktor yang mempengaruhi waktu delivery
- Mengelola data delivery dari berbagai sumber (Excel/CSV)
- Memberikan akses berbasis role (GM, Admin, Manager, Staff)

---

## 👥 Tim Pengembang

| Nama | Peran | Divisi |
|------|-------|--------|
| **Ar'raffi Abqori Nur Azizi** | Director | Project Manager |
| **Vikas Irman Wschaft** | CEO | Business Intelligence/Understanding |

---

## 🌐 PT Sunest Solutions

Kami adalah perusahaan teknologi yang专注于 pengembangan solusi digital untuk bisnis.

**Linktree Portfolio:** https://linktr.ee/SunestAuto

---

## ⚙️ Requirements / Prasyarat

### 1. Software yang Diperlukan

| Software | Versi Minimum | Keterangan |
|----------|---------------|-------------|
| **Node.js** | 18.x atau 20.x (LTS) | Runtime JavaScript |
| **npm** | 9.x atau 10.x | Package manager |
| **SQL Server** | 2019 atau lebih baru | Database server |
| **Git** | 2.x | Version control |

### 2. Installasi Node.js

Download Node.js dari: https://nodejs.org/

Pilih LTS version (disarankan Node.js 20.x)

Verifikasi installasi:
```bash
node --version
npm --version
```

### 3. Installasi SQL Server (Windows)

1. Download SQL Server Express dari: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Atau gunakan SQL Server yang sudah ada
3. Buat database baru dengan nama: `pizza_dashboard`

### 4. Installasi SQL Server (Linux/Ubuntu)

```bash
# Install SQL Server
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
curl https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/mssql-server-2022.list | sudo tee /etc/apt/sources.list.d/mssql-server-2022.list
sudo apt-get update
sudo apt-get install -y mssql-server

# Run SQL Server
sudo /opt/mssql/bin/mssql-conf setup
```

---

## 📦 Environment Variables

Buat file `.env` di root folder dengan isi:

```env
# ===========================================
# DATABASE CONFIGURATION
# ===========================================
# SQL Server Connection String
# Format: sqlserver://host:port;database=name;user=username;password=password;trustServerCertificate=true

DATABASE_URL="sqlserver://localhost:1433;database=pizza_dashboard;user=sa;password=YOUR_PASSWORD;trustServerCertificate=true"

# ===========================================
# NEXTAUTH CONFIGURATION
# ===========================================
# URL untuk NextAuth (Ganti dengan domain production)
NEXTAUTH_URL=http://localhost:3001

# Secret key untuk encrypt JWT session
# BIKAN CONTOH - GENERATE RANDOM STRING MIN 32 KARAKTER!
NEXTAUTH_SECRET=super-secret-key-change-in-production-123456789
```

### Penjelasan Environment Variables

| Variable | Required | Description | Contoh |
|----------|----------|-------------|---------|
| `DATABASE_URL` | ✅ | SQL Server connection string | `sqlserver://localhost:1433;database=pizza_dashboard;user=sa;password=PASS;trustServerCertificate=true` |
| `NEXTAUTH_URL` | ✅ | Base URL aplikasi | `http://localhost:3001` atau `https://domain.com` |
| `NEXTAUTH_SECRET` | ✅ | Random string untuk JWT encryption | Minimal 32 karakter acak |

---

## 🚀 Instalasi Project

### 1. Clone Repository

```bash
git clone https://github.com/robet31/Project-Jatim-Stell-Concepts-Planning.git
cd pizza-dashboard
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Buat file `.env` di root folder sesuai dengan section di atas.

### 4. Setup Database

#### Generate Prisma Client:
```bash
npm run db:generate
```

#### Push Schema ke Database:
```bash
npm run db:push
```

#### (Opsional) Seed Data Awal:
```bash
npm run db:seed
```

### 5. Jalankan Aplikasi

```bash
npm run dev
```

Buka http://localhost:3001 di browser

---

## 👤 Akun Default (Setelah Seed)

| Role | Email | Password |
|------|-------|----------|
| GM | gm@sunest.com | gm123 |
| ADMIN_PUSAT | admin@sunest.com | admin123 |
| MANAGER | manager@sunest.com | manager123 |
| STAFF | staff@sunest.com | staff123 |

**⚠️ Ganti password default setelah login pertama!**

---

## 🎯 Fitur Utama

1. **Authentication** - Login/Register dengan role-based access
2. **Upload Data** - Upload file Excel/CSV untuk data delivery
3. **Dashboard** - Visualisasi data delivery dengan charts
4. **Manajemen User** - Tambah/edit user (GM & Admin)
5. **Manajemen Staff** - Kelola staff per restaurant
6. **Analitik** - Charts dan analytics delivery
7. **Riwayat** - History upload dan perubahan data
8. **Settings** - Pengaturan profil dan password

---

## 🔐 Role & Akses

| Role | Dashboard | Upload | Analytics | Users | Staff | Restaurants | Settings |
|------|-----------|--------|-----------|-------|-------|-------------|----------|
| GM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN_PUSAT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ |
| ASISTEN_MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| STAFF | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Keamanan

1. **Password di-hash** menggunakan bcrypt (salt rounds 12)
2. **Session** menggunakan JWT dengan expiry 30 menit
3. **Middleware** melindungi route yang memerlukan auth
4. **API routes** menggunakan authorization check
5. **Input validation** di semua form
6. **HTTP-only cookies** untuk session storage

---

## 💻 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **CSS**: Tailwind CSS 4
- **Charts**: Recharts
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Runtime**: Next.js API Routes
- **Auth**: NextAuth.js 4
- **ORM**: Prisma 5
- **Database**: SQL Server 2019+

### Development
- **Language**: TypeScript
- **Linting**: ESLint
- **Package Manager**: npm

---

## 📂 Struktur Project

```
pizza-dashboard/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── seed.ts           # Seed data
│   └── dev.db            # SQLite dev database
├── public/
│   ├── sunest-logo.png   # Logo aplikasi
│   └── ...
├── src/
│   ├── app/
│   │   ├── (auth)/       # Auth pages
│   │   │   └── login/    # Login page
│   │   ├── (dashboard)/  # Dashboard pages
│   │   │   ├── page.tsx      # Main dashboard
│   │   │   ├── upload/       # Upload page
│   │   │   ├── analytics/    # Analytics page
│   │   │   ├── orders/      # Orders page
│   │   │   ├── history/     # History page
│   │   │   ├── users/       # User management
│   │   │   ├── staff/       # Staff management
│   │   │   ├── restaurants/ # Restaurant management
│   │   │   └── settings/    # Settings page
│   │   └── api/            # API routes
│   ├── components/         # React components
│   │   ├── auth/          # Auth components
│   │   ├── charts/        # Chart components
│   │   ├── dashboard/     # Dashboard components
│   │   └── ui/            # UI components
│   ├── lib/               # Utility functions
│   │   ├── auth.ts        # NextAuth config
│   │   ├── db.ts          # Prisma client
│   │   └── utils.ts       # Utils
│   ├── services/          # Services
│   │   └── cleansing.ts   # Data cleansing
│   └── types/             # TypeScript types
├── .env                   # Environment variables (jangan di-commit)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── next.config.ts         # Next.js config
├── Dockerfile              # Docker configuration
├── docker-compose.yml      # Docker Compose
└── README.md              # Dokumentasi
```

---

## 🐳 Docker (Optional)

### Build Docker Image

```bash
docker build -t pizza-dashboard .
```

### Run dengan Docker Compose

```bash
docker-compose up -d
```

---

## 🔧 Troubleshooting

### Error: Cannot connect to database
- Pastikan SQL Server running
- Cek credentials di `.env`
- Cek port 1433 tidak diblock firewall

### Error: Prisma Client not generated
```bash
npm run db:generate
```

### Error: Port already in use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3001
kill -9 <PID>
```

### Clear cache dan rebuild
```bash
rm -rf .next
rm -rf node_modules/.prisma
npm run db:generate
npm run dev
```

---

## 📋 Changelog

### v1.0.0 (2026-02-14)
- Initial release
- Authentication dengan NextAuth.js
- Upload Excel/CSV dengan validasi
- Dashboard dengan charts (Recharts)
- Role-based access control
- User & Staff management
- Restaurant management
- Docker support

---

## 📄 Lisensi

MIT License - Copyright (c) 2026 PT Sunest Solutions

---

## 📞 Kontak

**PT Sunest Solutions**
- Website: https://linktr.ee/SunestAuto
- Email: info@sunest.id

---

<div align="center">
  <p>Developed with ❤️ by PT Sunest Solutions</p>
  <p>© 2026 PT Sunest Solutions - All Rights Reserved</p>
</div>
