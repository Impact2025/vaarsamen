import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword } from '@/lib/password'

async function main() {
  const [u] = await db.select().from(users).where(eq(users.email, 'chat@weareimpact.nl')).limit(1)
  console.log('gevonden:', !!u, '| isAdmin:', u?.isAdmin, '| hashPrefix:', u?.passwordHash?.slice(0, 12))
  if (u?.passwordHash) {
    console.log('verify Demo1234! =>', await verifyPassword('Demo1234!', u.passwordHash))
    console.log('verify WRONG    =>', await verifyPassword('wrong', u.passwordHash))
  }
  process.exit(0)
}
main().catch(e => { console.error('FOUT:', e); process.exit(1) })
