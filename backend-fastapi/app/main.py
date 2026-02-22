from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .routers import adidas_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="""
    Adidas Sales Dashboard API - Backend services untuk aplikasi manajemen penjualan Adidas.
    
    ## Features:
    - **Data Upload** - Upload dan cleaning data Excel menggunakan Polars
    - **Preview** - Preview data sebelum upload
    
    ## Tech Stack:
    - FastAPI (Python web framework)
    - Polars (Data processing)
    - Supabase (Database)
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
app.include_router(adidas_router)

# Run with: uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
