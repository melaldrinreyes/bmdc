-- Create missing critical tables
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users_tenants (
  user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_primary BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, tenant_id)
);

CREATE TABLE IF NOT EXISTS revoked_tokens (
  jti        TEXT        PRIMARY KEY,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);

-- Link existing users to the default tenant (if it exists)
INSERT INTO users_tenants (user_id, tenant_id, is_primary, created_at)
SELECT u.id, t.id, true, NOW()
FROM users u, tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM users_tenants WHERE user_id = u.id AND tenant_id = t.id
)
ON CONFLICT (user_id, tenant_id) DO NOTHING;
