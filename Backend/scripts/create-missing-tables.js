#!/usr/bin/env node

/**
 * Script to create missing critical tables
 * Run with: npm run create-missing-tables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE credentials in .env file');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  console.log('🔨 Creating missing critical tables...\n');

  // Create users_tenants table
  console.log('1. Creating users_tenants table...');
  try {
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS users_tenants (
          user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
          tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          is_primary BOOLEAN     NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          PRIMARY KEY (user_id, tenant_id)
        );
      `
    }).catch(err => {
      // Try direct execution if rpc doesn't work
      return supabaseAdmin.from('_raw_sql').insert([{ sql: 'CREATE TABLE IF NOT EXISTS users_tenants...' }]);
    });

    // Since exec/rpc might not work, use the admin API directly
    const createUsersTenantsSQL = `
      CREATE TABLE IF NOT EXISTS users_tenants (
        user_id    UUID        NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
        tenant_id  UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        is_primary BOOLEAN     NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, tenant_id)
      );
    `;

    console.log('   ℹ️  Manual setup required: Please copy the SQL below and run it in Supabase SQL Editor\n');
    console.log('   SQL:');
    console.log('   ' + createUsersTenantsSQL.trim().split('\n').join('\n   '));
    
  } catch (err) {
    console.log(`   ⚠️  Auto-creation failed (expected). Manual setup needed.`);
  }

  // Create revoked_tokens table
  console.log('\n2. Creating revoked_tokens table...');
  try {
    const createRevokedTokensSQL = `
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        jti        TEXT        PRIMARY KEY,
        revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires ON revoked_tokens(expires_at);
    `;

    console.log('   SQL:');
    console.log('   ' + createRevokedTokensSQL.trim().split('\n').join('\n   '));
    
  } catch (err) {
    console.log(`   ⚠️  Auto-creation failed (expected). Manual setup needed.`);
  }

  // Link existing users to tenants
  console.log('\n3. Linking existing users to tenants...');
  try {
    const linkUsersSQL = `
      INSERT INTO users_tenants (user_id, tenant_id, is_primary, created_at)
      SELECT u.id, t.id, true, NOW()
      FROM users u, tenants t
      WHERE NOT EXISTS (
        SELECT 1 FROM users_tenants WHERE user_id = u.id AND tenant_id = t.id
      )
      ON CONFLICT (user_id, tenant_id) DO NOTHING;
    `;

    console.log('   SQL:');
    console.log('   ' + linkUsersSQL.trim().split('\n').join('\n   '));
    
  } catch (err) {
    console.log(`   ⚠️  Auto-linking failed (expected). Manual setup needed.`);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 MANUAL SETUP INSTRUCTIONS:\n');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "+ New Query"');
  console.log('4. Copy and paste the SQL statements above');
  console.log('5. Click "Run" to execute');
  console.log('\n   Or use the complete SQL file:');
  console.log('   Backend/migrations/create_missing_tables.sql\n');
  console.log('6. After creating the tables, run: npm run verify-supabase');
  console.log('='.repeat(70) + '\n');
}

createMissingTables().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
