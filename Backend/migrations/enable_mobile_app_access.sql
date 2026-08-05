-- =============================================================================
-- enable_mobile_app_access.sql
-- Enable the mobile_app_access feature flag for the default BMDC tenant
-- 
-- This enables the /api/trainees/me endpoint which was previously blocked by
-- the MOBILE_APP_ACCESS feature gate (Req 23.4).
-- 
-- Usage: psql "$DATABASE_URL" -f migrations/enable_mobile_app_access.sql
-- =============================================================================

BEGIN;

-- Update or insert the mobile_app_access feature flag for BMDC tenant
INSERT INTO feature_flags (tenant_id, feature_key, enabled, configuration, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'mobile_app_access',
  true,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (tenant_id, feature_key) 
DO UPDATE SET 
  enabled = true,
  updated_at = NOW();

-- Verify the update
SELECT tenant_id, feature_key, enabled, updated_at 
FROM feature_flags 
WHERE tenant_id = '00000000-0000-0000-0000-000000000001' 
  AND feature_key = 'mobile_app_access';

COMMIT;
