-- =============================================================================
-- Seed Activity Logs for Testing
-- =============================================================================
-- This script populates the activity_logs table with sample data for testing
-- the activity history feature.
--
-- Run this AFTER seed_default_bmdc_tenant.sql has been executed.
-- =============================================================================

BEGIN;

-- Get the default tenant ID and admin user ID
-- (These should exist from seed_default_bmdc_tenant.sql)
DO $$
DECLARE
  v_tenant_id UUID;
  v_admin_user_id UUID;
  v_sample_trainee_id UUID;
  v_sample_program_id UUID;
  v_sample_item_id UUID;
BEGIN
  -- Get the default BMDC tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'BMDC' LIMIT 1;
  
  -- Get the super admin user
  SELECT id INTO v_admin_user_id FROM users WHERE email = 'superadmin@bmdc.gov.ph' LIMIT 1;
  
  -- Get a sample trainee (or use a placeholder if none exists)
  SELECT id INTO v_sample_trainee_id FROM trainees WHERE tenant_id = v_tenant_id LIMIT 1;
  
  -- Get a sample program
  SELECT id INTO v_sample_program_id FROM programs WHERE tenant_id = v_tenant_id LIMIT 1;
  
  -- Get a sample item
  SELECT id INTO v_sample_item_id FROM items WHERE tenant_id = v_tenant_id LIMIT 1;
  
  -- If we have the required data, insert sample activity logs
  IF v_tenant_id IS NOT NULL AND v_admin_user_id IS NOT NULL THEN
    
    -- Sample activity logs for demonstration
    INSERT INTO activity_logs (
      id, tenant_id, user_id, action, entity_type, entity_id, 
      details, created_at
    ) VALUES
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'login', 'user', v_admin_user_id::text,
        '{"ip": "127.0.0.1", "browser": "Chrome"}', NOW() - INTERVAL '5 minutes'
      ),
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'create', 'program', 
        COALESCE(v_sample_program_id::text, 'prog-001'),
        '{"name": "Advanced Training Program", "duration_weeks": 8}', NOW() - INTERVAL '4 minutes'
      ),
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'create', 'item', 
        COALESCE(v_sample_item_id::text, 'item-001'),
        '{"name": "Training Kit", "category": "Equipment", "quantity": 10}', NOW() - INTERVAL '3 minutes'
      ),
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'create', 'trainee', 
        COALESCE(v_sample_trainee_id::text, 'trainee-001'),
        '{"first_name": "Juan", "last_name": "Dela Cruz", "program": "Program ABC"}', NOW() - INTERVAL '2 minutes'
      ),
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'update', 'program', 
        COALESCE(v_sample_program_id::text, 'prog-001'),
        '{"name": "Advanced Training Program", "status": "active"}', NOW() - INTERVAL '1 minute'
      ),
      (
        gen_random_uuid(), v_tenant_id, v_admin_user_id, 'logout', 'user', v_admin_user_id::text,
        '{"duration_minutes": 15}', NOW()
      );
    
    RAISE NOTICE 'Sample activity logs inserted successfully';
  ELSE
    RAISE NOTICE 'Missing required tenant or user data. Please run seed_default_bmdc_tenant.sql first.';
  END IF;
END $$;

COMMIT;
