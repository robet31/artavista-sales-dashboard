from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional, List
from ..services.polars_service import PolarsDataProcessor

router = APIRouter()


@router.post("/exponential-smoothing")
async def forecast_exponential_smoothing(
    file: UploadFile = File(...),
    date_column: str = Query(..., description="Nama kolom tanggal"),
    value_column: str = Query(..., description="Nama kolom nilai yang akan diprediksi"),
    periods: int = Query(7, description="Jumlah periode ke depan"),
    span: Optional[int] = Query(None, description="Span untuk EWMA"),
):
    """Forecasting menggunakan Exponential Smoothing (EWMA)"""
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

        result = PolarsDataProcessor.forecast_exponential_smoothing(
            df=df,
            date_column=date_column,
            value_column=value_column,
            periods=periods,
            span=span,
        )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/moving-average")
async def forecast_moving_average(
    file: UploadFile = File(...),
    date_column: str = Query(..., description="Nama kolom tanggal"),
    value_column: str = Query(..., description="Nama kolom nilai yang akan diprediksi"),
    periods: int = Query(7, description="Jumlah periode ke depan"),
    window: int = Query(7, description="Ukuran window untuk moving average"),
):
    """Forecasting menggunakan Moving Average"""
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

        result = PolarsDataProcessor.forecast_moving_average(
            df=df,
            date_column=date_column,
            value_column=value_column,
            periods=periods,
            window=window,
        )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/linear-trend")
async def forecast_linear_trend(
    file: UploadFile = File(...),
    date_column: str = Query(..., description="Nama kolom tanggal"),
    value_column: str = Query(..., description="Nama kolom nilai yang akan diprediksi"),
    periods: int = Query(7, description="Jumlah periode ke depan"),
):
    """Forecasting menggunakan Linear Trend"""
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

        result = PolarsDataProcessor.forecast_linear_trend(
            df=df,
            date_column=date_column,
            value_column=value_column,
            periods=periods,
        )

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all-methods")
async def forecast_all_methods(
    file: UploadFile = File(...),
    date_column: str = Query(..., description="Nama kolom tanggal"),
    value_column: str = Query(..., description="Nama kolom nilai yang akan diprediksi"),
    periods: int = Query(7, description="Jumlah periode ke depan"),
):
    """Forecasting menggunakan semua metode"""
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

        return {
            "exponential_smoothing": PolarsDataProcessor.forecast_exponential_smoothing(
                df=df,
                date_column=date_column,
                value_column=value_column,
                periods=periods,
            ),
            "moving_average": PolarsDataProcessor.forecast_moving_average(
                df=df,
                date_column=date_column,
                value_column=value_column,
                periods=periods,
            ),
            "linear_trend": PolarsDataProcessor.forecast_linear_trend(
                df=df,
                date_column=date_column,
                value_column=value_column,
                periods=periods,
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
