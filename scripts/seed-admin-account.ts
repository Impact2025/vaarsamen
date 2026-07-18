// Seed een echt admin-account (e-mail + wachtwoord) voor chat@weareimpact.nl.
// Idempotent: upsert op email, zet is_admin + password_hash.
// Run: export DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)" && node_modules/.bin/tsx scripts/seed-admin-account.ts

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/password'

const EMAIL = 'chat@weareimpact.nl'
const WACHTWOORD = 'Demo1234!'
const NAAM = 'Vincent (WeAreImpact)'

async function main() {
  const hash = await hashPassword(WACHTWOORD)
  await db.insert(users).values({
    id: 'aadde900-0000-0000-0000-000000000002',
    email: EMAIL,
    name: NAAM,
    emailVerified: new Date('2026-01-01'),
    isAdmin: true,
    passwordHash: hash,
  }).onConflictDoUpdate({
    target: users.email,
    set: { name: NAAM, isAdmin: true, passwordHash: hash, emailVerified: new Date('2026-01-01') },
  })
  console.log(`[seed] admin ${EMAIL} klaar (is_admin=true, wachtwoord gezet).`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
