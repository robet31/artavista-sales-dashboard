from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from typing import Optional
from ..services.polars_service import PolarsDataProcessor

router = APIRouter()


@router.post("/export/csv")
async def export_to_csv(file: UploadFile = File(...)):
    """Export data ke format CSV"""
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

        csv_data = PolarsDataProcessor.export_to_csv(df)

        return {
            "success": True,
            "format": "csv",
            "rows": len(df),
            "columns": df.columns,
            "data": csv_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export/json")
async def export_to_json(file: UploadFile = File(...)):
    """Export data ke format JSON"""
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

        json_data = PolarsDataProcessor.export_to_json(df)

        return {
            "success": True,
            "format": "json",
            "rows": len(df),
            "columns": df.columns,
            "data": json_data,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export/parquet")
async def export_to_parquet(file: UploadFile = File(...)):
    """Export data ke format Parquet"""
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

        parquet_data = PolarsDataProcessor.export_to_parquet(df)

        import base64

        return {
            "success": True,
            "format": "parquet",
            "rows": len(df),
            "columns": df.columns,
            "data": base64.b64encode(parquet_data).decode("utf-8"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clean")
async def clean_data(
    file: UploadFile = File(...),
    drop_nulls: bool = Query(True),
    drop_duplicates: bool = Query(True),
    trim_strings: bool = Query(True),
    fill_null_strategy: Optional[str] = Query(None),
):
    """Membersihkan data dengan berbagai strategi"""
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

        original_rows = len(df)

        fill_strategy = None
        if fill_null_strategy:
            fill_strategy = {
                col: fill_null_strategy
                for col in df.columns
                if df[col].dtype in [pl.Float64, pl.Int64, pl.Int32]
            }

        cleaned_df = PolarsDataProcessor.clean_data(
            df,
            drop_nulls=drop_nulls,
            drop_duplicates=drop_duplicates,
            fill_null_strategy=fill_strategy,
            trim_strings=trim_strings,
        )

        return {
            "success": True,
            "original_rows": original_rows,
            "cleaned_rows": len(cleaned_df),
            "removed_rows": original_rows - len(cleaned_df),
            "columns": cleaned_df.columns,
            "preview": cleaned_df.head(10).to_dicts(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove-duplicates")
async def remove_duplicates(
    file: UploadFile = File(...),
    subset: Optional[str] = Query(None),
    keep: str = Query("first"),
):
    """Menghapus data duplikat"""
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

        original_rows = len(df)

        subset_list = subset.split(",") if subset else None

        cleaned_df = PolarsDataProcessor.remove_duplicates(
            df, subset=subset_list, keep=keep
        )

        return {
            "success": True,
            "original_rows": original_rows,
            "cleaned_rows": len(cleaned_df),
            "removed_duplicates": original_rows - len(cleaned_df),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


import polars as pl
