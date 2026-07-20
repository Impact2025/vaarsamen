const BASE = 'https://www.vaarsamen.nl'
async function check(path) {
  const r = await fetch(BASE + path, { redirect: 'manual' })
  const body = await r.text()
  console.log(path, '->', r.status, '| loc:', r.headers.get('location') || '(none)',
    '| bodyLen:', body.length,
    '| head:', JSON.stringify(body.slice(0, 120)))
}
check('/admin/login').catch(e => console.error(e))
