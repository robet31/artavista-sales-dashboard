import io
import polars as pl
from fastapi import HTTPException, UploadFile


class AdidasCleaningService:
    """Service untuk cleaning data Adidas menggunakan Polars (SANGAT CEPAT)"""

    PRODUCT_CYCLE = [
        "Men's Apparel",
        "Women's Apparel",
        "Men's Street Footwear",
        "Men's Athletic Footwear",
        "Women's Street Footwear",
        "Women's Athletic Footwear",
    ]

    SALES_METHODS = ["Online (E-commerce)", "In-store", "Outlet"]

    def __init__(self, db=None):
        self.db = db
        self.retailer_name = "Unknown"

    async def process_excel(self, file: UploadFile, db=None) -> pl.DataFrame:
        """Main process untuk upload Excel Adidas"""

        contents = await file.read()
        df = pl.read_excel(io.BytesIO(contents))

        # Get city list from database for normalization (skip for now - no db needed)
        list_city = []

        # Execute all cleaning steps
        df = self._search_info_department(df)
        df = self._fix_columns_name(df)
        df = self._retailer_name(df)
        df = self._change_data_type(df)
        df = self._fix_merged_cell(df)
        df = self._fill_missing_values(df)
        df = self._normalize_city(df, list_city)
        df = self._fill_product(df)

        return df

    def _search_info_department(self, df: pl.DataFrame) -> pl.DataFrame:
        """Cari department/retailer info"""
        posisi_lengkap = (
            df.with_row_index("row_nr")
            .unpivot(index="row_nr")
            .filter(pl.col("value") == "Retailer")
        )

        if posisi_lengkap.is_empty():
            raise HTTPException(404, "gada identitas departemen")

        all_columns = df.columns
        koordinat_angka = []

        for row, col_name in zip(posisi_lengkap["row_nr"], posisi_lengkap["variable"]):
            col_idx = all_columns.index(col_name)
            koordinat_angka = [row, col_idx]

        if koordinat_angka:
            retailer = df[koordinat_angka[0], koordinat_angka[1] + 1]
            self.retailer_name = str(retailer) if retailer else "Unknown"
        else:
            self.retailer_name = "Unknown"

        return df

    def _fix_columns_name(self, df: pl.DataFrame) -> pl.DataFrame:
        """Fix column names"""
        if len(df) < 9:
            return df

        try:
            top_col = list(df.row(7))
            bottom_col = tuple(df.row(8))

            top_col[2] = bottom_col[2]
            top_col[3] = bottom_col[3]
            top_col = tuple(top_col)

            df = df.rename({old: new for old, new in zip(df.columns, top_col)})
            df = df[9:]
            return pl.DataFrame(df)
        except:
            return df

    def _retailer_name(self, df: pl.DataFrame) -> pl.DataFrame:
        """Add retailer column"""
        df = df.with_columns(Retailer=pl.lit(self.retailer_name))
        return df

    def _change_data_type(self, df: pl.DataFrame) -> pl.DataFrame:
        """Change data types"""
        try:
            df = df.with_columns(
                pl.col("Price per Unit").cast(pl.Float64),
                pl.col("Units Sold").cast(pl.Int16),
                pl.col("Total Sales").cast(pl.Float64),
                pl.col("Operating Profit").cast(pl.Float64),
                pl.col("Operating Margin").cast(pl.Float32),
            )

            # Try to parse date
            if "Invoice Date" in df.columns:
                df = df.with_columns(
                    pl.col("Invoice Date")
                    .str.to_datetime("%Y-%m-%d %H:%M:%S")
                    .cast(pl.Date)
                )
        except:
            pass
        return df

    def _fix_merged_cell(self, df: pl.DataFrame) -> pl.DataFrame:
        """Fill forward merged cells"""
        try:
            df = df.with_columns(
                pl.col("State").forward_fill(),
                pl.col("City").forward_fill(),
                pl.col("Sales Method").forward_fill(),
            )
        except:
            pass
        return df

    def _fill_missing_values(self, df: pl.DataFrame) -> pl.DataFrame:
        """Fill missing values with calculations"""
        try:
            for i in range(5):
                df = df.with_columns(
                    pl.col("Price per Unit").fill_null(
                        pl.col("Total Sales") / pl.col("Units Sold")
                    ),
                    pl.col("Units Sold").fill_null(
                        pl.col("Total Sales") / pl.col("Price per Unit")
                    ),
                    pl.col("Total Sales").fill_null(
                        pl.col("Units Sold") * pl.col("Price per Unit")
                    ),
                    pl.col("Operating Profit").fill_null(
                        pl.col("Total Sales") * pl.col("Operating Margin")
                    ),
                    pl.col("Operating Margin").fill_null(
                        pl.col("Operating Profit") / pl.col("Total Sales")
                    ),
                )
        except:
            pass
        return df

    def _normalize_city(self, df: pl.DataFrame, list_normalize: list) -> pl.DataFrame:
        """Normalize city names - skip if no list provided"""
        return df

    def _fill_product(self, df: pl.DataFrame) -> pl.DataFrame:
        """Fill product using cycling pattern"""
        try:
            df = df.with_columns(((pl.int_range(0, pl.len()) % 6) + 1).alias("ulang_6"))

            df = df.with_columns(
                [pl.col("ulang_6").cast(pl.Int64), pl.col("Product").cast(pl.String)]
            )

            buah_map = {i + 1: p for i, p in enumerate(self.PRODUCT_CYCLE)}

            df = df.with_columns(
                pl.col("Product").fill_null(
                    pl.col("ulang_6").replace(
                        buah_map, default=None, return_dtype=pl.String
                    )
                )
            )

            df = df.drop("ulang_6")
        except:
            pass
        return df

    def to_dict(self, df: pl.DataFrame) -> list:
        """Convert DataFrame to list of dicts"""
        return df.to_dicts()
