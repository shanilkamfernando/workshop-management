-- Workshop Database Setup Script for Production
-- Run this script in your Render PostgreSQL database after deployment

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create partners table
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    partner_id INTEGER REFERENCES partners(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create data_entries table
CREATE TABLE IF NOT EXISTS data_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(255),
    product VARCHAR(255),
    quantity VARCHAR(100),
    description TEXT,
    user_datetime TIMESTAMP,
    due_date DATE,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Office fields
    order_form_no VARCHAR(255),
    notes TEXT,
    office_user_1 VARCHAR(255),
    office_datetime_1 TIMESTAMP,
    
    -- Approval
    approved BOOLEAN DEFAULT FALSE,
       approved_by VARCHAR(255), 
    
    -- PO fields
    po_no VARCHAR(255),
    office_user_2 VARCHAR(255),
    office_datetime_2 TIMESTAMP,
    
    -- Invoice fields
    invoice_no VARCHAR(255),
    office_user_3 VARCHAR(255),
    office_datetime_3 TIMESTAMP,
    
    -- Driver/Delivery fields
    purchase_date DATE,
    drivers_name VARCHAR(255),
    vehicle_no VARCHAR(100),
    received VARCHAR(255),
    driver_description TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

await pool.query(`
      ALTER TABLE data_entries 
      ADD COLUMN IF NOT EXISTS approved_by VARCHAR(255)
    `);


-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_partner_id ON projects(partner_id);
CREATE INDEX IF NOT EXISTS idx_entries_project_id ON data_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_entries_user_id ON data_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_entries_approved ON data_entries(approved);

-- Insert default admin user (password: admin123)
-- You should change this password after first login!
INSERT INTO users (username, email, password_hash, role)
VALUES (
    'admin',
    NULL,
    '$2b$10$YourHashedPasswordHere', -- You'll need to generate this
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE 'Tables created: users, partners, projects, data_entries';
    RAISE NOTICE '⚠️  IMPORTANT: Change the admin password after first login!';
END $$;