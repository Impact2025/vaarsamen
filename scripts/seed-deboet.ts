/**
 * Seed: De Boet vloot + leden
 * Doel: 10 leden (users+profiles+membership 'lid') en de volledige vloot
 * vullen in de bestaande school 'zeilschool-de-boet':
 *   - 6 kielboten   (uitgerust met rolfok + Yamaha BB-motor)
 *   - 6 poly-valken
 *   - 2 sloepen      (Boet's men, Almera)
 *   - 4 kano's
 * Idempotent: draait meerdere keren veilig (onConflictDoNothing / check op boot_nummer).
 *
 * Uitvoeren: npx tsx scripts/seed-deboet.ts
 */
import { Pool } from '@neondatabase/serverless'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/lib/db/schema'
import { eq, and, sql as SQL } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql, { schema })
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })

const SCHOOL_ID = '3a5099a5-bf9b-49f8-863c-5c40baac6ea7'

// ─── 10 LEDEN ────────────────────────────────────────────────────────────────
// Echte voornamen + achternamen (veelgebruikt in NL), unieke emails via deboet.nl.
// Gediplomeerde (cwo_) leden zodat ze in aanmerking komen voor verhuur (De Boet regels).
type Lid = {
  id: string
  email: string
  name: string
  displayName: string
  age: number
  city: string
  postcode: string
  cwo: any
  sailingRole: any
  sailingAreas: string[]
  bio: string
}

const LEDEN: Lid[] = [
  { id: 'b0e7c100-0000-0000-0000-000000000101', email: 'jan.visser@deboet.nl',  name: 'Jan Visser',         displayName: 'Jan Visser',        age: 54, city: 'Warmond',  postcode: '2361 BG', cwo: 'cwo_kielboot3', sailingRole: 'schipper',  sailingAreas: ['kagerplassen', 'rijnland', 'ijsselmeer'], bio: 'Vaste schipper op de kielvloot, vaart het liefst de Kagerplassen.' },
  { id: 'b0e7c100-0000-0000-0000-000000000102', email: 'marie.smit@deboet.nl',  name: 'Marie Smit',         displayName: 'Marie Smit',        age: 47, city: 'Oegstgeest', postcode: '2341 HL', cwo: 'cwo_kielboot2', sailingRole: 'schipper',  sailingAreas: ['kagerplassen', 'randmeren'],      bio: 'Woont aan het water en zeilt al 20 jaar op de Valk en kielboot.' },
  { id: 'b0e7c100-0000-0000-0000-000000000103', email: 'piet.jansen@deboet.nl',  name: 'Piet Jansen',        displayName: 'Piet Jansen',       age: 61, city: 'Leiden',   postcode: '2316 XC', cwo: 'cwo_kielboot3', sailingRole: 'beide',     sailingAreas: ['kagerplassen', 'zeeland'],        bio: 'Ervaren wedstrijdzeiler, helpt graag nieuwe leden met trimmen.' },
  { id: 'b0e7c100-0000-0000-0000-000000000104', email: 'anna.dewit@deboet.nl',   name: 'Anna de Wit',        displayName: 'Anna de Wit',       age: 33, city: 'Sassenheim', postcode: '2171 HD', cwo: 'cwo_kielboot1', sailingRole: 'bemanning', sailingAreas: ['kagerplassen', 'rijnland'],      bio: 'Bemanningslid, leert nog steeds elke keer bij op de kielboot.' },
  { id: 'b0e7c100-0000-0000-0000-000000000105', email: 'koen.bakker@deboet.nl',  name: 'Koen Bakker',       displayName: 'Koen Bakker',       age: 29, city: 'Leiderdorp', postcode: '2353 GP', cwo: 'cwo_kielboot2', sailingRole: 'beide',     sailingAreas: ['kagerplassen', 'ijsselmeer'],   bio: 'Jonge schipper, fanatiek in de weekenden.' },
  { id: 'b0e7c100-0000-0000-0000-000000000106', email: 'lies.vandijk@deboet.nl',  name: 'Lies van Dijk',      displayName: 'Lies van Dijk',     age: 42, city: 'Warmond',  postcode: '2361 XR', cwo: 'cwo_kielboot1', sailingRole: 'bemanning', sailingAreas: ['kagerplassen'],                bio: 'Geniet van toervaren en gezellige dagtochten.' },
  { id: 'b0e7c100-0000-0000-0000-000000000107', email: 'tom.mulder@deboet.nl',    name: 'Tom Mulder',        displayName: 'Tom Mulder',        age: 38, city: 'Oegstgeest', postcode: '2342 KD', cwo: 'cwo_kielboot2', sailingRole: 'schipper',  sailingAreas: ['kagerplassen', 'randmeren'],    bio: 'Schipper met voorliefde voor de poly-valk.' },
  { id: 'b0e7c100-0000-0000-0000-000000000108', email: 'sara.vos@deboet.nl',      name: 'Sara Vos',           displayName: 'Sara Vos',           age: 51, city: 'Leiden',   postcode: '2332 AJ', cwo: 'cwo_kielboot3', sailingRole: 'schipper',  sailingAreas: ['kagerplassen', 'zeeland'],       bio: 'Wedstrijd-ervaring, zeilt de zomer op de kielboot.' },
  { id: 'b0e7c100-0000-0000-0000-000000000109', email: 'bram.hendriks@deboet.nl', name: 'Bram Hendriks',     displayName: 'Bram Hendriks',     age: 24, city: 'Sassenheim', postcode: '2171 KA', cwo: 'cwo_kielboot1', sailingRole: 'bemanning', sailingAreas: ['kagerplassen', 'rijnland'],    bio: 'Jongste lid, leert snel en vaart graag mee.' },
  { id: 'b0e7c100-0000-0000-0000-000000000110', email: 'noor.peeters@deboet.nl',   name: 'Noor Peeters',      displayName: 'Noor Peeters',      age: 36, city: 'Leiderdorp', postcode: '2351 CE', cwo: 'cwo_kielboot2', sailingRole: 'beide',     sailingAreas: ['kagerplassen', 'ijsselmeer'],   bio: 'Actief lid, combineert sloep en kielboot graag.' },
]

