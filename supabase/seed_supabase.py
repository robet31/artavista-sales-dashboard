import psycopg2

# Supabase connection
DATABASE_URL = "postgresql://postgres.qtohyurcuetghfyattil:OsPe9cd4pTPbXH9Y@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres"

try:
    print("Connecting to Supabase...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    # Add missing columns to retailer
    cursor.execute(
        "ALTER TABLE retailer ADD COLUMN IF NOT EXISTS location VARCHAR(255)"
    )
    cursor.execute("ALTER TABLE retailer ADD COLUMN IF NOT EXISTS description TEXT")
    cursor.execute(
        "ALTER TABLE retailer ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true"
    )
    cursor.execute(
        "ALTER TABLE retailer ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()"
    )
    conn.commit()
    print("Added missing columns to retailer!")

    # Check retailers
    cursor.execute("SELECT id_retailer, retailer_name, location FROM retailer")
    retailers = cursor.fetchall()
    print(f"\nExisting retailers:")
    for r in retailers:
        print(f"  {r}")

    # Create our custom users table (different from auth.users)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS app_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            name VARCHAR(255),
            role VARCHAR(50) DEFAULT 'STAFF',
            position VARCHAR(100) DEFAULT 'STAFF',
            restaurant_id INTEGER,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP WITH TIME ZONE,
            FOREIGN KEY (restaurant_id) REFERENCES retailer(id_retailer)
        )
    """)
    conn.commit()
    print("Created app_users table!")

    # Enable RLS
    cursor.execute("ALTER TABLE app_users ENABLE ROW LEVEL SECURITY")
    cursor.execute('DROP POLICY IF EXISTS "Allow all access to app_users" ON app_users')
    cursor.execute(
        'CREATE POLICY "Allow all access to app_users" ON app_users FOR ALL USING (true)'
    )
    conn.commit()
    print("Added RLS to app_users!")

    # Create password verification function if not exists
    cursor.execute("""
        CREATE OR REPLACE FUNCTION verify_user_password(p_email TEXT, p_password TEXT)
        RETURNS BOOLEAN AS $$
        DECLARE
            v_user RECORD;
            v_password_hash TEXT;
        BEGIN
            v_password_hash := md5(p_password);
            SELECT * INTO v_user FROM app_users WHERE email = p_email AND is_active = true;
            IF NOT FOUND THEN
                RETURN false;
            END IF;
            IF v_user.password = v_password_hash THEN
                RETURN true;
            END IF;
            RETURN false;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
    """)
    conn.commit()
    print("Created verify_user_password function!")

    # Delete existing app_users first (to avoid conflicts)
    cursor.execute("DELETE FROM app_users")
    conn.commit()
    print("Cleared existing app_users!")

    # Get retailer IDs
    cursor.execute("SELECT id_retailer, retailer_name FROM retailer")
    retailer_map = {r[1]: r[0] for r in cursor.fetchall()}
    print(f"Retailer map: {retailer_map}")

    # Get the first 5 retailer IDs (or create a mapping)
    retailer_ids = list(retailer_map.values())[:5]
    print(f"Using retailer IDs: {retailer_ids}")

    # Insert GM (no retailer - full access)
    cursor.execute("""
        INSERT INTO app_users (email, password, name, role, position, restaurant_id, is_active) VALUES
            ('gm@adidas.id', md5('admin123'), 'General Manager Adidas', 'GM', 'GENERAL_MANAGER', NULL, true)
    """)
    conn.commit()
    print("Inserted GM!")

    # Insert Regional Managers (only use available retailer IDs)
    managers = [
        (
            "manager.jakarta@adidas.id",
            "Manager Jakarta",
            retailer_ids[0] if len(retailer_ids) > 0 else None,
        ),
        (
            "manager.surabaya@adidas.id",
            "Manager Surabaya",
            retailer_ids[1] if len(retailer_ids) > 1 else None,
        ),
        (
            "manager.bandung@adidas.id",
            "Manager Bandung",
            retailer_ids[2] if len(retailer_ids) > 2 else None,
        ),
        (
            "manager.medan@adidas.id",
            "Manager Medan",
            retailer_ids[3] if len(retailer_ids) > 3 else None,
        ),
        (
            "manager.semarang@adidas.id",
            "Manager Semarang",
            retailer_ids[4] if len(retailer_ids) > 4 else None,
        ),
    ]
    for m in managers:
        if m[2] is not None:
            cursor.execute(
                """
                INSERT INTO app_users (email, password, name, role, position, restaurant_id, is_active) 
                VALUES (%s, md5('admin123'), %s, 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', %s, true)
                ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
            """,
                (m[0], m[1], m[2]),
            )
    conn.commit()
    print("Inserted Managers!")

    # Insert Staff (only use available retailer IDs)
    staff = [
        (
            "staff.jakarta@adidas.id",
            "Staff Jakarta",
            retailer_ids[0] if len(retailer_ids) > 0 else None,
        ),
        (
            "staff.surabaya@adidas.id",
            "Staff Surabaya",
            retailer_ids[1] if len(retailer_ids) > 1 else None,
        ),
        (
            "staff.bandung@adidas.id",
            "Staff Bandung",
            retailer_ids[2] if len(retailer_ids) > 2 else None,
        ),
        (
            "staff.medan@adidas.id",
            "Staff Medan",
            retailer_ids[3] if len(retailer_ids) > 3 else None,
        ),
        (
            "staff.semarang@adidas.id",
            "Staff Semarang",
            retailer_ids[4] if len(retailer_ids) > 4 else None,
        ),
    ]
    for s in staff:
        if s[2] is not None:
            cursor.execute(
                """
                INSERT INTO app_users (email, password, name, role, position, restaurant_id, is_active) 
                VALUES (%s, md5('admin123'), %s, 'STAFF', 'STAFF', %s, true)
                ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password
            """,
                (s[0], s[1], s[2]),
            )
    conn.commit()
    print("Inserted Staff!")

    # Show all users
    cursor.execute("""
        SELECT u.email, u.name, u.role, u.position, r.retailer_name 
        FROM app_users u 
        LEFT JOIN retailer r ON u.restaurant_id = r.id_retailer 
        ORDER BY u.role, u.position
    """)
    users = cursor.fetchall()
    print("\n" + "=" * 80)
    print("USERS IN DATABASE")
    print("=" * 80)
    print(f"{'Role':<20} | {'Position':<20} | {'Email':<30} | {'Retailer'}")
    print("-" * 80)
    for user in users:
        print(f"{user[2]:<20} | {user[3]:<20} | {user[0]:<30} | {user[4] or 'ALL'}")
    print("=" * 80)

    cursor.close()
    conn.close()
    print("\nDone!")

except Exception as e:
    print(f"Error: {e}")
    import traceback

    traceback.print_exc()
