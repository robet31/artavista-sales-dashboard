from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional
from ..services.polars_service import PolarsDataProcessor

router = APIRouter()


@router.post("/popular-items")
async def recommend_popular_items(
    file: UploadFile = File(...),
    item_column: str = Query(..., description="Nama kolom item"),
    n: int = Query(10, description="Jumlah rekomendasi"),
):
    """Rekomendasi item paling populer"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv", ".parquet", ".json")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung")

    try:
        contents = await file.read()

        if file.filename.endswith((".xlsx", ".xls")):
            df = PolarsDataProcessor.read_excel_file(contents)
        elif file.filename.endswith(".csv"):
            df = PolarsDataProcessor.read_csv_file(contents)
        elif file.filename.endswith(".parquet"):
            df = PolarsDataProcessor.read_parquet_file(contents)
        elif file.filename.endswith(".json"):
            df = PolarsDataProcessor.read_json_file(contents)
        else:
            raise HTTPException(status_code=400, detail="Format tidak didukung")

        result = PolarsDataProcessor.recommend_popular_items(
            df=df,
            item_column=item_column,
            n=n,
        )

        return {
            "success": True,
            "recommendations": result,
            "method": "Popular Items",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/by-category")
async def recommend_by_category(
    file: UploadFile = File(...),
    category_column: str = Query(..., description="Nama kolom kategori"),
    item_column: str = Query(..., description="Nama kolom item"),
    n: int = Query(5, description="Jumlah rekomendasi per kategori"),
):
    """Rekomendasi berdasarkan kategori"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv", ".parquet", ".json")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung")

    try:
        contents = await file.read()

        if file.filename.endswith((".xlsx", ".xls")):
            df = PolarsDataProcessor.read_excel_file(contents)
        elif file.filename.endswith(".csv"):
            df = PolarsDataProcessor.read_csv_file(contents)
        elif file.filename.endswith(".parquet"):
            df = PolarsDataProcessor.read_parquet_file(contents)
        elif file.filename.endswith(".json"):
            df = PolarsDataProcessor.read_json_file(contents)
        else:
            raise HTTPException(status_code=400, detail="Format tidak didukung")

        result = PolarsDataProcessor.recommend_by_category(
            df=df,
            category_column=category_column,
            item_column=item_column,
            n=n,
        )

        return {
            "success": True,
            "recommendations": result,
            "method": "By Category",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/frequently-bought-together")
async def recommend_frequently_bought_together(
    file: UploadFile = File(...),
    order_id_column: str = Query(..., description="Nama kolom ID pesanan"),
    item_column: str = Query(..., description="Nama kolom item"),
    n: int = Query(5, description="Jumlah pasangan rekomendasi"),
):
    """Rekomendasi item yang sering dibeli bersamaan"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv", ".parquet", ".json")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung")

    try:
        contents = await file.read()

        if file.filename.endswith((".xlsx", ".xls")):
            df = PolarsDataProcessor.read_excel_file(contents)
        elif file.filename.endswith(".csv"):
            df = PolarsDataProcessor.read_csv_file(contents)
        elif file.filename.endswith(".parquet"):
            df = PolarsDataProcessor.read_parquet_file(contents)
        elif file.filename.endswith(".json"):
            df = PolarsDataProcessor.read_json_file(contents)
        else:
            raise HTTPException(status_code=400, detail="Format tidak didukung")

        result = PolarsDataProcessor.recommend_frequently_bought_together(
            df=df,
            order_id_column=order_id_column,
            item_column=item_column,
            n=n,
        )

        return {
            "success": True,
            "recommendations": result,
            "method": "Frequently Bought Together",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/trending")
async def recommend_trending_items(
    file: UploadFile = File(...),
    date_column: str = Query(..., description="Nama kolom tanggal"),
    item_column: str = Query(..., description="Nama kolom item"),
    n: int = Query(10, description="Jumlah rekomendasi"),
    recent_periods: int = Query(7, description="Jumlah periode terakhir"),
):
    """Rekomendasi item yang sedang tren (meningkat)"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv", ".parquet", ".json")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung")

    try:
        contents = await file.read()

        if file.filename.endswith((".xlsx", ".xls")):
            df = PolarsDataProcessor.read_excel_file(contents)
        elif file.filename.endswith(".csv"):
            df = PolarsDataProcessor.read_csv_file(contents)
        elif file.filename.endswith(".parquet"):
            df = PolarsDataProcessor.read_parquet_file(contents)
        elif file.filename.endswith(".json"):
            df = PolarsDataProcessor.read_json_file(contents)
        else:
            raise HTTPException(status_code=400, detail="Format tidak didukung")

        result = PolarsDataProcessor.recommend_trending_items(
            df=df,
            date_column=date_column,
            item_column=item_column,
            n=n,
            recent_periods=recent_periods,
        )

        return {
            "success": True,
            "recommendations": result,
            "method": "Trending Items",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all-methods")
async def recommend_all_methods(
    file: UploadFile = File(...),
    order_id_column: Optional[str] = Query(None, description="Nama kolom ID pesanan"),
    item_column: str = Query(..., description="Nama kolom item"),
    category_column: Optional[str] = Query(None, description="Nama kolom kategori"),
    date_column: Optional[str] = Query(None, description="Nama kolom tanggal"),
    n: int = Query(10, description="Jumlah rekomendasi"),
):
    """Rekomendasi menggunakan semua metode"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv", ".parquet", ".json")):
        raise HTTPException(status_code=400, detail="Format file tidak didukung")

    try:
        contents = await file.read()

        if file.filename.endswith((".xlsx", ".xls")):
            df = PolarsDataProcessor.read_excel_file(contents)
        elif file.filename.endswith(".csv"):
            df = PolarsDataProcessor.read_csv_file(contents)
        elif file.filename.endswith(".parquet"):
            df = PolarsDataProcessor.read_parquet_file(contents)
        elif file.filename.endswith(".json"):
            df = PolarsDataProcessor.read_json_file(contents)
        else:
            raise HTTPException(status_code=400, detail="Format tidak didukung")

        results = {}

        # Popular Items
        if item_column:
            results["popular_items"] = PolarsDataProcessor.recommend_popular_items(
                df=df, item_column=item_column, n=n
            )

        # By Category
        if category_column and item_column:
            results["by_category"] = PolarsDataProcessor.recommend_by_category(
                df=df, category_column=category_column, item_column=item_column, n=n
            )

        # Frequently Bought Together
        if order_id_column and item_column:
            results["frequently_bought_together"] = (
                PolarsDataProcessor.recommend_frequently_bought_together(
                    df=df, order_id_column=order_id_column, item_column=item_column, n=n
                )
            )

        # Trending
        if date_column and item_column:
            results["trending"] = PolarsDataProcessor.recommend_trending_items(
                df=df, date_column=date_column, item_column=item_column, n=n
            )

        return {
            "success": True,
            "recommendations": results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
