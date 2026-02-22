"""
Script untuk import data dari Excel Adidas ke Supabase
Jalankan: python -m app.scripts.import_adidas_data
"""

import os
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv(
    "NEXT_PUBLIC_SUPABASE_URL", "https://qtohyurcuetghfyattil.supabase.co"
)
SUPABASE_KEY = os.getenv(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0b2h5dXJjdWV0Z2hmeWF0dGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjU5OTAsImV4cCI6MjA4NzE0MTk5MH0.NeM8dK--pGZMvGjNRAjD_yk4C_kEgiUT_2-qjI_otWg",
)


def get_supabase_client() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def read_excel_data():
    """Baca data dari file Excel"""
    excel_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), "..", "Adidas Kotor Banget R.xlsx"
    )

    df = pd.read_excel(excel_path, header=11)

    df = df.dropna(subset=["Retailer ID"])

    df = df.rename(
        columns={
            "Retailer ID": "retailer_id",
            "Invoice Date": "invoice_date",
            "Region": "state",
            "Unnamed: 4": "city",
            "Product": "product",
            "Price per Unit": "price_per_unit",
            "Units Sold": "unit_sold",
            "Total Sales": "total_sales",
            "Operating Profit": "operating_profit",
            "Operating Margin": "operating_margin",
            "Sales Method": "method",
        }
    )

    df = df[
        [
            "retailer_id",
            "invoice_date",
            "state",
            "city",
            "product",
            "price_per_unit",
            "unit_sold",
            "total_sales",
            "operating_profit",
            "operating_margin",
            "method",
        ]
    ]

    df = df.dropna(subset=["invoice_date", "total_sales"])

    return df


