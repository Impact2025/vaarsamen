const BASE = 'https://www.vaarsamen.nl'
async function check(path) {
  const r = await fetch(BASE + path, { redirect: 'manual' })
  const body = await r.text()
  console.log(path, '->', r.status, r.headers.get('location') || '', '| title:', (body.match(/<title>([^<]*)<\/title>/) || [])[1] || '(geen)')
}
async function main() {
  await check('/admin/login')
  await check('/admin')
  await check('/pro/login')
  await check('/pro')
}
main().catch(e => { console.error(e); process.exit(1) })
