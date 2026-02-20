from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .routers import (
    users_router,
    restaurants_router,
    delivery_data_router,
    analytics_router,
    export_clean_router,
    forecasting_router,
    recommendation_router,
    analytics_data_router,
)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Pizza Restaurant API - Backend services untuk aplikasi manajemen restoran pizza.
    
    ## Features:
    - **Users Management** - CRUD untuk data user/staff
    - **Restaurants Management** - CRUD untuk data restoran
    - **Delivery Data** - CRUD dan analisis data pengiriman pizza
    - **Analytics** - Analisis data menggunakan Polars
    
    ## Tech Stack:
    - FastAPI (Python web framework)
    - SQLAlchemy (ORM)
    - Polars (Data processing)
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
        "redoc": "/redoc",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app_name": settings.app_name,
        "version": settings.app_version,
    }


# Include routers
app.include_router(users_router, prefix="/api/v1/users", tags=["Users"])

app.include_router(
    restaurants_router, prefix="/api/v1/restaurants", tags=["Restaurants"]
)

app.include_router(
    delivery_data_router, prefix="/api/v1/delivery-data", tags=["Delivery Data"]
)

app.include_router(
    analytics_router, prefix="/api/v1/analytics", tags=["Analytics - Polars"]
)

app.include_router(
    export_clean_router, prefix="/api/v1/export-clean", tags=["Export & Clean"]
)

app.include_router(
    forecasting_router, prefix="/api/v1/forecasting", tags=["Forecasting"]
)

app.include_router(
    recommendation_router, prefix="/api/v1/recommendation", tags=["Recommendation"]
)

app.include_router(
    analytics_data_router, prefix="/api/v1/analytics-data", tags=["Analytics Data"]
)


# Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
