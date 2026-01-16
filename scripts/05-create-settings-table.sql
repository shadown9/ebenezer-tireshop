-- Create business settings table
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name VARCHAR(255) NOT NULL,
  tagline TEXT,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  hours JSONB DEFAULT '{}',
  social_media JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default business settings
INSERT INTO business_settings (business_name, tagline, address, city, state, zip_code, phone, email, hours, social_media)
VALUES (
  'Ebenezer Tireshop',
  'Professional Tire Shop & Auto Service',
  '507 Hawthone Ave',
  'Newark',
  'New Jersey',
  '01772',
  '(555) 123-4567',
  'info@ebenezertires.com',
  '{"monday":"8:00 AM - 6:00 PM","tuesday":"8:00 AM - 6:00 PM","wednesday":"8:00 AM - 6:00 PM","thursday":"8:00 AM - 6:00 PM","friday":"8:00 AM - 6:00 PM","saturday":"9:00 AM - 4:00 PM","sunday":"Closed"}',
  '{"facebook":"","instagram":"","twitter":"","website":""}'
)
ON CONFLICT (id) DO NOTHING;
