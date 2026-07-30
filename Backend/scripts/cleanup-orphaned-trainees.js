#!/usr/bin/env node
/**
 * Cleanup script: removes orphaned trainee rows that have no linked trainee_accounts entry.
 * These are created when the account creation step fails mid-way during trainee registration.
 *
 * Run with: node scripts/cleanup-orphaned-trainees.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupOrphanedTrainees() {
  console.log('🔍 Finding orphaned trainees (no linked trainee_accounts row)...\n');

  // Fetch all trainees
  const { data: trainees, error: fetchError } = await supabase
    .from('trainees')
    .select('id, first_name, last_name, email, created_at');

  if (fetchError) {
    console.error('❌ Failed to fetch trainees:', fetchError.message);
    process.exit(1);
  }

  // Fetch all linked trainee IDs
  const { data: accounts, error: accountsError } = await supabase
    .from('trainee_accounts')
    .select('trainee_id');

  if (accountsError) {
    console.error('❌ Failed to fetch trainee_accounts:', accountsError.message);
    process.exit(1);
  }

  const linkedIds = new Set((accounts || []).map(a => a.trainee_id));
  const orphans = (trainees || []).filter(t => !linkedIds.has(t.id));

  // Only auto-delete orphans created recently (within 24 hours).
  // Old trainees without accounts are intentional demo/seed records.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recentOrphans = orphans.filter(t => t.created_at > cutoff);
  const oldOrphans = orphans.filter(t => t.created_at <= cutoff);

  if (orphans.length === 0) {
    console.log('✅ No orphaned trainees found. Database is clean.');
    return;
  }

  console.log(`⚠️  Found ${orphans.length} orphaned trainee(s) total:\n`);
  orphans.forEach(t => {
    const age = t.created_at > cutoff ? '⏱️  recent' : '📦 old/seed';
    console.log(`   [${age}] [${t.id}] ${t.first_name} ${t.last_name} <${t.email}> (created: ${t.created_at})`);
  });

  if (oldOrphans.length > 0) {
    console.log(`\nℹ️  Skipping ${oldOrphans.length} older orphan(s) — likely intentional demo/seed data.`);
    console.log('   To delete them too, run with --all flag.');
  }

  const toDelete = process.argv.includes('--all') ? orphans : recentOrphans;

  if (toDelete.length === 0) {
    console.log('\n✅ No recent orphans to delete. Database is clean.');
    return;
  }

  console.log(`\n🗑️  Deleting ${toDelete.length} orphaned trainee row(s)...`);

  const idsToDelete = toDelete.map(t => t.id);
  const { error: deleteError } = await supabase
    .from('trainees')
    .delete()
    .in('id', idsToDelete);

  if (deleteError) {
    console.error('❌ Failed to delete orphaned trainees:', deleteError.message);
    process.exit(1);
  }

  console.log(`✅ Deleted ${toDelete.length} orphaned trainee(s) successfully.`);
  console.log('\nThose trainees can now be re-registered without a duplicate email error.');
}

cleanupOrphanedTrainees().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
