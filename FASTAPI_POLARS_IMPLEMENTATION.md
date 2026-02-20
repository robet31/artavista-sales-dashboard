# Dokumentasi Implementasi FastAPI dan Polars

## Ringkasan Perubahan

Dokumentasi ini menjelaskan semua perubahan dan file baru yang dibuat untuk mengimplementasikan **FastAPI** dan **Polars** dalam project Pizza Dashboard.

---

## 1. STRUKTUR PROJECT BARU

```
Project-Jatim-Stell-Concepts-Planning/
│
├── backend-fastapi/                    # [BARU] FastAPI Backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # Entry point FastAPI
│   │   ├── config.py                    # Konfigurasi aplikasi
│   │   ├── database.py                  # Konfigurasi database SQLAlchemy
│   │   ├── models/
│   │   │   ├── __init__.py              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── restaurant.py
│   │   │   └── delivery_data.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py                  # Pydantic schemas
│   │   │   ├── restaurant.py
│   │   │   └── delivery_data.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── users.py                 # API endpoints untuk users
│   │   │   ├── restaurants.py           # API endpoints untuk restaurants
│   │   │   ├── delivery_data.py         # API endpoints untuk delivery data
│   │   │   └── analytics.py              # API endpoints untuk Polars analytics
│   │   └── services/
│   │       ├── __init__.py
│   │       └── polars_service.py         # Polars data processing service
│   ├── .env                             # Environment variables
│   ├── requirements.txt                 # Python dependencies
│   └── Dockerfile                       # Docker configuration
│
├── src/
│   ├── lib/
│   │   └── polars-service.ts            # [BARU] Polars service untuk Next.js
│   └── app/
│       └── api/
│           └── analytics/
│               └── polars/
│                   └── route.ts          # [BARU] Next.js API route untuk Polars
│
├── package.json                         # [DIUPDATE] Ditambahkan polars dependency
└── docker-compose.yml                   # [DIUPDATE] Ditambahkan FastAPI service

```

---

## 2. DETAIL PERUBAHAN FILE

### 2.1 File Baru: FastAPI Backend

#### **backend-fastapi/requirements.txt**
```text
fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.35
pydantic==2.9.0
pydantic-settings==2.5.0
polars==1.12.0
pyodbc==5.0.1
python-multipart==0.0.12
python-dotenv==1.0.1
openpyxl==3.1.5
xlsx2csv==0.8.2
```

#### **backend-fastapi/app/config.py**
- Konfigurasi aplikasi (database URL, CORS, server settings)
- Menggunakan pydantic-settings untuk environment variables

#### **backend-fastapi/app/database.py**
- Konfigurasi SQLAlchemy untuk SQL Server
- Function `get_db()` untuk dependency injection
- Function `init_db()` untuk inisialisasi database

#### **backend-fastapi/app/models/__init__.py**
- SQLAlchemy models: User, Restaurant, DeliveryData
- Sama dengan schema Prisma yang ada

#### **backend-fastapi/app/schemas/**
- Pydantic schemas untuk validasi request/response
- UserCreate, UserUpdate, UserResponse
- RestaurantCreate, RestaurantUpdate, RestaurantResponse
- DeliveryDataCreate, DeliveryDataUpdate, DeliveryDataResponse