// ─── VLOOT ───────────────────────────────────────────────────────────────────
// bootNummer is uniek per school in de vorderingenstaat.
const YAMAHA = 'Rolfok + Yamaha BB-motor (buitenboord)'

const KIELBOTEN = Array.from({ length: 6 }, (_, i) => ({
  bootNummer: `KB-${i + 1}`,
  bootType: 'kielboot' as const,
  naam: `Kielboot ${i + 1}`,
  capacity: 5,
  uitrusting: YAMAHA,
  opmerkingen: 'Uitgerust met rolfok en Yamaha BB-motor',
}))

const POLYVALKEN = Array.from({ length: 6 }, (_, i) => ({
  bootNummer: `PV-${i + 1}`,
  bootType: 'polyvalk' as const,
  naam: `Poly-Valk ${i + 1}`,
  capacity: 4,
  uitrusting: null,
  opmerkingen: 'Polyvalk (polyester Valk)',
}))

const SLOEPEN = [
  { bootNummer: 'SL-1', bootType: 'sloep' as const, naam: "Boet's men", capacity: 8,  uitrusting: 'Buitenboordmotor', opmerkingen: 'Alleen voor bevoegde Boet-leden; blokverhuur 10:00/14:00/18:00.' },
  { bootNummer: 'SL-2', bootType: 'sloep' as const, naam: 'Almera',     capacity: 6,  uitrusting: 'Buitenboordmotor', opmerkingen: 'Alleen voor bevoegde Boet-leden; blokverhuur 10:00/14:00/18:00.' },
]

const KANOS = Array.from({ length: 4 }, (_, i) => ({
  bootNummer: `KA-${i + 1}`,
  bootType: 'kano' as const,
  naam: `Kano ${i + 1}`,
  capacity: 2,
  uitrusting: null,
  opmerkingen: '€5,- per (halve) dag; kinderen t/m 15 jaar half tarief.',
}))

const VLOOT = [...KIELBOTEN, ...POLYVALKEN, ...SLOEPEN, ...KANOS]

async function main() {
  // ── LEDEN ───────────────────────────────────────────────────────────────
  for (const l of LEDEN) {
    await db.insert(schema.users)
      .values({ id: l.id, email: l.email, name: l.name, emailVerified: new Date() })
      .onConflictDoNothing()

    await db.insert(schema.profiles)
      .values({
        userId: l.id,
        displayName: l.displayName,
        age: l.age,
        city: l.city,
        postcode: l.postcode,
        homePort: 'MZV De Boet',
        bio: l.bio,
        cwoLevel: l.cwo,
        cwoVerified: true,
        sailingRole: l.sailingRole,
        lookingFor: 'alles',
        sailingAreas: l.sailingAreas,
        isOnboarded: true,
        isVisible: true,
      })
      .onConflictDoNothing()

    await db.insert(schema.schoolMemberships)
      .values({
        schoolId: SCHOOL_ID,
        userId: l.id,
        role: 'lid',
        lifecycleStatus: 'actief',
        status: 'goedgekeurd',
        nieuwsbrief: true,
      })
      .onConflictDoNothing()
  }
  console.log(`✓ ${LEDEN.length} leden verwerkt`)

  // ── VLOOT ─────────────────────────────────────────────────────────────────
  let added = 0
  for (const b of VLOOT) {
    const exists = await db
      .select({ id: schema.schoolFleet.id })
      .from(schema.schoolFleet)
      .where(and(eq(schema.schoolFleet.schoolId, SCHOOL_ID), eq(schema.schoolFleet.bootNummer, b.bootNummer)))
      .limit(1)
    if (exists.length) continue
    await db.insert(schema.schoolFleet).values({
      schoolId: SCHOOL_ID,
      bootNummer: b.bootNummer,
      bootType: b.bootType,
      naam: b.naam,
      capacity: b.capacity,
      uitrusting: b.uitrusting ?? null,
      opmerkingen: b.opmerkingen ?? null,
    })
    added++
  }
  const total = await db
    .select({ c: SQL<number>`count(*)` })
    .from(schema.schoolFleet)
    .where(eq(schema.schoolFleet.schoolId, SCHOOL_ID))
  console.log(`✓ Vloot: ${added} nieuw toegevoegd, ${total[0].c} totaal in De Boet`)

  await pool.end()
}

main().catch(async (e) => { console.error(e); await pool.end(); process.exit(1) })
