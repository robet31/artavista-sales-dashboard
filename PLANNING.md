# Pizza Delivery Dashboard - Technical Planning Document

## 1. System Overview

### 1.1 Project Description

**Pizza Delivery Dashboard** adalah aplikasi web untuk monitoring dan analisis data delivery pizza. Sistem ini memungkinkan pengguna untuk mengupload data delivery, melihat visualisasi analytics, dan mengelola user/staff berdasarkan role masing-masing.

### 1.2 Business Context

Sistem ini dirancang untuk:
- Melacak performa delivery beberapa restoran pizza
- Menganalisis faktor-faktor yang mempengaruhi waktu delivery
- Mengelola data delivery dari berbagai sumber (Excel/CSV)
- Memberikan akses berdasarkan role (GM, Admin, Manager, Staff)

---

## 2. Features

### 2.1 Authentication & Authorization

| Feature | Description |
|---------|-------------|
| Login | Username/email dengan password |
| Session Management | JWT token dengan expiry 30 menit |
| Role-based Access | GM, ADMIN_PUSAT, MANAGER, ASISTEN_MANAGER, STAFF |
| Auto Logout | Session timeout setelah 30 menit tidak aktif |

### 2.2 Data Management

| Feature | Description |
|---------|-------------|
| Upload Excel/CSV | Upload file data delivery dengan validasi |
| Data Cleansing | Otomatis membersihkan dan validasi data |
| Manual Mapping | Mapping kolom Excel ke database fields |
| Data Validation | Validasi format, range, dan kelengkapan data |
| Quality Score | Skor kualitas data per upload |

### 2.3 Dashboard & Analytics

| Feature | Description |
|---------|-------------|
| Real-time Charts | Visualisasi data delivery dengan Recharts |
| Orders by Month | Grafik jumlah order per bulan |
| Pizza Size Distribution | Distribusi ukuran pizza |
| Traffic Impact | Analisis dampak lalu lintas terhadap delivery |
| Peak Hours Analysis | Analisis jam sibuk |
| Delivery Performance | Perbandingan on-time vs delayed |
| Payment Methods | Statistik metode pembayaran |
| Weekend vs Weekday | Analisis hari kerja vs akhir pekan |

### 2.4 User Management (GM & Admin Only)

| Feature | Description |
|---------|-------------|
| Create User | Tambah user baru dengan role tertentu |
| Edit User | Ubah data user |
| Deactivate User | Nonaktifkan user |
| Role Assignment | Assign role: GM, ADMIN_PUSAT, MANAGER, STAFF |

### 2.5 Staff Management (Manager+)

| Feature | Description |
|---------|-------------|
| View Staff | Lihat staff per restoran |
| Add Staff | Tambah staff baru |
| Edit Staff | Ubah data staff |
| Assign Restaurant | Assign staff ke restoran tertentu |

### 2.6 Restaurant Management (GM & Admin)

| Feature | Description |
|---------|-------------|
| Create Restaurant | Tambah restoran baru |
| Edit Restaurant | Ubah informasi restoran |
| View Restaurant | Lihat detail restoran |
| Manage Locations | Kelola lokasi restoran |

### 2.7 Settings

| Feature | Description |
|---------|-------------|
| Profile Settings | Ubah nama dan email |
| Password Change | Ganti password |

---

## 3. Tech Stack

### 3.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework dengan App Router |
| **React** | 19.2.3 | UI Library |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **Recharts** | 3.7.0 | Chart visualization |
| **Lucide React** | 0.563.0 | Icon library |
| **React Hook Form** | 7.71.1 | Form management |

### 3.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 16.1.6 | Backend API endpoints |
| **NextAuth.js** | 4.24.13 | Authentication |
| **Prisma** | 5.22.0 | ORM untuk database |
| **bcryptjs** | 3.0.3 | Password hashing |

### 3.3 Database

| Technology | Purpose |
|------------|---------|
| **SQL Server** | Primary database |
| **Prisma Client** | ORM untuk query builder |

---

## 4. Data Flow

### 4.1 Upload Data Flow

```
User Upload Excel/CSV → Client Parse (XLSX) → Data Cleansing → Upsert → Save to DB
```

### 4.2 Authentication Flow

```
Login → Validate Credentials (bcrypt) → Generate JWT → Store Session → Redirect
```

### 4.3 Dashboard Data Flow