#### **backend-fastapi/app/routers/users.py**
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{id}` - Get user by ID
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

#### **backend-fastapi/app/routers/restaurants.py**
- `POST /api/v1/restaurants` - Create restaurant
- `GET /api/v1/restaurants` - Get all restaurants
- `GET /api/v1/restaurants/{id}` - Get restaurant by ID
- `PUT /api/v1/restaurants/{id}` - Update restaurant
- `DELETE /api/v1/restaurants/{id}` - Delete restaurant

#### **backend-fastapi/app/routers/delivery_data.py**
- `POST /api/v1/delivery-data` - Create delivery data
- `POST /api/v1/delivery-data/bulk` - Bulk create
- `GET /api/v1/delivery-data` - Get delivery data dengan filter
- `GET /api/v1/delivery-data/{id}` - Get by ID
- `PUT /api/v1/delivery-data/{id}` - Update
- `DELETE /api/v1/delivery-data/{id}` - Delete
- `GET /api/v1/delivery-data/stats/summary` - Statistics summary

#### **backend-fastapi/app/routers/analytics.py** (Polars Endpoints)
- `POST /api/v1/analytics/upload-excel` - Upload dan preview Excel
- `POST /api/v1/analytics/upload-excel/clean` - Upload dan bersihkan data
- `POST /api/v1/analytics/analyze/summary` - Sales summary
- `POST /api/v1/analytics/analyze/delivery-performance` - Delivery performance
- `POST /api/v1/analytics/analyze/orders-by-hour` - Orders per jam
- `POST /api/v1/analytics/analyze/orders-by-month` - Orders per bulan
- `POST /api/v1/analytics/analyze/traffic` - Traffic analysis
- `POST /api/v1/analytics/analyze/pizza` - Pizza analysis
- `POST /api/v1/analytics/analyze/payment` - Payment method analysis
- `POST /api/v1/analytics/analyze/full` - Full analysis (semua metrics)

#### **backend-fastapi/app/services/polars_service.py**
- Service class untuk data processing dengan Polars
- Methods untuk membaca Excel/CSV, cleaning, analisis

#### **backend-fastapi/app/main.py**
- Entry point FastAPI application
- Konfigurasi CORS
- Include semua routers

#### **backend-fastapi/Dockerfile**
- Docker image untuk FastAPI
- Install ODBC driver untuk SQL Server

---

### 2.2 File Baru: Next.js Integration

#### **src/lib/polars-service.ts**
- Polars service untuk Next.js (TypeScript)
- Static methods untuk analisis data
- Compatible dengan Polars JavaScript/TypeScript

#### **src/app/api/analytics/polars/route.ts**
- Next.js API Route untuk Polars analytics
- POST handler untuk upload dan analisis file Excel
- Support berbagai tipe analisis

---

### 2.3 File yang Diupdate

#### **package.json**
- Ditambahkan dependency `"polars": "^1.12.0"`

#### **docker-compose.yml**
- Ditambahkan service `fastapi` untuk Approach 2
- Port 8000 untuk FastAPI
- Environment variables untuk database connection

---

## 3. DUA PENDEKATAN IMPLEMENTASI

### **APPROACH 1: Polars Langsung di Next.js**

```
┌─────────────────────────────────────────────────────────────┐
│                     NEXT.JS (Port 3000)                    │
│                                                             │
│   ┌─────────────────────┐     ┌─────────────────────────┐ │
│   │   Frontend Pages    │     │   API Routes            │ │
│   │   /dashboard        │     │   /api/analytics/polars │ │
│   │   /upload           │────▶│   (Gunakan Polars.js)   │ │
│   │   /reports          │     │                         │ │
│   └─────────────────────┘     └─────────────────────────┘ │
│                                                             │
│   Polars.js (TypeScript)                                   │
│   src/lib/polars-service.ts                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   SQL Server        │
                    │   (Port 1433)       │
                    └─────────────────────┘
```

**Kelebihan:**
- Tidak perlu setup backend terpisah
- Lebih sederhana untuk development
- Semua berjalan di Next.js

**Kekurangan:**
- Polars.js tidak seguaing Polars Python
- Tidak cocok untuk processing data besar

---

### **APPROACH 2: FastAPI Terpisah (Monorepo dengan Docker)**

```
┌─────────────────────────────────────────────────────────────┐
│                  DOCKER COMPOSE                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Next.js    │  │   FastAPI    │  │   SQL Server      │ │
│  │  Port 8080   │  │  Port 8000   │  │   Port 1433       │ │
│  │              │  │              │  │                  │ │
│  │  (Frontend)  │  │  (Backend)   │  │  (Database)       │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│         │                │                   │             │
│         └────────────────┴───────────────────┘             │
│                     Jaringan Internal                       │
└─────────────────────────────────────────────────────────────┘
```

**Kelebihan:**
- Polars Python penuh (lebih cepat dan powerful)
- Backend terpisah dari frontend
- Lebih scalable
- REST API yang bisa digunakan oleh aplikasi lain

**Kekurangan:**
- Perlu setup dan maintenance lebih banyak
- Perlu komunikasi antar service

---

## 4. CARA MENJALANKAN

### **Approach 1: Polars di Next.js Saja**

```bash
# Install dependencies
npm install polars

# Jalankan Next.js
npm run dev
```

Akses Polars API di: `http://localhost:3000/api/analytics/polars`

---

### **Approach 2: Full Stack dengan FastAPI**

```bash
# Install dependencies FastAPI
cd backend-fastapi
pip install -r requirements.txt

# Jalankan dengan Docker Compose
docker-compose up -d

# Atau jalankan FastAPI secara manual
cd backend-fastapi
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Akses:**
- Next.js: `http://localhost:8080`
- FastAPI: `http://localhost:8000`
- FastAPI Docs: `http://localhost:8000/docs`

---

