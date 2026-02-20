from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any
from ..services.polars_service import PolarsDataProcessor

router = APIRouter()


@router.post("/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    """Upload dan proses file Excel menggunakan Polars"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)

        return {
            "filename": file.filename,
            "rows": len(df),
            "columns": df.columns,
            "preview": df.head(5).to_dicts(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-excel/clean")
async def upload_and_clean_excel(file: UploadFile = File(...)):
    """Upload, bersihkan, dan proses file Excel"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        cleaned_df = PolarsDataProcessor.clean_delivery_data(df)

        return {
            "filename": file.filename,
            "original_rows": len(df),
            "cleaned_rows": len(cleaned_df),
            "data": cleaned_df.to_dicts(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/summary")
async def analyze_summary(file: UploadFile = File(...)):
    """Get sales summary dari file Excel"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        summary = PolarsDataProcessor.get_sales_summary(df)

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/delivery-performance")
async def analyze_delivery_performance(file: UploadFile = File(...)):
    """Get delivery performance analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        performance = PolarsDataProcessor.get_delivery_performance(df)

        return performance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/orders-by-hour")
async def analyze_orders_by_hour(file: UploadFile = File(...)):
    """Get orders by hour analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        result = PolarsDataProcessor.get_orders_by_hour(df)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/orders-by-month")
async def analyze_orders_by_month(file: UploadFile = File(...)):
    """Get orders by month analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        result = PolarsDataProcessor.get_orders_by_month(df)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/traffic")
async def analyze_traffic(file: UploadFile = File(...)):
    """Get traffic level analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        result = PolarsDataProcessor.get_traffic_analysis(df)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/pizza")
async def analyze_pizza(file: UploadFile = File(...)):
    """Get pizza analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        result = PolarsDataProcessor.get_pizza_analysis(df)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/payment")
async def analyze_payment(file: UploadFile = File(...)):
    """Get payment method analysis"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)
        result = PolarsDataProcessor.get_payment_analysis(df)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analyze/full")
async def analyze_full(file: UploadFile = File(...)):
    """Get full analysis - semua metrics"""
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(
            status_code=400, detail="File harus berekstensi .xlsx atau .xls"
        )

    try:
        contents = await file.read()
        df = PolarsDataProcessor.read_excel_file(contents)

        return {
            "summary": PolarsDataProcessor.get_sales_summary(df),
            "delivery_performance": PolarsDataProcessor.get_delivery_performance(df),
            "orders_by_hour": PolarsDataProcessor.get_orders_by_hour(df),
            "orders_by_month": PolarsDataProcessor.get_orders_by_month(df),
            "traffic_analysis": PolarsDataProcessor.get_traffic_analysis(df),
            "pizza_analysis": PolarsDataProcessor.get_pizza_analysis(df),
            "payment_analysis": PolarsDataProcessor.get_payment_analysis(df),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
