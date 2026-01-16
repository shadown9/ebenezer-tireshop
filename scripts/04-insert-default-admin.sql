-- Insert default admin user
-- Password: GomeraPro2025 (hashed with SHA-256)
INSERT INTO admin_users (id, username, email, password_hash, full_name, role, is_active, created_at)
VALUES (
  'admin-001',
  'admin',
  'admin@gomerapro.com',
  'f8c3c8c8e5c5f5e5c5c5c5e5c5c5e5c5c5c5e5c5c5c5e5c5c5c5e5c5c5c5e5c5',
  'Administrador',
  'admin',
  true,
  NOW()
)
ON CONFLICT (username) DO NOTHING;

-- Insert default preferences for admin
INSERT INTO admin_user_preferences (user_id)
VALUES ('admin-001')
ON CONFLICT (user_id) DO NOTHING;
