import polars as pl
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import io
import json


class PolarsDataProcessor:
    """Service untuk memproses data menggunakan Polars"""

    @staticmethod
    def read_excel_file(
        file_content: bytes, sheet_name: str = "Sheet1"
    ) -> pl.DataFrame:
        """Membaca file Excel dan mengkonversi ke Polars DataFrame"""
        df = pl.read_excel(
            source=io.BytesIO(file_content), sheet_name=sheet_name, has_header=True
        )
        return df

    @staticmethod
    def read_csv_file(file_content: bytes, separator: str = ",") -> pl.DataFrame:
        """Membaca file CSV dan mengkonversi ke Polars DataFrame"""
        df = pl.read_csv(source=io.BytesIO(file_content), separator=separator)
        return df

    @staticmethod
    def read_parquet_file(file_content: bytes) -> pl.DataFrame:
        """Membaca file Parquet dan mengkonversi ke Polars DataFrame"""
        df = pl.read_parquet(io.BytesIO(file_content))
        return df

    @staticmethod
    def read_json_file(file_content: bytes) -> pl.DataFrame:
        """Membaca file JSON dan mengkonversi ke Polars DataFrame"""
        df = pl.read_json(io.BytesIO(file_content))
        return df

    # ==================== EXPORT TO ALL FORMATS ====================
    @staticmethod
    def export_to_csv(df: pl.DataFrame) -> str:
        """Export DataFrame ke CSV string"""
        return df.write_csv()

    @staticmethod
    def export_to_csv_file(df: pl.DataFrame, file_path: str) -> None:
        """Export DataFrame ke file CSV"""
        df.write_csv(file_path)

    @staticmethod
    def export_to_json(df: pl.DataFrame) -> str:
        """Export DataFrame ke JSON string"""
        return df.write_json()

    @staticmethod
    def export_to_json_file(df: pl.DataFrame, file_path: str) -> None:
        """Export DataFrame ke file JSON"""
        df.write_json(file_path)

    @staticmethod
    def export_to_ndjson(df: pl.DataFrame) -> str:
        """Export DataFrame ke NDJSON (Newline Delimited JSON) string"""
        return df.write_ndjson()

    @staticmethod
    def export_to_parquet(df: pl.DataFrame) -> bytes:
        """Export DataFrame ke Parquet bytes"""
        buffer = io.BytesIO()
        df.write_parquet(buffer)
        return buffer.getvalue()

    @staticmethod
    def export_to_parquet_file(df: pl.DataFrame, file_path: str) -> None:
        """Export DataFrame ke file Parquet"""
        df.write_parquet(file_path)

    @staticmethod
    def export_to_excel(df: pl.DataFrame) -> bytes:
        """Export DataFrame ke Excel bytes"""
        buffer = io.BytesIO()
        df.write_excel(buffer)
        return buffer.getvalue()

    @staticmethod
    def export_to_excel_file(df: pl.DataFrame, file_path: str) -> None:
        """Export DataFrame ke file Excel"""
        df.write_excel(file_path)

    @staticmethod
    def export_to_ipc(df: pl.DataFrame) -> bytes:
        """Export DataFrame ke IPC/Feather bytes"""
        buffer = io.BytesIO()
        df.write_ipc(buffer)
        return buffer.getvalue()

    # ==================== DATA CLEANSING ====================
    @staticmethod
    def clean_delivery_data(df: pl.DataFrame) -> pl.DataFrame:
        """Membersihkan data delivery"""
        cleaned = df.drop_nulls()
        columns = cleaned.columns
        if "order_time" in columns:
            cleaned = cleaned.with_columns(
                [pl.col("order_time").str.to_datetime("%Y-%m-%d %H:%M:%S")]
            )
        if "delivery_time" in cleaned.columns:
            cleaned = cleaned.with_columns(
                [pl.col("delivery_time").str.to_datetime("%Y-%m-%d %H:%M:%S")]
            )
        return cleaned

    @staticmethod
    def clean_data(
        df: pl.DataFrame,
        drop_nulls: bool = True,
        drop_duplicates: bool = True,
        fill_null策略: Optional[Dict[str, str]] = None,
        trim_strings: bool = True,
        convert_dates: bool = True,
        date_columns: Optional[List[str]] = None,
    ) -> pl.DataFrame:
        """
        Membersihkan data dengan berbagai strategi
        Args:
            df: DataFrame Polars
            drop_nulls: Apakah menghapus baris dengan null
            drop_duplicates: Apakah menghapus duplikat
            fill_null_strategy: Dict dengan format {"nama_kolom": "strategy"}
                strategy: "forward", "backward", "mean", "median", "min", "max", "zero"
            trim_strings: Apakah menghapus whitespace di awal/akhir string
            convert_dates: Apakah mengkonversi kolom tanggal
            date_columns: List nama kolom yang akan dikonversi ke tanggal
        """
        result = df.clone()

        if drop_nulls:
            result = result.drop_nulls()

        if drop_duplicates:
            result = result.unique()

        if trim_strings:
            string_cols = [
                col for col in result.columns if result[col].dtype == pl.Utf8
            ]
            for col in string_cols:
                result = result.with_columns(pl.col(col).str.strip())

        if fill_null_strategy:
            for col, strategy in fill_null_strategy.items():
                if col in result.columns:
                    if strategy == "forward":
                        result = result.with_columns(
                            pl.col(col).fill_null(strategy="forward")
                        )
                    elif strategy == "backward":
                        result = result.with_columns(
                            pl.col(col).fill_null(strategy="backward")
                        )
                    elif strategy == "mean":
                        result = result.with_columns(
                            pl.col(col).fill_null(pl.col(col).mean())
                        )
                    elif strategy == "median":
                        result = result.with_columns(
                            pl.col(col).fill_null(pl.col(col).median())
                        )
                    elif strategy == "min":
                        result = result.with_columns(
                            pl.col(col).fill_null(pl.col(col).min())
                        )
                    elif strategy == "max":
                        result = result.with_columns(
                            pl.col(col).fill_null(pl.col(col).max())
                        )
                    elif strategy == "zero":
                        result = result.with_columns(pl.col(col).fill_null(0))

        if convert_dates and date_columns:
            for col in date_columns:
                if col in result.columns:
                    try:
                        result = result.with_columns(
                            pl.col(col).str.to_datetime("%Y-%m-%d %H:%M:%S")
                        )
                    except:
                        try:
                            result = result.with_columns(pl.col(col).str.to_date())
                        except:
                            pass

        return result

    @staticmethod
    def remove_duplicates(
        df: pl.DataFrame, subset: Optional[List[str]] = None, keep: str = "first"
    ) -> pl.DataFrame:
        """
        Menghapus duplikat
        Args:
            df: DataFrame Polars
            subset: Kolom yang dijadikan acuan duplikat (None = semua kolom)
            keep: "first", "last", atau "none"
        """
        if subset:
            return df.unique(subset=subset, keep=keep, maintain_order=True)
        return df.unique(keep=keep, maintain_order=True)

    @staticmethod
    def fill_missing_values(
        df: pl.DataFrame, column: str, strategy: str, value: Any = None
    ) -> pl.DataFrame:
        """
        Mengisi nilai yang hilang
        Args:
            df: DataFrame Polars
            column: Nama kolom
            strategy: "forward", "backward", "mean", "median", "min", "max", "zero", "custom"
            value: Nilai kustom jika strategy "custom"
        """
        if column not in df.columns:
            return df

        if strategy == "forward":
            return df.with_columns(pl.col(column).fill_null(strategy="forward"))
        elif strategy == "backward":
            return df.with_columns(pl.col(column).fill_null(strategy="backward"))
        elif strategy == "mean":
            return df.with_columns(pl.col(column).fill_null(pl.col(column).mean()))
        elif strategy == "median":
            return df.with_columns(pl.col(column).fill_null(pl.col(column).median()))
        elif strategy == "min":
            return df.with_columns(pl.col(column).fill_null(pl.col(column).min()))
        elif strategy == "max":
            return df.with_columns(pl.col(column).fill_null(pl.col(column).max()))
        elif strategy == "zero":
            return df.with_columns(pl.col(column).fill_null(0))
        elif strategy == "custom" and value is not None:
            return df.with_columns(pl.col(column).fill_null(value))
        return df

    @staticmethod
    def handle_outliers(
        df: pl.DataFrame, column: str, method: str = "iqr"
    ) -> pl.DataFrame:
        """
        Menangani outlier
        Args:
            df: DataFrame Polars
            column: Nama kolom numerik
            method: "iqr" (Interquartile Range) atau "zscore"
        """
        if column not in df.columns:
            return df

        if method == "iqr":
            q1 = df[column].quantile(0.25)
            q3 = df[column].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            return df.filter((pl.col(column) >= lower) & (pl.col(column) <= upper))
        elif method == "zscore":
            mean = df[column].mean()
            std = df[column].std()
            return df.filter((pl.col(column) - mean).abs() <= 3 * std)
        return df

    # ==================== ANALYTICS EXISTING ====================
    @staticmethod
    def get_sales_summary(df: pl.DataFrame) -> Dict[str, Any]:
        """Mendapatkan ringkasan penjualan"""
        if df.is_empty():
            return {
                "total_orders": 0,
                "total_revenue": 0,
                "average_order": 0,
                "min_order": 0,
                "max_order": 0,
            }

        return {
            "total_orders": len(df),
            "total_revenue": float(df["estimated_duration"].sum())
            if "estimated_duration" in df.columns
            else 0,
            "average_order": float(df["estimated_duration"].mean())
            if "estimated_duration" in df.columns
            else 0,
            "min_order": float(df["estimated_duration"].min())
            if "estimated_duration" in df.columns
            else 0,
            "max_order": float(df["estimated_duration"].max())
            if "estimated_duration" in df.columns
            else 0,
        }

    @staticmethod
    def get_delivery_performance(df: pl.DataFrame) -> Dict[str, Any]:
        """Mendapatkan performa delivery"""
        if df.is_empty():
            return {"total_deliveries": 0, "on_time": 0, "delayed": 0, "delay_rate": 0}

        if "is_delayed" not in df.columns:
            return {"error": "is_delayed column not found"}

        total = len(df)
        delayed = df.filter(pl.col("is_delayed") == True)
        on_time = df.filter(pl.col("is_delayed") == False)

        return {
            "total_deliveries": total,
            "on_time": len(on_time),
            "delayed": len(delayed),
            "delay_rate": round(len(delayed) / total * 100, 2) if total > 0 else 0,
        }

    @staticmethod
    def get_orders_by_hour(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Mendapatkan jumlah order per jam"""
        if df.is_empty() or "order_hour" not in df.columns:
            return []

        result = (
            df.group_by("order_hour")
            .agg([pl.len().alias("order_count")])
            .sort("order_hour")
        )

        return [
            {"hour": row["order_hour"], "count": row["order_count"]}
            for row in result.iter_rows()
        ]

    @staticmethod
    def get_orders_by_month(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Mendapatkan jumlah order per bulan"""
        if df.is_empty() or "order_month" not in df.columns:
            return []

        result = (
            df.group_by("order_month")
            .agg([pl.len().alias("order_count")])
            .sort("order_month")
        )

        return [
            {"month": row["order_month"], "count": row["order_count"]}
            for row in result.iter_rows()
        ]

    @staticmethod
    def get_traffic_analysis(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Analisis berdasarkan traffic level"""
        if df.is_empty() or "traffic_level" not in df.columns:
            return []

        result = df.group_by("traffic_level").agg(
            [
                pl.len().alias("order_count"),
                pl.col("is_delayed").mean().alias("delay_rate"),
            ]
        )

        return [
            {
                "traffic_level": row["traffic_level"],
                "order_count": row["order_count"],
                "delay_rate": round(row["delay_rate"] * 100, 2),
            }
            for row in result.iter_rows()
        ]

    @staticmethod
    def get_pizza_analysis(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Analisis berdasarkan pizza"""
        if df.is_empty():
            return []

        result = df.group_by(["pizza_size", "pizza_type"]).agg(
            [pl.len().alias("order_count")]
        )

        return [
            {
                "pizza_size": row["pizza_size"],
                "pizza_type": row["pizza_type"],
                "order_count": row["order_count"],
            }
            for row in result.iter_rows()
        ]

    @staticmethod
    def get_payment_analysis(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Analisis berdasarkan payment method"""
        if df.is_empty() or "payment_method" not in df.columns:
            return []

        result = df.group_by("payment_method").agg([pl.len().alias("order_count")])

        return [
            {"payment_method": row["payment_method"], "order_count": row["order_count"]}
            for row in result.iter_rows()
        ]

    @staticmethod
    def export_to_dict(df: pl.DataFrame) -> List[Dict[str, Any]]:
        """Export DataFrame ke list of dict"""
        return df.to_dicts()

    # ==================== FORECASTING ====================
    @staticmethod
    def forecast_exponential_smoothing(
        df: pl.DataFrame,
        date_column: str,
        value_column: str,
        periods: int = 7,
        span: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Forecasting menggunakan Exponentially Weighted Moving Average
        Args:
            df: DataFrame Polars
            date_column: Nama kolom tanggal
            value_column: Nama kolom nilai yang akan diprediksi
            periods: Jumlah periode ke depan yang akan diprediksi
            span: Span untuk EWMA (jika None, menggunakan periods)
        """
        if date_column not in df.columns or value_column not in df.columns:
            return {"error": "Column not found"}

        try:
            temp_df = df.clone()
            temp_df = temp_df.sort(date_column)

            if span is None:
                span = min(periods * 2, len(temp_df))

            values = temp_df[value_column].to_list()
            dates = temp_df[date_column].to_list()

            ewm_values = []
            alpha = 2 / (span + 1)
            for i, val in enumerate(values):
                if i == 0:
                    ewm_values.append(val)
                else:
                    ewm_value = alpha * val + (1 - alpha) * ewm_values[-1]
                    ewm_values.append(ewm_value)

            last_date = dates[-1]
            if isinstance(last_date, str):
                last_date = datetime.fromisoformat(last_date.replace("Z", ""))
            elif hasattr(last_date, "timestamp"):
                last_date = last_date

            forecast_values = []
            last_ewm = ewm_values[-1] if ewm_values else 0

            for i in range(periods):
                next_value = last_ewm
                forecast_values.append(float(next_value))
                last_ewm = next_value

            historical = [
                {"date": str(d), "actual": float(v), "forecast": float(f)}
                for d, v, f in zip(dates[-span:], values[-span:], ewm_values[-span:])
            ]

            return {
                "success": True,
                "historical": historical,
                "forecast": forecast_values,
                "method": "Exponential Smoothing (EWMA)",
                "span": span,
                "periods": periods,
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def forecast_moving_average(
        df: pl.DataFrame,
        date_column: str,
        value_column: str,
        periods: int = 7,
        window: int = 7,
    ) -> Dict[str, Any]:
        """
        Forecasting menggunakan Moving Average
        Args:
            df: DataFrame Polars
            date_column: Nama kolom tanggal
            value_column: Nama kolom nilai yang akan diprediksi
            periods: Jumlah periode ke depan yang akan diprediksi
            window: Ukuran window untuk moving average
        """
        if date_column not in df.columns or value_column not in df.columns:
            return {"error": "Column not found"}

        try:
            temp_df = df.clone()
            temp_df = temp_df.sort(date_column)

            values = temp_df[value_column].to_list()
            dates = temp_df[date_column].to_list()

            window = min(window, len(values))

            ma_values = []
            for i in range(len(values)):
                start = max(0, i - window + 1)
                window_values = values[start : i + 1]
                ma_values.append(sum(window_values) / len(window_values))

            last_ma = sum(values[-window:]) / window

            forecast_values = [float(last_ma) for _ in range(periods)]

            historical = [
                {"date": str(d), "actual": float(v), "forecast": float(f)}
                for d, v, f in zip(
                    dates[-window:], values[-window:], ma_values[-window:]
                )
            ]

            return {
                "success": True,
                "historical": historical,
                "forecast": forecast_values,
                "method": "Moving Average",
                "window": window,
                "periods": periods,
            }
        except Exception as e:
            return {"error": str(e)}

    @staticmethod
    def forecast_linear_trend(
        df: pl.DataFrame,
        date_column: str,
        value_column: str,
        periods: int = 7,
    ) -> Dict[str, Any]:
        """
        Forecasting menggunakan Linear Trend
        Args:
            df: DataFrame Polars
            date_column: Nama kolom tanggal
            value_column: Nama kolom nilai yang akan diprediksi
            periods: Jumlah periode ke depan yang akan diprediksi
        """
        if date_column not in df.columns or value_column not in df.columns:
            return {"error": "Column not found"}

        try:
            temp_df = df.clone()
            temp_df = temp_df.sort(date_column)

            values = temp_df[value_column].to_list()
            dates = temp_df[date_column].to_list()

            n = len(values)
            x = list(range(n))
            y = values

            x_mean = sum(x) / n
            y_mean = sum(y) / n

            numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
            denominator = sum((x[i] - x_mean) ** 2 for i in range(n))

            if denominator == 0:
                slope = 0
            else:
                slope = numerator / denominator

            intercept = y_mean - slope * x_mean

            fitted_values = [slope * xi + intercept for xi in x]

            forecast_values = []
            for i in range(periods):
                next_x = n + i
                next_value = slope * next_x + intercept
                forecast_values.append(float(max(0, next_value)))

            historical = [
                {"date": str(d), "actual": float(v), "forecast": float(f)}
                for d, v, f in zip(dates, values, fitted_values)
            ]

            return {
                "success": True,
                "historical": historical,
                "forecast": forecast_values,
                "method": "Linear Trend",
                "slope": slope,
                "intercept": intercept,
                "periods": periods,
            }
        except Exception as e:
            return {"error": str(e)}

    # ==================== RECOMMENDATION ====================
    @staticmethod
    def recommend_popular_items(
        df: pl.DataFrame, item_column: str, n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Rekomendasi berdasarkan item paling populer
        Args:
            df: DataFrame Polars
            item_column: Nama kolom item
            n: Jumlah rekomendasi
        """
        if df.is_empty() or item_column not in df.columns:
            return []

        result = (
            df.group_by(item_column)
            .agg([pl.len().alias("order_count")])
            .sort("order_count", descending=True)
            .head(n)
        )

        total_orders = len(df)
        return [
            {
                "item": row[item_column],
                "order_count": row["order_count"],
                "percentage": round(row["order_count"] / total_orders * 100, 2),
            }
            for row in result.iter_rows()
        ]

    @staticmethod
    def recommend_by_category(
        df: pl.DataFrame,
        category_column: str,
        item_column: str,
        n: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Rekomendasi berdasarkan kategori
        Args:
            df: DataFrame Polars
            category_column: Nama kolom kategori
            item_column: Nama kolom item
            n: Jumlah rekomendasi per kategori
        """
        if df.is_empty():
            return []

        result = []
        categories = df[category_column].unique().to_list()

        for cat in categories:
            cat_df = df.filter(pl.col(category_column) == cat)
            top_items = (
                cat_df.group_by(item_column)
                .agg([pl.len().alias("order_count")])
                .sort("order_count", descending=True)
                .head(n)
            )

            for row in top_items.iter_rows():
                result.append(
                    {
                        "category": cat,
                        "item": row[0],
                        "order_count": row[1],
                    }
                )

        return result

    @staticmethod
    def recommend_frequently_bought_together(
        df: pl.DataFrame,
        order_id_column: str,
        item_column: str,
        n: int = 5,
    ) -> List[Dict[str, Any]]:
        """
        Rekomendasi item yang sering dibeli bersamaan
        Args:
            df: DataFrame Polars
            order_id_column: Nama kolom ID pesanan
            item_column: Nama kolom item
            n: Jumlah pasangan rekomendasi
        """
        if (
            df.is_empty()
            or order_id_column not in df.columns
            or item_column not in df.columns
        ):
            return []

        from collections import defaultdict
        from itertools import combinations

        orders = df.group_by(order_id_column).agg(pl.col(item_column).alias("items"))

        pair_counts = defaultdict(int)
        for order in orders.iter_rows():
            items = sorted(set(order[1]))
            for pair in combinations(items, 2):
                pair_counts[pair] += 1

        sorted_pairs = sorted(pair_counts.items(), key=lambda x: x[1], reverse=True)

        return [
            {"item1": pair[0], "item2": pair[1], "count": count}
            for pair, count in sorted_pairs[:n]
        ]

    @staticmethod
    def recommend_trending_items(
        df: pl.DataFrame,
        date_column: str,
        item_column: str,
        n: int = 10,
        recent_periods: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Rekomendasi item yang sedang tren (meningkat)
        Args:
            df: DataFrame Polars
            date_column: Nama kolom tanggal
            item_column: Nama kolom item
            n: Jumlah rekomendasi
            recent_periods: Jumlah periode terakhir untuk dibandingkan
        """
        if (
            df.is_empty()
            or date_column not in df.columns
            or item_column not in df.columns
        ):
            return []

        temp_df = df.clone()
        temp_df = temp_df.sort(date_column)

        all_items = temp_df[item_column].unique().to_list()

        item_trends = []
        for item in all_items:
            item_df = temp_df.filter(pl.col(item_column) == item)
            item_counts = item_df.group_by(date_column).agg([pl.len().alias("count")])
            counts = item_counts["count"].to_list()

            if len(counts) >= 2:
                recent = sum(counts[-recent_periods:]) / min(
                    recent_periods, len(counts)
                )
                older = (
                    sum(counts[-2 * recent_periods : -recent_periods])
                    / min(recent_periods, len(counts) - recent_periods)
                    if len(counts) > recent_periods
                    else recent
                )
                trend = (recent - older) / older if older > 0 else 0
            else:
                trend = 0

            item_trends.append(
                {
                    "item": item,
                    "trend": trend,
                    "recent_count": sum(counts[-recent_periods:]) if counts else 0,
                }
            )

        sorted_trends = sorted(item_trends, key=lambda x: x["trend"], reverse=True)

        return sorted_trends[:n]
