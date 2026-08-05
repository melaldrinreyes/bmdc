const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  const criticalTables = [
    'refresh_tokens',
    'revoked_tokens',
    'cms_settings',
    'users_tenants',
    'tenants',
    'enrollments',
    'attendance',
    'certificates',
    'activity_logs',
    'audit_logs'
  ];

  console.log('Checking critical tables...\n');
  
  for (const table of criticalTables) {
    try {
      const { count, error } = await supabaseAdmin
        .from(table)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists (${count} records)`);
      }
    } catch (err) {
      console.log(`⚠️  ${table}: ${err.message}`);
    }
  }
}

checkTables().catch(console.error);
