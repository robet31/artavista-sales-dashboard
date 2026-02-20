import sqlite3
import psycopg2
import os
from datetime import datetime

SQLITE_DB = "pizza.db"
NEON_URL = "postgresql://neondb_owner:npg_Y4N3JCZMLvWt@ep-dry-feather-a14cwbjx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"


def convert_row(row, table_name):
    row = list(row)
    if table_name == "DeliveryData":
        # Boolean columns indices: isPeakHour(17), isWeekend(18), isDelayed(24)
        row[17] = bool(row[17]) if row[17] is not None else None
        row[18] = bool(row[18]) if row[18] is not None else None
        row[24] = bool(row[24]) if row[24] is not None else None
    return tuple(row)


def migrate_table(table_name, columns):
    print(f"\n=== Migrating {table_name} ===")

    conn_sqlite = sqlite3.connect(SQLITE_DB)
    cursor = conn_sqlite.execute(f"SELECT {columns} FROM {table_name}")
    rows = cursor.fetchall()
    conn_sqlite.close()

    print(f"Found {len(rows)} rows in SQLite")

    if not rows:
        print(f"No data to migrate for {table_name}")
        return

    rows = [convert_row(row, table_name) for row in rows]

    conn_pg = psycopg2.connect(NEON_URL)
    pg_cursor = conn_pg.cursor()

    col_list = [c.strip() for c in columns.replace("\n", "").split(",")]
    col_str = ", ".join([f'"{c.strip()}"' for c in col_list])
    placeholders = ", ".join(["%s"] * len(col_list))

    query = f'INSERT INTO "{table_name}" ({col_str}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'

    pg_cursor.executemany(query, rows)
    conn_pg.commit()

    pg_cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
    count = pg_cursor.fetchone()[0]
    print(f"Migrated {len(rows)} rows to Neon. Total in Neon: {count}")

    conn_pg.close()


print("Starting migration from SQLite to Neon PostgreSQL...")

migrate_table(
    "users",
    "id, email, password, name, role, position, restaurant_id, is_active, created_at, updated_at, last_login",
)
migrate_table(
    "restaurants",
    "id, name, code, location, description, is_active, created_at, updated_at",
)
migrate_table(
    "DeliveryData",
    """id, orderId, restaurantId, location, orderTime, deliveryTime, deliveryDuration, 
    orderMonth, orderHour, pizzaSize, pizzaType, toppingsCount, pizzaComplexity, toppingDensity,
    distanceKm, trafficLevel, trafficImpact, isPeakHour, isWeekend, paymentMethod, paymentCategory,
    estimatedDuration, deliveryEfficiency, delayMin, isDelayed, restaurantAvgTime, uploadedBy,
    uploadedAt, validatedAt, validatedBy, qualityScore, version""",
)

print("\n=== Migration Complete! ===")
