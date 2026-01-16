-- CMS Banners Table
CREATE TABLE IF NOT EXISTS cms_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CMS Gallery Table  
CREATE TABLE IF NOT EXISTS cms_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_cms_banners_active ON cms_banners(active);
CREATE INDEX IF NOT EXISTS idx_cms_gallery_order ON cms_gallery(display_order);

-- Keeping only the current banner, removed placeholder gallery photos
-- Insert sample banner
INSERT INTO cms_banners (title, description, image_url, active) VALUES
('Welcome to Ebenezer Tireshop', 'Professional tire and auto service you can trust', '/placeholder.svg?height=600&width=1920', TRUE)
ON CONFLICT DO NOTHING;

-- Gallery starts empty - admin can add photos through the CMS interface
