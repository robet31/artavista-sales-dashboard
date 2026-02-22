-- Schema untuk Adidas Indonesia Sales Dashboard

-- Tabel users (updated with additional fields)
CREATE TABLE IF NOT EXISTS users (
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
  last_login TIMESTAMP WITH TIME ZONE
);

-- Function untuk verify password
CREATE OR REPLACE FUNCTION verify_user_password(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_user RECORD;
    v_password_hash TEXT;
BEGIN
    -- Hash input password dengan MD5 untuk pencocokan
    v_password_hash := md5(p_password);
    
    SELECT * INTO v_user FROM users WHERE email = p_email AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    IF v_user.password = v_password_hash THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tabel state (provinsi)
CREATE TABLE IF NOT EXISTS state (
  id_state SERIAL PRIMARY KEY,
  state VARCHAR(255) NOT NULL
);

-- Tabel city (kota)
CREATE TABLE IF NOT EXISTS city (
  id_city SERIAL PRIMARY KEY,
  city VARCHAR(255) NOT NULL,
  id_state INTEGER REFERENCES state(id_state)
);

-- Tabel retailer
CREATE TABLE IF NOT EXISTS retailer (
  id_retailer SERIAL PRIMARY KEY,
  retailer_name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel product
CREATE TABLE IF NOT EXISTS product (
  id_product SERIAL PRIMARY KEY,
  product VARCHAR(255) NOT NULL
);

-- Tabel method
CREATE TABLE IF NOT EXISTS method (
  id_method SERIAL PRIMARY KEY,
  method VARCHAR(255) NOT NULL
);

-- Tabel upload_history
CREATE TABLE IF NOT EXISTS upload_history (
  id_upload SERIAL PRIMARY KEY,
  file_name VARCHAR(255),
  system_name VARCHAR(255),
  status VARCHAR(50),
  note TEXT,
  total_rows INTEGER,
  uploaded_by VARCHAR(255),
  uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel transaction (tabel utama penjualan)
CREATE TABLE IF NOT EXISTS transaction (
  id_transaction SERIAL PRIMARY KEY,
  id_retailer INTEGER REFERENCES retailer(id_retailer),
  id_product INTEGER REFERENCES product(id_product),
  id_method INTEGER REFERENCES method(id_method),
  id_city INTEGER REFERENCES city(id_city),
  id_upload INTEGER REFERENCES upload_history(id_upload),
  invoice_date DATE NOT NULL,
  price_per_unit DECIMAL(15,2),
  unit_sold INTEGER,
  total_sales DECIMAL(15,2) NOT NULL,
  operating_profit DECIMAL(15,2) NOT NULL,
  operating_margin DECIMAL(5,4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_approved BOOLEAN DEFAULT false
);

-- Index untuk performa query
CREATE INDEX IF NOT EXISTS idx_transaction_invoice_date ON transaction(invoice_date);
CREATE INDEX IF NOT EXISTS idx_transaction_id_retailer ON transaction(id_retailer);
CREATE INDEX IF NOT EXISTS idx_transaction_id_product ON transaction(id_product);
CREATE INDEX IF NOT EXISTS idx_transaction_id_method ON transaction(id_method);
CREATE INDEX IF NOT EXISTS idx_transaction_id_city ON transaction(id_city);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE state ENABLE ROW LEVEL SECURITY;
ALTER TABLE city ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailer ENABLE ROW LEVEL SECURITY;
ALTER TABLE product ENABLE ROW LEVEL SECURITY;
ALTER TABLE method ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;

-- Policy untuk akses data (use OR REPLACE)
DROP POLICY IF EXISTS "Allow all access to users" ON users;
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to state" ON state;
CREATE POLICY "Allow all access to state" ON state FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to city" ON city;
CREATE POLICY "Allow all access to city" ON city FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to retailer" ON retailer;
CREATE POLICY "Allow all access to retailer" ON retailer FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to product" ON product;
CREATE POLICY "Allow all access to product" ON product FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to method" ON method;
CREATE POLICY "Allow all access to method" ON method FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to upload_history" ON upload_history;
CREATE POLICY "Allow all access to upload_history" ON upload_history FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all access to transaction" ON transaction;
CREATE POLICY "Allow all access to transaction" ON transaction FOR ALL USING (true);
