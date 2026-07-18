import { hashPassword, verifyPassword } from '@/lib/password'

async function main() {
  const h = await hashPassword('Demo1234!')
  console.log('RAW HASH:', h)
  console.log('LENGTH:', h.length)
  // toon ook de losse stukken
  const [a, b, c, d] = h.split('$')
  console.log('a(prefix):', a)
  console.log('b(salt?):', b, 'len', b?.length)
  console.log('c(iter?):', c, 'len', c?.length)
  console.log('d(hash?):', d?.slice(0, 20), 'len', d?.length)
  console.log('verify =>', await verifyPassword('Demo1234!', h))
  process.exit(0)
}
main().catch(e => { console.error('FOUT:', e); process.exit(1) })
