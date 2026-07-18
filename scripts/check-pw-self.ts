import { hashPassword, verifyPassword } from '@/lib/password'

async function main() {
  const h = await hashPassword('Demo1234!')
  console.log('hash:', h.slice(0, 20), '...')
  console.log('verify same =>', await verifyPassword('Demo1234!', h))
  console.log('verify wrong =>', await verifyPassword('x', h))
  process.exit(0)
}
main().catch(e => { console.error('FOUT:', e); process.exit(1) })
