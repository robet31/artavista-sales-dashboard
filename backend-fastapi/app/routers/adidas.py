from fastapi import APIRouter, UploadFile, File, HTTPException
import polars as pl
from app.services.adidas_cleaning import AdidasCleaningService
from supabase import create_client
import os

router = APIRouter(prefix="/api/v1/adidas", tags=["Adidas Data"])

# Supabase client
supabase_url = os.getenv(
    "NEXT_PUBLIC_SUPABASE_URL", "https://qtohyurcuetghfyattil.supabase.co"
)
supabase_key = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0b2h5dXJjdWV0Z2hmeWF0dGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjU5OTAsImV4cCI6MjA4NzE0MTk5MH0.NeM8dK--pGZMvGjNRAjD_yk4C_kEgiUT_2-qjI_otWg",
)
supabase = create_client(supabase_url, supabase_key)


@router.post("/preview")
async def preview_adidas_excel(
    file: UploadFile = File(...),
):
    """
    Preview dan cleaning cepat data Excel Adidas (PAKAI POLARS - SANGAT CEPAT)
    - Reads Excel file
    - Cleans data using Polars
    - Returns preview tanpa simpan ke database
    """
    try:
        # Validate file type
        if not file.filename.endswith((".xlsx", ".xls")):
            raise HTTPException(400, "File harus berupa Excel (.xlsx atau .xls)")

        # Process with cleaning service - no DB needed for preview
        cleaning_service = AdidasCleaningService(db=None)
        cleaned_df = await cleaning_service.process_excel(file)

        # Get preview data (first 20 rows)
        preview_data = cleaned_df.head(20).to_dicts()

        # Get statistics
        total_rows = len(cleaned_df)

        # Calculate valid rows (rows with total_sales > 0)
        valid_rows = len(cleaned_df.filter(pl.col("Total Sales") > 0))

        return {
            "status": "success",
            "preview": preview_data,
            "total_rows": total_rows,
            "valid_rows": valid_rows,
            "invalid_rows": total_rows - valid_rows,
            "columns": cleaned_df.columns,
        }

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.post("/upload")
async def upload_adidas_excel(
    file: UploadFile = File(...),
):
    """
    Upload dan process data Excel Adidas
    - Reads Excel file
    - Cleans data using Polars (SANGAT CEPAT)
    - Saves to Supabase
    """
    try:
        # Validate file type
        if not file.filename.endswith((".xlsx", ".xls")):
            raise HTTPException(400, "File harus berupa Excel (.xlsx atau .xls)")

        # Process with cleaning service
        cleaning_service = AdidasCleaningService(db=None)
        cleaned_df = await cleaning_service.process_excel(file)

        # Get mapping from Supabase
        cities = supabase.table("city").select("id_city, city").execute().data or []
        city_map = {c["city"]: c["id_city"] for c in cities}

        methods = (
            supabase.table("method").select("id_method, method").execute().data or []
        )
        method_map = {m["method"]: m["id_method"] for m in methods}

        products = (
            supabase.table("product").select("id_product, product").execute().data or []
        )
        product_map = {p["product"]: p["id_product"] for p in products}

        retailers = (
            supabase.table("retailer")
            .select("id_retailer, retailer_name")
            .execute()
            .data
            or []
        )
        retailer_map = {r["retailer_name"]: r["id_retailer"] for r in retailers}

        # Transform to transactions
        transactions = []
        for row in cleaned_df.to_dicts():
            city_name = row.get("City", "")
            product_name = row.get("Product", "")
            retailer_name = row.get("Retailer", "")
            method_name = row.get("Sales Method", "")

            city_id = city_map.get(city_name) or city_map.get(city_name.title()) or 1
            product_id = product_map.get(product_name) or 1
            retailer_id = retailer_map.get(retailer_name) or 1
            method_id = method_map.get(method_name)

            invoice_date = row.get("Invoice Date")
            if invoice_date:
                if hasattr(invoice_date, "isoformat"):
                    invoice_date = invoice_date.isoformat()
                elif isinstance(invoice_date, str):
                    invoice_date = invoice_date[:10]

            transaction = {
                "id_city": city_id,
                "id_product": product_id,
                "id_retailer": retailer_id,
                "id_method": method_id,
                "invoice_date": invoice_date,
                "price_per_unit": row.get("Price per Unit", 0) or 0,
                "unit_sold": int(float(row.get("Units Sold", 1) or 1)),
                "total_sales": row.get("Total Sales", 0) or 0,
                "operating_profit": row.get("Operating Profit", 0) or 0,
                "operating_margin": row.get("Operating Margin", 0) or 0,
            }

            if transaction["total_sales"] > 0:
                transactions.append(transaction)

        # Save to Supabase in batches
        saved_count = 0
        batch_size = 100
        for i in range(0, len(transactions), batch_size):
            batch = transactions[i : i + batch_size]
            result = supabase.table("transaction").insert(batch).execute()
            if result.data:
                saved_count += len(batch)

        return {
            "status": "success",
            "message": f"Berhasil upload {saved_count} data",
            "total_processed": len(transactions),
            "saved": saved_count,
        }

    except Exception as e:
        raise HTTPException(500, f"Error: {str(e)}")


@router.get("/test")
async def test_endpoint():
    """Test endpoint"""
    return {"status": "ok", "message": "Adidas API is running"}
