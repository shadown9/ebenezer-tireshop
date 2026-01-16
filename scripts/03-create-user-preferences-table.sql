-- Create user preferences table
CREATE TABLE IF NOT EXISTS admin_user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'light',
  language TEXT DEFAULT 'es',
  timezone TEXT DEFAULT 'America/Santo_Domingo',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  session_timeout INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
