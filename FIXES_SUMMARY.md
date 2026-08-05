# Auto-Logout Issue - Root Cause and Fix

## Problem
When a trainee navigates to "My Applications > Browse Programs", the app automatically logs them out and shows the login modal.

## Root Cause
The `/trainees/me` endpoint requires the `mobile_app_access` feature flag to be enabled (Req 23.4). This flag is disabled by default for new tenants, causing the endpoint to return a 403 Forbidden response. When the API call fails, the frontend's AuthContext detects the error and logs out the user.

**Code Location**: `Backend/src/app/api/trainees/me/route.ts` (lines 59-63)
```typescript
// Feature gate: mobile_app_access must be enabled for this tenant (Req 23.4)
if (traineeData?.tenant_id) {
  const featureCheck = await requireFeature(traineeData.tenant_id, FeatureKey.MOBILE_APP_ACCESS);
  if (featureCheck) return featureCheck as any;  // Returns 403 if flag disabled
}
```

## Solution Implemented

### 1. Updated Tenant Provisioning Service
**File**: `Backend/src/services/tenantProvisioningService.ts` (lines 433-444)

Changed the default feature flags for new tenants to enable `mobile_app_access`:
```typescript
const defaultFeatureFlags = [
  { tenant_id: tenant.id, feature_key: 'inventory_management', enabled: true },
  { tenant_id: tenant.id, feature_key: 'certificate_generation', enabled: false },
  { tenant_id: tenant.id, feature_key: 'qr_code_attendance', enabled: false },
  { tenant_id: tenant.id, feature_key: 'mobile_app_access', enabled: true },  // ← ENABLED
  { tenant_id: tenant.id, feature_key: 'whatsapp_notifications', enabled: false },
  { tenant_id: tenant.id, feature_key: 'email_notifications', enabled: false },
];
```

**Impact**: All new tenants created in the future will have this flag enabled by default.

### 2. Created Migration File
**File**: `Backend/migrations/enable_mobile_app_access.sql`

This migration enables the flag for the existing BMDC tenant (ID: `00000000-0000-0000-0000-000000000001`):
```sql
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
```

**How to Apply**: Run this migration against your database:
```bash
psql "$DATABASE_URL" -f Backend/migrations/enable_mobile_app_access.sql
```

Or if using Supabase CLI:
```bash
supabase migration up
```

**Impact**: The existing BMDC tenant will now have the `mobile_app_access` feature enabled, allowing the `/trainees/me` endpoint to work correctly.

### 3. Fixed Pre-existing Build Errors
Fixed compilation issues related to undefined exports from `@/lib/auditLog`:
- `Backend/src/app/api/admin/pilot/route.ts` - Changed `logAuditEvent` to `logConfigChange`
- `Backend/src/app/api/admin/performance/route.ts` - Changed `logAuditEvent` to `logSecurityEvent`
- `Backend/src/app/api/admin/extension-requests/[id]/route.ts` - Changed `logAuditEvent` to `logConfigChange`
- `Backend/src/app/api/activity-logs/route.ts` - Fixed TypeScript cast for `tenant_id`

## Testing

After applying the migration, the flow should work as follows:

1. User logs in as a trainee
2. User navigates to "My Applications"
3. User clicks "Browse Programs"
4. Frontend calls `api.get('/trainees/me')`
5. Backend `/api/trainees/me` endpoint:
   - Authenticates the user from HttpOnly cookie
   - Checks `mobile_app_access` feature flag → now **ENABLED**
   - Returns the trainee profile successfully (200 OK)
6. Frontend receives the profile and displays the programs list
7. User is **NOT** logged out

## Files Modified
1. `Backend/src/services/tenantProvisioningService.ts` - Enable flag for new tenants
2. `Backend/src/app/api/admin/pilot/route.ts` - Fix audit logging import
3. `Backend/src/app/api/admin/performance/route.ts` - Fix audit logging import
4. `Backend/src/app/api/admin/extension-requests/[id]/route.ts` - Fix audit logging import
5. `Backend/src/app/api/activity-logs/route.ts` - Fix TypeScript cast
6. `Backend/migrations/enable_mobile_app_access.sql` - NEW: Enable flag for existing BMDC tenant

## Next Steps

1. **Run the migration** to enable the feature flag for the existing BMDC tenant
2. **Rebuild the backend**: `npm run build` (in Backend directory)
3. **Restart both servers**:
   - Backend: `npm run dev` (runs on port 3003)
   - Frontend: `npm run dev` (runs on port 3001)
4. **Test the flow**: Login as trainee and navigate to "My Applications > Browse Programs"

The auto-logout issue should now be resolved!
