-- Run this in Supabase SQL Editor to create users for Adidas Dashboard

-- Insert Retailers (Adidas Retailers)
INSERT INTO retailer (retailer_name, location, description) VALUES
    ('Transmart', 'Jakarta', 'Transmart - Jakarta'),
    ('Transmart', 'Surabaya', 'Transmart - Surabaya'),
    ('Transmart', 'Bandung', 'Transmart - Bandung'),
    ('Transmart', 'Medan', 'Transmart - Medan'),
    ('Transmart', 'Makassar', 'Transmart - Makassar'),
    ('Transmart', 'Semarang', 'Transmart - Semarang'),
    ('Transmart', 'Palembang', 'Transmart - Palembang'),
    ('Transmart', 'Tangerang', 'Transmart - Tangerang'),
    ('Transmart', 'Depok', 'Transmart - Depok'),
    ('Transmart', 'Yogyakarta', 'Transmart - Yogyakarta')
ON CONFLICT (retailer_name) DO NOTHING;

-- Insert Users (Password: admin123, using MD5 hash)
-- GM (Full Access) - Can access all retailers
INSERT INTO users (email, password, name, role, position, restaurant_id, is_active) VALUES
    ('gm@adidas.id', md5('admin123'), 'General Manager Adidas', 'GM', 'GENERAL_MANAGER', NULL, true)
ON CONFLICT (email) DO NOTHING;

-- Regional Managers - Specific Region
INSERT INTO users (email, password, name, role, position, restaurant_id, is_active) VALUES
    ('manager.jakarta@adidas.id', md5('admin123'), 'Manager Jakarta', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 1, true),
    ('manager.surabaya@adidas.id', md5('admin123'), 'Manager Surabaya', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 2, true),
    ('manager.bandung@adidas.id', md5('admin123'), 'Manager Bandung', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 3, true),
    ('manager.medan@adidas.id', md5('admin123'), 'Manager Medan', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 4, true),
    ('manager.makassar@adidas.id', md5('admin123'), 'Manager Makassar', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 5, true),
    ('manager.semarang@adidas.id', md5('admin123'), 'Manager Semarang', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 6, true),
    ('manager.palembang@adidas.id', md5('admin123'), 'Manager Palembang', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 7, true),
    ('manager.tangerang@adidas.id', md5('admin123'), 'Manager Tangerang', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 8, true),
    ('manager.depok@adidas.id', md5('admin123'), 'Manager Depok', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 9, true),
    ('manager.yogyakarta@adidas.id', md5('admin123'), 'Manager Yogyakarta', 'REGIONAL_MANAGER', 'REGIONAL_MANAGER', 10, true)
ON CONFLICT (email) DO NOTHING;

-- Staff - Specific Retailer
INSERT INTO users (email, password, name, role, position, restaurant_id, is_active) VALUES
    ('staff.jakarta@adidas.id', md5('admin123'), 'Staff Jakarta', 'STAFF', 'STAFF', 1, true),
    ('staff.surabaya@adidas.id', md5('admin123'), 'Staff Surabaya', 'STAFF', 'STAFF', 2, true),
    ('staff.bandung@adidas.id', md5('admin123'), 'Staff Bandung', 'STAFF', 'STAFF', 3, true),
    ('staff.medan@adidas.id', md5('admin123'), 'Staff Medan', 'STAFF', 'STAFF', 4, true),
    ('staff.makassar@adidas.id', md5('admin123'), 'Staff Makassar', 'STAFF', 'STAFF', 5, true),
    ('staff.semarang@adidas.id', md5('admin123'), 'Staff Semarang', 'STAFF', 'STAFF', 6, true),
    ('staff.palembang@adidas.id', md5('admin123'), 'Staff Palembang', 'STAFF', 'STAFF', 7, true),
    ('staff.tangerang@adidas.id', md5('admin123'), 'Staff Tangerang', 'STAFF', 'STAFF', 8, true),
    ('staff.depok@adidas.id', md5('admin123'), 'Staff Depok', 'STAFF', 'STAFF', 9, true),
    ('staff.yogyakarta@adidas.id', md5('admin123'), 'Staff Yogyakarta', 'STAFF', 'STAFF', 10, true)
ON CONFLICT (email) DO NOTHING;

-- Display all users
SELECT u.email, u.name, u.role, u.position, r.retailer_name 
FROM users u 
LEFT JOIN retailer r ON u.restaurant_id = r.id 
ORDER BY u.role, u.position;
