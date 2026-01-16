-- Clean CMS data and keep only one banner
-- Version 07: Remove duplicates and placeholders

-- Delete all existing gallery photos (they're just placeholders)
DELETE FROM gallery_photos;

-- Delete all existing banners
DELETE FROM banners;

-- Inserting only one banner without placeholder image URL
INSERT INTO banners (title, description, image_url, link, active, display_order)
VALUES (
  'Welcome to Ebenezer Tireshop',
  'Professional tire and auto service you can trust',
  '',
  '/services',
  true,
  1
)
ON CONFLICT DO NOTHING;
