import { db } from '@/lib/db'
import { skillDefinitions } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'

// ─── KIELBOOT II PRAKTIJK — 18 VAARDIGHEDEN (versie 2026) ─────────────────────

const KB2_SKILLS = [
  { code: 'KB2-01', naam: 'Het schip zeilklaar maken en klaar maken voor de nacht',     sortOrder: 1  },
  { code: 'KB2-02', naam: 'Verhalen van het schip',                                      sortOrder: 2  },
  { code: 'KB2-03', naam: 'Stilliggend hijsen en strijken van de zeilen',                sortOrder: 3  },
  { code: 'KB2-04', naam: 'Omgaan met de buitenboordmotor',                              sortOrder: 4  },
  { code: 'KB2-05', naam: 'Afvaren van hogerwal',                                        sortOrder: 5  },
  { code: 'KB2-06', naam: 'Stand en bediening van de zeilen',                            sortOrder: 6  },
  { code: 'KB2-07', naam: 'Overstag gaan',                                               sortOrder: 7  },
  { code: 'KB2-08', naam: 'Afmeren van het "eigen" schip',                               sortOrder: 8  },
  { code: 'KB2-09', naam: 'Terminologie',                                                sortOrder: 9  },
  { code: 'KB2-10', naam: 'Toepassen van de reglementen',                                sortOrder: 10 },
  { code: 'KB2-11', naam: 'Kunnen reven op het "eigen" schip',                           sortOrder: 11 },
  { code: 'KB2-12', naam: 'Opkruisen in nauw vaarwater',                                 sortOrder: 12 },
  { code: 'KB2-13', naam: 'Gijpen (ook in nauw vaarwater) en gijpen kunnen vermijden (stormrondje)', sortOrder: 13 },
  { code: 'KB2-14', naam: 'Aankomen aan hogerwal; Opschieter',                           sortOrder: 14 },
  { code: 'KB2-15', naam: 'Sliplanding (+slippend kunnen varen)',                        sortOrder: 15 },
  { code: 'KB2-16', naam: '"Man over boord" manoeuvre kunnen uitvoeren',                 sortOrder: 16 },
  { code: 'KB2-17', naam: 'Loskomen van de grond',                                       sortOrder: 17 },
  { code: 'KB2-18', naam: 'Solo gevaren',                                                sortOrder: 18 },
] as const

// ─── SEED FUNCTIE ─────────────────────────────────────────────────────────────
// Upsert-safe: kan meerdere keren veilig aangeroepen worden

export async function seedKB2Skills() {
  const values = KB2_SKILLS.map(s => ({
    cwoLevel:  'cwo_kielboot2' as const,
    code:      s.code,
    naam:      s.naam,
    sortOrder: s.sortOrder,
  }))

  await db
    .insert(skillDefinitions)
    .values(values)
    .onConflictDoUpdate({
      target: [skillDefinitions.cwoLevel, skillDefinitions.code],
      set: {
        naam:      sql`excluded.naam`,
        sortOrder: sql`excluded.sort_order`,
      },
    })

  return { seeded: values.length, level: 'cwo_kielboot2' }
}

// ─── DIRECTE RUN (npx tsx src/lib/db/seeds/skills.ts) ────────────────────────

if (require.main === module) {
  seedKB2Skills()
    .then(r => { console.log(`✓ ${r.seeded} skills geseed voor ${r.level}`); process.exit(0) })
    .catch(e => { console.error('Seed mislukt:', e); process.exit(1) })
}