```
Dashboard Load → API Charts Route → Query DB (Prisma) → Return JSON → Render Charts
```

---

## 5. Database Schema

### 5.1 Models

#### User
- id, email, password, name, role, position, restaurantId, isActive, createdAt, updatedAt, lastLogin

#### Restaurant  
- id, name, code, location, description, isActive, createdAt, updatedAt

#### DeliveryData
- id, orderId, restaurantId, location, orderTime, deliveryTime, deliveryDuration, orderMonth, orderHour, pizzaSize, pizzaType, toppingsCount, pizzaComplexity, distanceKm, trafficLevel, isPeakHour, isWeekend, paymentMethod, paymentCategory, estimatedDuration, deliveryEfficiency, delayMin, isDelayed, uploadedBy, uploadedAt, qualityScore, version

---

## 6. Environment Variables

```env
DATABASE_URL="sqlserver://localhost:1433;database=pizza_dashboard;user=sa;password=PASS;trustServerCertificate=true"
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-key-min-32-characters
```

---

## 7. API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | NextAuth |
| POST | `/api/register` | Register |
| POST | `/api/upload` | Upload Excel/CSV |
| GET | `/api/dashboard/charts` | Charts data |
| GET | `/api/analytics` | Analytics |
| GET/POST/PUT/DELETE | `/api/users` | User management |
| GET/POST/PUT/DELETE | `/api/staff` | Staff management |
| GET/POST/PUT | `/api/restaurants` | Restaurant management |

---

## 8. Security

- Password Hashing: bcryptjs (salt 12)
- Session: JWT 30 menit
- HTTP-only cookies
- Role-based access control

### Authorization Matrix

| Role | Dashboard | Upload | Analytics | Users | Staff | Restaurants |
|------|-----------|--------|-----------|-------|-------|-------------|
| GM | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| ADMIN_PUSAT | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| MANAGER | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| ASISTEN_MANAGER | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| STAFF | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 9. User Roles

| Role | Description |
|------|-------------|
| **GM** | General Manager - Full access |
| **ADMIN_PUSAT** | Admin Pusat - Full access |
| **MANAGER** | Manager Restoran - Limited per restaurant |
| **ASISTEN_MANAGER** | Asisten Manager - Upload + Analytics |
| **STAFF** | Staff - Upload data only |

---

## 10. Data Cleansing

### Validation Rules
- Order ID: Required, alphanumeric
- Location: Required
- Order Time: Valid datetime
- Pizza Size: Small, Medium, Large, XL
- Distance: Numeric ≥ 0

### Auto Calculation
- orderMonth, orderHour
- isPeakHour (11-13, 17-20)
- isWeekend (Sat/Sun)
- deliveryDuration, delayMin, isDelayed

---

## 11. Installation

### Requirements
- Node.js 18.x/20.x (LTS)
- npm 9.x/10.x
- SQL Server 2019+
- Git 2.x

### Commands
```bash
git clone <repo>
npm install
# Edit .env
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Default Accounts
| Role | Email | Password |
|------|-------|----------|
| GM | gm@pizza.com | password123 |
| ADMIN_PUSAT | admin@pizza.com | password123 |
| MANAGER | manager@dominos.com | password123 |
| ASST_MANAGER | asman@dominos.com | password123 |
| STAFF | staff@dominos.com | password123 |

---

## 12. Project Structure

```
pizza-dashboard/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   └── sunest-logo.png
├── src/
│   ├── app/
│   │   ├── (auth)/login/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── upload/
│   │   │   ├── analytics/
│   │   │   ├── orders/
│   │   │   ├── history/
│   │   │   ├── users/
│   │   │   ├── staff/
│   │   │   ├── restaurants/
│   │   │   └── settings/
│   │   └── api/
│   ├── components/
│   ├── lib/
│   ├── services/
│   └── types/
├── .env
└── package.json
```

---

## 13. Future Enhancements

- Multi-language support (i18n)
- Real-time notifications
- Export reports (PDF/Excel)
- Advanced filtering & search
- Dark mode
- Docker containerization
- API documentation (Swagger)

---

## 14. Conclusion

Pizza Delivery Dashboard adalah sistem monitoring delivery pizza yang komprehensif dengan:
- ✅ Upload dan validasi data otomatis
- ✅ Visualisasi analytics yang kaya
- ✅ Role-based access control yang aman
- ✅ Interface yang user-friendly
- ✅ Tech stack modern dan scalable
