// Seed een wachtwoord op het demo school-eigenaar account (eigenaar.demo@vaarsamen.nl)
// zodat /pro/login (school-password provider) live te testen is. Idempotent: upsert op email.
// Run: node_modules/.bin/tsx scripts/seed-school-owner.ts  (env uit .env.local wordt automatisch geladen)

import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/password'

const EMAIL = 'eigenaar.demo@vaarsamen.nl'
const WACHTWOORD = 'Demo1234!'
const NAAM = 'Jan de Boer (Demo Zeilschool)'

async function main() {
  const hash = await hashPassword(WACHTWOORD)
  await db.insert(users).values({
    id: 'aadde100-0000-0000-0000-000000000002', // DEMO_EIGENAAR_ID
    email: EMAIL,
    name: NAAM,
    emailVerified: new Date('2026-01-01'),
    isAdmin: false,
    passwordHash: hash,
  }).onConflictDoUpdate({
    target: users.email,
    set: { name: NAAM, isAdmin: false, passwordHash: hash, emailVerified: new Date('2026-01-01') },
  })
  console.log(`[seed] school-eigenaar ${EMAIL} klaar (wachtwoord gezet, isAdmin=false).`)
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
