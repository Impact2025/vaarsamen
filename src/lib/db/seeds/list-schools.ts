import { db } from '../index'
import { sailingSchools } from '../schema'

async function run() {
  const schools = await db.select().from(sailingSchools)
  console.log(JSON.stringify(schools.map(s => ({ id: s.id, name: s.name, slug: s.slug, city: s.city })), null, 2))
  process.exit(0)
}
run().catch(e => { console.error(e); process.exit(1) })