def import_data():
    """Import data ke Supabase"""
    supabase = get_supabase_client()

    print("Membaca data Excel...")
    df = read_excel_data()
    print(f"Total baris data: {len(df)}")

    print("\n=== Mengambil data unik ===")

    unique_retailers = df["retailer_id"].dropna().unique().tolist()
    unique_states = df["state"].dropna().unique().tolist()
    unique_cities = df["city"].dropna().unique().tolist()
    unique_products = df["product"].dropna().unique().tolist()
    unique_methods = df["method"].dropna().unique().tolist()

    print(f"Unique Retailers: {len(unique_retailers)}")
    print(f"Unique States: {len(unique_states)}")
    print(f"Unique Cities: {len(unique_cities)}")
    print(f"Unique Products: {len(unique_products)}")
    print(f"Unique Methods: {len(unique_methods)}")

    print("\n=== Insert State ===")
    state_map = {}
    for state_name in unique_states:
        if pd.isna(state_name):
            continue
        try:
            response = supabase.table("state").insert({"state": state_name}).execute()
            if response.data:
                state_id = response.data[0]["id_state"]
                state_map[state_name] = state_id
                print(f"  Inserted state: {state_name}")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                existing = (
                    supabase.table("state")
                    .select("id_state, state")
                    .eq("state", state_name)
                    .execute()
                )
                if existing.data:
                    state_map[state_name] = existing.data[0]["id_state"]
                    print(f"  State already exists: {state_name}")
            else:
                print(f"  Error inserting state {state_name}: {e}")

    print("\n=== Insert City ===")
    city_map = {}
    for _, row in df[["state", "city"]].drop_duplicates().iterrows():
        state_name = row["state"]
        city_name = row["city"]
        if pd.isna(city_name) or pd.isna(state_name):
            continue
        if city_name in city_map:
            continue
        state_id = state_map.get(state_name)
        if not state_id:
            continue
        try:
            response = (
                supabase.table("city")
                .insert({"city": city_name, "id_state": state_id})
                .execute()
            )
            if response.data:
                city_id = response.data[0]["id_city"]
                city_map[city_name] = city_id
                print(f"  Inserted city: {city_name} (state: {state_name})")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                existing = (
                    supabase.table("city")
                    .select("id_city, city")
                    .eq("city", city_name)
                    .execute()
                )
                if existing.data:
                    city_map[city_name] = existing.data[0]["id_city"]
                    print(f"  City already exists: {city_name}")
            else:
                print(f"  Error inserting city {city_name}: {e}")

    print("\n=== Insert Retailer ===")
    retailer_map = {}
    for retailer_id in unique_retailers:
        try:
            response = (
                supabase.table("retailer")
                .insert({"retailer_name": str(retailer_id)})
                .execute()
            )
            if response.data:
                r_id = response.data[0]["id_retailer"]
                retailer_map[retailer_id] = r_id
                print(f"  Inserted retailer: {retailer_id}")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                existing = (
                    supabase.table("retailer")
                    .select("id_retailer, retailer_name")
                    .eq("retailer_name", str(retailer_id))
                    .execute()
                )
                if existing.data:
                    retailer_map[retailer_id] = existing.data[0]["id_retailer"]
                    print(f"  Retailer already exists: {retailer_id}")
            else:
                print(f"  Error inserting retailer {retailer_id}: {e}")

    print("\n=== Insert Product ===")
    product_map = {}
    for product_name in unique_products:
        if pd.isna(product_name):
            continue
        try:
            response = (
                supabase.table("product").insert({"product": product_name}).execute()
            )
            if response.data:
                p_id = response.data[0]["id_product"]
                product_map[product_name] = p_id
                print(f"  Inserted product: {product_name}")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                existing = (
                    supabase.table("product")
                    .select("id_product, product")
                    .eq("product", product_name)
                    .execute()
                )
                if existing.data:
                    product_map[product_name] = existing.data[0]["id_product"]
                    print(f"  Product already exists: {product_name}")
            else:
                print(f"  Error inserting product {product_name}: {e}")

    print("\n=== Insert Method ===")
    method_map = {}
    for method_name in unique_methods:
        if pd.isna(method_name):
            continue
        try:
            response = (
                supabase.table("method").insert({"method": method_name}).execute()
            )
            if response.data:
                m_id = response.data[0]["id_method"]
                method_map[method_name] = m_id
                print(f"  Inserted method: {method_name}")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                existing = (
                    supabase.table("method")
                    .select("id_method, method")
                    .eq("method", method_name)
                    .execute()
                )
                if existing.data:
                    method_map[method_name] = existing.data[0]["id_method"]
                    print(f"  Method already exists: {method_name}")
            else:
                print(f"  Error inserting method {method_name}: {e}")

    print("\n=== Insert Transactions ===")
    transactions = []
    skipped = 0

    for _, row in df.iterrows():
        retailer_id = row["retailer_id"]
        city_name = row["city"]
        product_name = row["product"]
        method_name = row["method"]

        id_retailer = retailer_map.get(retailer_id)
        id_city = city_map.get(city_name)
        id_product = product_map.get(product_name)
        id_method = method_map.get(method_name) if not pd.isna(method_name) else None

        if not all([id_retailer, id_city, id_product]):
            skipped += 1
            continue

        invoice_date = row["invoice_date"]
        if pd.isna(invoice_date):
            skipped += 1
            continue

        if isinstance(invoice_date, str):
            try:
                invoice_date = datetime.strptime(
                    invoice_date, "%Y-%m-%d %H:%M:%S"
                ).date()
            except:
                try:
                    invoice_date = pd.to_datetime(invoice_date).date()
                except:
                    skipped += 1
                    continue
        else:
            invoice_date = pd.to_datetime(invoice_date).date()

        transactions.append(
            {
                "id_retailer": id_retailer,
                "id_product": id_product,
                "id_method": id_method,
                "id_city": id_city,
                "invoice_date": invoice_date.isoformat(),
                "price_per_unit": float(row["price_per_unit"])
                if pd.notna(row["price_per_unit"])
                else 0,
                "unit_sold": int(row["unit_sold"]) if pd.notna(row["unit_sold"]) else 0,
                "total_sales": float(row["total_sales"])
                if pd.notna(row["total_sales"])
                else 0,
                "operating_profit": float(row["operating_profit"])
                if pd.notna(row["operating_profit"])
                else 0,
                "operating_margin": float(row["operating_margin"])
                if pd.notna(row["operating_margin"])
                else 0,
            }
        )

    print(f"Prepared {len(transactions)} transactions, skipped {skipped}")

    batch_size = 100
    for i in range(0, len(transactions), batch_size):
        batch = transactions[i : i + batch_size]
        try:
            response = supabase.table("transaction").insert(batch).execute()
            print(
                f"  Inserted batch {i // batch_size + 1}/{(len(transactions) - 1) // batch_size + 1}"
            )
        except Exception as e:
            print(f"  Error inserting batch: {e}")

    print("\n=== Selesai! ===")
    print(f"Total transactions inserted: {len(transactions)}")
    print(f"Transactions skipped: {skipped}")


if __name__ == "__main__":
    import_data()