## 5. AKSES DATABASE DENGAN DATABASE CLIENT EXTENSION

**YA, BISA!**

Extension Database Client tetap bisa digunakan untuk mengakses database, tidak tergantung pada framework yang digunakan:

```
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE CLIENT EXTENSION                  │
│                      (VS Code)                              │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │  Connection:                                         │  │
│   │  Server: localhost:1433                             │  │
│   │  Database: PizzaDB                                  │  │
│   │  Username: sa                                        │  │
│   │  Password: PizzaAdmin123!                           │  │
│   │  Driver: ODBC Driver 17 for SQL Server              │  │
│   └─────────────────────────────────────────────────────┘  │
│                                                             │
│   │                                                       │  │
│   ▼                                                       ▼  │
│   ┌──────────────────┐   ┌──────────────────────────────┐ │
│   │   SQL Server     │◀──│ Next.js API Routes           │ │
│   │   (Port 1433)    │   │   (Port 8080)                 │ │
│   │                  │   │                              │ │
│   │                  │◀──│ FastAPI                      │ │
│   │                  │   │   (Port 8000)                │ │
│   └──────────────────┘   └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. API ENDPOINTS LENGKAP

### FastAPI (Port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| GET | `/docs` | Interactive API documentation |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users` | Get all users |
| GET | `/api/v1/users/{id}` | Get user by ID |
| PUT | `/api/v1/users/{id}` | Update user |
| DELETE | `/api/v1/users/{id}` | Delete user |
| POST | `/api/v1/restaurants` | Create restaurant |
| GET | `/api/v1/restaurants` | Get all restaurants |
| GET | `/api/v1/restaurants/{id}` | Get restaurant by ID |
| PUT | `/api/v1/restaurants/{id}` | Update restaurant |
| DELETE | `/api/v1/restaurants/{id}` | Delete restaurant |
| POST | `/api/v1/delivery-data` | Create delivery data |
| POST | `/api/v1/delivery-data/bulk` | Bulk create |
| GET | `/api/v1/delivery-data` | Get with filters |
| GET | `/api/v1/delivery-data/stats/summary` | Statistics |
| POST | `/api/v1/analytics/upload-excel` | Upload Excel |
| POST | `/api/v1/analytics/analyze/full` | Full analysis |

### Next.js API (Port 3000/8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analytics/polars` | Polars analysis |
| GET | `/api/analytics/polars` | API info |

---

## 7. CONTOH PENGGUNAAN

### Upload dan Analisis dengan FastAPI

```bash
# Upload dan analisis lengkap
curl -X POST http://localhost:8000/api/v1/analytics/analyze/full \
  -F "file=@data.xlsx"

# Upload dan lihat summary
curl -X POST http://localhost:8000/api/v1/analytics/analyze/summary \
  -F "file=@data.xlsx"
```

### Upload dan Analisis dengan Next.js

```typescript
// Di frontend Next.js
const formData = new FormData();
formData.append('file', file);
formData.append('analysisType', 'full');

const response = await fetch('/api/analytics/polars', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.data);
```

---

## 8. FITUR POLARS

### Sales Summary
- Total orders
- Total revenue
- Average order value
- Min/Max order

### Delivery Performance
- Total deliveries
- On-time deliveries
- Delayed deliveries
- Delay rate percentage

### Analytics
- Orders by hour
- Orders by month
- Traffic level analysis
- Pizza type analysis
- Payment method analysis

---

## 9. CATATAN PENTING

1. **LSP Errors**: Error di editor karena Python packages belum terinstall. Ini normal dan akan hilang setelah `pip install -r requirements.txt`

2. **Database**: FastAPI dan Next.js menggunakan database yang sama (SQL Server)

3. **CORS**: Dikonfigurasi untuk mengizinkan request dari localhost:3000 dan localhost:8080

4. **Documentation**: FastAPI menyediakan auto-generated documentation di `/docs` (Swagger) dan `/redoc` (ReDoc)

---

## 10. KESIMPULAN

| Aspek | Approach 1 (Next.js saja) | Approach 2 (FastAPI) |
|-------|---------------------------|---------------------|
| Setup | Lebih mudah | Lebih kompleks |
| Performa Polars | Polars.js (lebih lambat) | Polars Python (lebih cepat) |
| Skalabilitas | Sedang | Tinggi |
| Maintainability | Lebih simple | Perlu effort lebih |
| Cocok untuk | Prototyping, small data | Production, big data |

**Rekomendasi**: Gunakan Approach 2 (FastAPI) untuk production dan data processing yang intensif. Gunakan Approach 1 untuk prototyping dan development awal.
