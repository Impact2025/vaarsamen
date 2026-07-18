// Idempotente delta: voeg password_hash kolom toe aan users (bestaande tabel).
// Run: export DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)" && node_modules/.bin/tsx scripts/delta-password-hash.ts

import { pool } from '@/lib/db'

async function main() {
  const r = await pool.query(
    `SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'`,
  )
  if (r.rowCount && r.rowCount > 0) {
    console.log('[delta] password_hash bestaat al — skipt.')
  } else {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash varchar(200)`)
    console.log('[delta] password_hash toegevoegd.')
  }
  await pool.end()
}
main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
