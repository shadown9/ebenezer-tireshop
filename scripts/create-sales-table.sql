-- Create sales table for transaction history
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date TIMESTAMP NOT NULL DEFAULT NOW(),
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  sale_items JSONB NOT NULL, -- Array of {product_name, quantity, unit_price, total_price}
  total_amount NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50), -- cash, credit, debit, check
  notes TEXT,
  created_by UUID, -- Reference to admin_users.id
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create product_catalog table for products not in public inventory
CREATE TABLE IF NOT EXISTS product_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name VARCHAR(255) NOT NULL UNIQUE,
  product_type VARCHAR(50), -- tire, service, part, accessory
  base_price NUMERIC(10,2) NOT NULL,
  is_visible_public BOOLEAN DEFAULT false, -- Only show on public if true
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_created_by ON sales(created_by);
CREATE INDEX IF NOT EXISTS idx_product_catalog_type ON product_catalog(product_type);
