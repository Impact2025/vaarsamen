import { db } from '@/lib/db'
import {
  users, sailingSchools, schoolMemberships, schoolCourses, schoolFleet,
  schoolLessons, lessonStudents, skillDefinitions, skillAssessments,
  lessonNotes, schoolInvites, boatRentals,
} from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { seedKB2Skills } from './skills'

// ─── VASTE DEMO UUIDs ─────────────────────────────────────────────────────────
// Idempotent: seed kan meerdere keren veilig worden uitgevoerd

export const DEMO_SCHOOL_ID       = 'aadde100-0000-0000-0000-000000000001'
export const DEMO_EIGENAAR_ID     = 'aadde100-0000-0000-0000-000000000002'
export const DEMO_INSTRUCTEUR_ID  = 'aadde100-0000-0000-0000-000000000003'
export const DEMO_CURSIST_LISA    = 'aadde100-0000-0000-0000-000000000004'
export const DEMO_CURSIST_TOM     = 'aadde100-0000-0000-0000-000000000005'
export const DEMO_CURSIST_EMMA    = 'aadde100-0000-0000-0000-000000000006'
export const DEMO_CURSIST_DAAN    = 'aadde100-0000-0000-0000-000000000007'

// Demo login accounts (zichtbaar op /school/login als ALLOW_DEMO_USERS=true)
export const DEMO_ACCOUNTS = [
  {
    id:    DEMO_INSTRUCTEUR_ID,
    name:  'Petra Smit',
    email: 'instructeur.demo@vaarsamen.nl',
    label: 'Demo instructeur',
    icon:  'person_check',
  },
  {
    id:    'aadde100-0000-0000-0000-000000000004', // DEMO_CURSIST_LISA
    name:  'Lisa van der Berg',
    email: 'lisa.demo@vaarsamen.nl',
    label: 'Demo cursist',
    icon:  'school',
  },
  {
    id:    'aadde200-0000-0000-0000-000000000021', // BOET_INSTR_JAN_B_ID
    name:  'Jan Bijker',
    email: 'jan.bijker.boet@vaarsamen.nl',
    label: 'Instructeur De Boet',
    icon:  'person_check',
  },
] as const

// ─── ALLE BOET INSTRUCTEURS (kiosk login) ─────────────────────────────────────
// Gesorteerd op achternaam, zoals aangeleverd door De Boet
export const BOET_INSTRUCTEURS = [
  { id: 'aadde200-0000-0000-0000-000000000021', name: 'Jan Bijker',          email: 'jan.bijker.boet@vaarsamen.nl'           },
  { id: 'aadde200-0000-0000-0001-000000000001', name: 'Loek van Driel',      email: 'loek.vandriel.boet@vaarsamen.nl'        },
  { id: 'aadde200-0000-0000-0000-000000000022', name: 'Nico Eiselin',        email: 'nico.eiselin.boet@vaarsamen.nl'         },
  { id: 'aadde200-0000-0000-0001-000000000002', name: 'Willem Groeneveld',   email: 'willem.groeneveld.boet@vaarsamen.nl'    },
  { id: 'aadde200-0000-0000-0001-000000000003', name: 'Bob Hogervorst',      email: 'bob.hogervorst.boet@vaarsamen.nl'       },
  { id: 'aadde200-0000-0000-0000-000000000023', name: 'Bart Klinkenberg',    email: 'bart.klinkenberg.boet@vaarsamen.nl'     },
  { id: 'aadde200-0000-0000-0001-000000000004', name: 'William Klinkenberg', email: 'william.klinkenberg.boet@vaarsamen.nl'  },
  { id: 'aadde200-0000-0000-0000-000000000024', name: 'Wim Klinkenberg',     email: 'wim.klinkenberg.boet@vaarsamen.nl'      },
  { id: 'aadde200-0000-0000-0000-000000000025', name: 'Henk Letter',         email: 'henk.letter.boet@vaarsamen.nl'          },
  { id: 'aadde200-0000-0000-0001-000000000005', name: 'Evelien Meeuwissen',  email: 'evelien.meeuwissen.boet@vaarsamen.nl'   },
  { id: 'aadde200-0000-0000-0001-000000000017', name: 'Daisy Ooms',          email: 'daisy.ooms.boet@vaarsamen.nl'           },
  { id: 'aadde200-0000-0000-0001-000000000006', name: 'Marie-José van Rie',  email: 'mariejose.vanrie.boet@vaarsamen.nl'     },
  { id: 'aadde200-0000-0000-0001-000000000007', name: 'René van Riet',       email: 'rene.vanriet.boet@vaarsamen.nl'         },
  { id: 'aadde200-0000-0000-0001-000000000008', name: 'Niek van Rijswijk',   email: 'niek.vanrijswijk.boet@vaarsamen.nl'     },
  { id: 'aadde200-0000-0000-0001-000000000009', name: 'Willem de Ruiter',    email: 'willem.deruiter.boet@vaarsamen.nl'      },
  { id: 'aadde200-0000-0000-0001-000000000010', name: 'Chris van der Schee', email: 'chris.vanderschee.boet@vaarsamen.nl'    },
  { id: 'aadde200-0000-0000-0001-000000000011', name: 'René van Schie',      email: 'rene.vanschie.boet@vaarsamen.nl'        },
  { id: 'aadde200-0000-0000-0001-000000000012', name: 'Willem Smit',         email: 'willem.smit.boet@vaarsamen.nl'          },
  { id: 'aadde200-0000-0000-0001-000000000013', name: 'Arjan Stander',       email: 'arjan.stander.boet@vaarsamen.nl'        },
  { id: 'aadde200-0000-0000-0001-000000000014', name: 'Wouter Vermeersch',   email: 'wouter.vermeersch.boet@vaarsamen.nl'    },
  { id: 'aadde200-0000-0000-0001-000000000015', name: 'Adri van Waas',       email: 'adri.vanwaas.boet@vaarsamen.nl'         },
  { id: 'aadde200-0000-0000-0001-000000000016', name: 'Marco Warmerdam',     email: 'marco.warmerdam.boet@vaarsamen.nl'      },
] as const

const DEMO_COURSE_ID    = 'aadde100-0000-0000-0000-000000000010'
const DEMO_BOOT_1       = 'aadde100-0000-0000-0000-000000000021'
const DEMO_BOOT_2       = 'aadde100-0000-0000-0000-000000000022'
const DEMO_BOOT_3       = 'aadde100-0000-0000-0000-000000000023'
const DEMO_BOOT_4       = 'aadde100-0000-0000-0000-000000000024'

// ─── BLOK A / BLOK C UUIDs ────────────────────────────────────────────────────

// Blok A Ma/Wo cursisten
export const BOET_INSTR_JAN_B_ID  = 'aadde200-0000-0000-0000-000000000021'
const BOET_CURSIST_DICK    = 'aadde200-0000-0000-0000-000000000001'
const BOET_CURSIST_PAUL    = 'aadde200-0000-0000-0000-000000000002'
const BOET_CURSIST_MARCEL  = 'aadde200-0000-0000-0000-000000000003'
const BOET_CURSIST_MARTIN  = 'aadde200-0000-0000-0000-000000000004'
const BOET_CURSIST_PIETER  = 'aadde200-0000-0000-0000-000000000005'
const BOET_CURSIST_TESSA   = 'aadde200-0000-0000-0000-000000000006'
// Blok A Di/Do cursisten
const BOET_CURSIST_ROBERT  = 'aadde200-0000-0000-0000-000000000007'
const BOET_CURSIST_BOB     = 'aadde200-0000-0000-0000-000000000008'
const BOET_CURSIST_VINCENT = 'aadde200-0000-0000-0000-000000000009'
const BOET_CURSIST_RENE_DB = 'aadde200-0000-0000-0000-000000000010'
const BOET_CURSIST_JAN_S   = 'aadde200-0000-0000-0000-000000000011'
const BOET_CURSIST_GITTE   = 'aadde200-0000-0000-0000-000000000012'
// Blok C instructeurs
const BOET_INSTR_JAN_B     = BOET_INSTR_JAN_B_ID
const BOET_INSTR_NICO      = 'aadde200-0000-0000-0000-000000000022'
const BOET_INSTR_BART      = 'aadde200-0000-0000-0000-000000000023'
const BOET_INSTR_WIM       = 'aadde200-0000-0000-0000-000000000024'
const BOET_INSTR_HENK      = 'aadde200-0000-0000-0000-000000000025'
// Cursussen
const BOET_COURSE_BLOK_A_MAWO = 'aadde200-0000-0000-0000-000000000031'
const BOET_COURSE_BLOK_A_DIDO = 'aadde200-0000-0000-0000-000000000032'
const BOET_COURSE_BLOK_C      = 'aadde200-0000-0000-0000-000000000033'
// Lessen Ma/Wo (10), Di/Do (8), Blok C (4)
const BOET_LES_MAWO = Array.from({ length: 10 }, (_, i) =>
  `aadde200-0000-0000-0000-0000000000${(41 + i).toString().padStart(2, '0')}`)
const BOET_LES_DIDO = Array.from({ length: 8 }, (_, i) =>
  `aadde200-0000-0000-0000-0000000000${(51 + i).toString().padStart(2, '0')}`)
const BOET_LES_C    = Array.from({ length: 4 }, (_, i) =>
  `aadde200-0000-0000-0000-0000000000${(61 + i).toString().padStart(2, '0')}`)
// Vloot uitbreiding: sloepen + kano's
const BOET_BOOT_BOETSMEN = 'aadde100-0000-0000-0000-000000000025'
const BOET_BOOT_ALMERA   = 'aadde100-0000-0000-0000-000000000026'
const BOET_BOOT_KANO_1   = 'aadde100-0000-0000-0000-000000000027'
const BOET_BOOT_KANO_2   = 'aadde100-0000-0000-0000-000000000028'
const BOET_BOOT_KANO_3   = 'aadde100-0000-0000-0000-000000000029'
const BOET_BOOT_KANO_4   = 'aadde100-0000-0000-0000-000000000030'

// ─── DE BOET VERHUUR TARIEVEN ─────────────────────────────────────────────────

const BOET_TARIEVEN = {
  blokken: [
    { id: 'blok1',    label: 'Blok 1',    van: '10:00', tot: '14:00', omschrijving: '10:00 – 14:00 (13:45 terug)' },
    { id: 'blok2',    label: 'Blok 2',    van: '14:00', tot: '18:00', omschrijving: '14:00 – 18:00 (17:45 terug)' },
    { id: 'blok3',    label: 'Blok 3',    van: '18:00', tot: '20:00', omschrijving: '18:00 – zonsondergang'        },
    { id: '2blokken', label: '2 Blokken', van: '10:00', tot: '18:00', omschrijving: 'Blok 1 + Blok 2'             },
    { id: 'heledag',  label: 'Hele dag',  van: '10:00', tot: '18:00', omschrijving: '10:00 – 18:00'               },
  ],
  tarieven: [
    {
      naam: "Sloep (Boet's men)",
      prijzen: { blok1: 45, blok2: 45, blok3: 32.50, '2blokken': 72.50, heledag: 100 },
      extraPerUur: 10.50,
    },
    {
      naam: 'Sloep (Almera)',
      prijzen: { blok1: 40, blok2: 40, blok3: 27.50, '2blokken': 62.50, heledag: 90 },
      extraPerUur: 9.00,
    },
    {
      naam: 'Zeilboot (Valk)',
      prijzen: { heledag: 27.50 },
      opmerking: 'Tot 17:00: €22,50 · Vanaf 17:00: €13,50 · Sportdagen: €50/dag',
    },
    {
      naam: 'Kano',
      prijzen: { heledag: 5 },
      opmerking: 'Per dagdeel of hele dag · Kinderen t/m 15 jaar: half geld',
    },
  ],
  opmerkingen: [
    'Alleen voor bevoegde (gediplomeerde) Boet-leden',
    'Sloepen maximaal 3 dagen aaneengesloten (2 nachten)',
    'Na 1 september: €2,50 korting op Blok 3',
  ],
}

const DEMO_LES_IDS = [
  'aadde100-0000-0000-0000-000000000031',
  'aadde100-0000-0000-0000-000000000032',
  'aadde100-0000-0000-0000-000000000033',
  'aadde100-0000-0000-0000-000000000034',
  'aadde100-0000-0000-0000-000000000035',
  'aadde100-0000-0000-0000-000000000036',
]

const CURSISTEN = [
  { id: DEMO_CURSIST_LISA, name: 'Lisa van der Berg',  email: 'lisa.demo@vaarsamen.nl'  },
  { id: DEMO_CURSIST_TOM,  name: 'Tom Bakker',         email: 'tom.demo@vaarsamen.nl'   },
  { id: DEMO_CURSIST_EMMA, name: 'Emma de Vries',      email: 'emma.demo@vaarsamen.nl'  },
  { id: DEMO_CURSIST_DAAN, name: 'Daan Jansen',        email: 'daan.demo@vaarsamen.nl'  },
]

const LESSEN = [
  { id: DEMO_LES_IDS[0], datum: '2026-01-10', windRichting: 'ZW',  windKracht: 3 },
  { id: DEMO_LES_IDS[1], datum: '2026-01-24', windRichting: 'W',   windKracht: 4 },
  { id: DEMO_LES_IDS[2], datum: '2026-02-07', windRichting: 'NW',  windKracht: 3 },
  { id: DEMO_LES_IDS[3], datum: '2026-02-21', windRichting: 'ZZW', windKracht: 5 },
  { id: DEMO_LES_IDS[4], datum: '2026-03-07', windRichting: 'W',   windKracht: 4 },
  { id: DEMO_LES_IDS[5], datum: '2026-03-21', windRichting: 'NO',  windKracht: 2 },
]

// Boten per cursist per les (roulatie)
const BOOT_ROULATIE: Record<string, Record<string, string>> = {
  [DEMO_CURSIST_LISA]: { [DEMO_LES_IDS[0]]: DEMO_BOOT_1, [DEMO_LES_IDS[1]]: DEMO_BOOT_2, [DEMO_LES_IDS[2]]: DEMO_BOOT_1, [DEMO_LES_IDS[3]]: DEMO_BOOT_3, [DEMO_LES_IDS[4]]: DEMO_BOOT_2, [DEMO_LES_IDS[5]]: DEMO_BOOT_1 },
  [DEMO_CURSIST_TOM]:  { [DEMO_LES_IDS[0]]: DEMO_BOOT_2, [DEMO_LES_IDS[1]]: DEMO_BOOT_3, [DEMO_LES_IDS[2]]: DEMO_BOOT_4, [DEMO_LES_IDS[3]]: DEMO_BOOT_1, [DEMO_LES_IDS[4]]: DEMO_BOOT_3, [DEMO_LES_IDS[5]]: DEMO_BOOT_2 },
  [DEMO_CURSIST_EMMA]: { [DEMO_LES_IDS[0]]: DEMO_BOOT_3, [DEMO_LES_IDS[1]]: DEMO_BOOT_1, [DEMO_LES_IDS[2]]: DEMO_BOOT_2, [DEMO_LES_IDS[3]]: DEMO_BOOT_4, [DEMO_LES_IDS[4]]: DEMO_BOOT_1, [DEMO_LES_IDS[5]]: DEMO_BOOT_3 },
  [DEMO_CURSIST_DAAN]: { [DEMO_LES_IDS[0]]: DEMO_BOOT_4, [DEMO_LES_IDS[1]]: DEMO_BOOT_4, [DEMO_LES_IDS[2]]: DEMO_BOOT_3, [DEMO_LES_IDS[3]]: DEMO_BOOT_2, [DEMO_LES_IDS[4]]: DEMO_BOOT_4, [DEMO_LES_IDS[5]]: DEMO_BOOT_4 },
}

// Solovaren in laatste lessen
const SOLO: Record<string, Record<string, boolean>> = {
  [DEMO_CURSIST_LISA]: { [DEMO_LES_IDS[4]]: true, [DEMO_LES_IDS[5]]: true },
  [DEMO_CURSIST_TOM]:  { [DEMO_LES_IDS[5]]: true },
  [DEMO_CURSIST_EMMA]: {},
  [DEMO_CURSIST_DAAN]: {},
}

// ─── VOORTGANG MATRIX ─────────────────────────────────────────────────────────
// Per cursist per les per skill: score
// Skills worden opgezocht op code (KB2-01 t/m KB2-18)
// Elke cursist heeft een ander tempo

type Score = 'aangeboden' | 'matig' | 'redelijk' | 'beheerst'

// Voortgang per cursist: [les0..les5] scores voor skills [KB2-01..KB2-12]
// undefined = niet beoordeeld die les
const VOORTGANG: Record<string, (Score | null)[][]> = {
  // Lisa: snelle leerling
  [DEMO_CURSIST_LISA]: [
    // les0: KB2-01..06 aangeboden
    ['aangeboden','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null,null],
    // les1: 01-02 matig, 03-06 matig, 07-09 aangeboden
    ['matig','matig','matig','matig','matig','matig','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null],
    // les2: 01-03 redelijk, 04-06 matig, 07-09 matig, 10-11 aangeboden
    ['redelijk','redelijk','redelijk','matig','matig','matig','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null],
    // les3: 01-03 beheerst, 04-06 redelijk, 07-09 redelijk, 10-12 matig
    ['beheerst','beheerst','beheerst','redelijk','redelijk','redelijk','redelijk','redelijk','matig','matig','matig','aangeboden',null,null,null,null,null,null],
    // les4: 04-06 beheerst, 07-09 redelijk, 10-12 matig, 13-15 aangeboden
    [null,null,null,'beheerst','beheerst','beheerst','redelijk','redelijk','redelijk','matig','matig','matig','aangeboden','aangeboden',null,null,null,null],
    // les5: 10-12 redelijk, 13-15 matig, 16-18 aangeboden
    [null,null,null,null,null,null,null,null,null,'redelijk','redelijk','redelijk','matig','matig','matig','aangeboden','aangeboden','aangeboden'],
  ],
  // Tom: gemiddeld tempo
  [DEMO_CURSIST_TOM]: [
    ['aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null,null,null],
    ['matig','matig','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null],
    ['matig','matig','matig','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null],
    ['redelijk','redelijk','matig','matig','matig','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null,null],
    ['redelijk','redelijk','redelijk','redelijk','redelijk','matig','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null],
    ['beheerst','beheerst','redelijk','redelijk','redelijk','redelijk','redelijk','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null],
  ],
  // Emma: langzamer
  [DEMO_CURSIST_EMMA]: [
    ['aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null,null,null,null],
    ['aangeboden','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null,null],
    ['matig','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null],
    ['matig','matig','matig','matig','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null],
    ['redelijk','matig','matig','matig','matig','matig','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null],
    ['redelijk','redelijk','matig','matig','matig','matig','matig','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null],
  ],
  // Daan: snel in theorie, moeite met praktijk
  [DEMO_CURSIST_DAAN]: [
    ['aangeboden','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null,null],
    ['matig','matig','matig','aangeboden','aangeboden','aangeboden','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null,null],
    ['matig','matig','matig','matig','matig','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null,null,null],
    ['redelijk','matig','matig','matig','matig','redelijk','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null,null],
    ['redelijk','redelijk','matig','redelijk','redelijk','redelijk','redelijk','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null,null],
    ['beheerst','redelijk','redelijk','redelijk','redelijk','beheerst','redelijk','redelijk','matig','matig','aangeboden','aangeboden',null,null,null,null,null,null],
  ],
}

const OPMERKINGEN: { cursistId: string; lesId: string; tekst: string }[] = [
  { cursistId: DEMO_CURSIST_LISA, lesId: DEMO_LES_IDS[1], tekst: 'Goede vooruitgang bij overstag gaan. Timing verbeteren.' },
  { cursistId: DEMO_CURSIST_LISA, lesId: DEMO_LES_IDS[3], tekst: 'Uitstekende opschieter. Solo-eis bijna bereikt.' },
  { cursistId: DEMO_CURSIST_TOM,  lesId: DEMO_LES_IDS[2], tekst: 'Moeite met reven in de wind. Extra oefening nodig.' },
  { cursistId: DEMO_CURSIST_TOM,  lesId: DEMO_LES_IDS[4], tekst: 'Goede dag! Alle manoeuvres vlot uitgevoerd.' },
  { cursistId: DEMO_CURSIST_EMMA, lesId: DEMO_LES_IDS[0], tekst: 'Enthousiast maar aarzelend. Meer zelfvertrouwen nodig.' },
  { cursistId: DEMO_CURSIST_EMMA, lesId: DEMO_LES_IDS[3], tekst: 'Duidelijke verbetering in zeilstand. Goed zo!' },
  { cursistId: DEMO_CURSIST_DAAN, lesId: DEMO_LES_IDS[1], tekst: 'Theorie uitstekend, praktijk vraagt meer herhaling.' },
  { cursistId: DEMO_CURSIST_DAAN, lesId: DEMO_LES_IDS[5], tekst: 'Mooie progressie in de laatste weken. Op de goede weg.' },
]

// ─── SEED FUNCTIE ─────────────────────────────────────────────────────────────

export async function seedDemo() {
  // 1. KB2 skills seeden (idempotent)
  await seedKB2Skills()

  // Skills ophalen (nodig voor assessments)
  const skills = await db
    .select()
    .from(skillDefinitions)
    .orderBy(skillDefinitions.sortOrder)
  const kb2Skills = skills.filter(s => s.cwoLevel === 'cwo_kielboot2')

  // 2. Demo users aanmaken (upsert op email)
  const demoUsers = [
    { id: DEMO_EIGENAAR_ID,    email: 'eigenaar.demo@vaarsamen.nl',    name: 'Jan de Boer' },
    { id: DEMO_INSTRUCTEUR_ID, email: 'instructeur.demo@vaarsamen.nl', name: 'Petra Smit'  },
    ...CURSISTEN.map(c => ({ id: c.id, email: c.email, name: c.name })),
  ]

  // emailVerified ingesteld zodat dev-login en ALLOW_DEMO_USERS direct werken
  for (const u of demoUsers) {
    await db
      .insert(users)
      .values({ id: u.id, email: u.email, name: u.name, emailVerified: new Date('2026-01-01') })
      .onConflictDoUpdate({
        target: users.email,
        set: { name: u.name, id: u.id, emailVerified: new Date('2026-01-01') },
      })
  }

  // 3. Demo school aanmaken
  await db
    .insert(sailingSchools)
    .values({
      id:          DEMO_SCHOOL_ID,
      name:        'Zeilschool De Boet',
      slug:        'demo-de-boet',
      description: 'Demo zeilschool voor VaarSamen. Alles wat je ziet is voorbeelddata.',
      city:        'Loosdrecht',
      website:     'https://vaarsamen.nl',
      ownerUserId: DEMO_EIGENAAR_ID,
    })
    .onConflictDoUpdate({
      target: sailingSchools.id,
      set: { name: sql`excluded.name` },
    })

  // 4. Memberships
  const memberships = [
    { userId: DEMO_EIGENAAR_ID,    role: 'eigenaar'    as const },
    { userId: DEMO_INSTRUCTEUR_ID, role: 'instructeur' as const },
    ...CURSISTEN.map(c => ({ userId: c.id, role: 'cursist' as const })),
  ]

  for (const m of memberships) {
    await db
      .insert(schoolMemberships)
      .values({ schoolId: DEMO_SCHOOL_ID, userId: m.userId, role: m.role })
      .onConflictDoUpdate({
        target: [schoolMemberships.schoolId, schoolMemberships.userId],
        set: { role: sql`excluded.role`, deletedAt: null },
      })
  }

  // 5. Vloot
  const vloot = [
    { id: DEMO_BOOT_1, bootNummer: '1', naam: 'Valk één',   bootType: 'valk' as const },
    { id: DEMO_BOOT_2, bootNummer: '2', naam: 'Valk twee',  bootType: 'valk' as const },
    { id: DEMO_BOOT_3, bootNummer: '3', naam: 'Valk drie',  bootType: 'valk' as const },
    { id: DEMO_BOOT_4, bootNummer: '4', naam: 'Polyvalk',   bootType: 'polyvalk' as const },
  ]

  for (const b of vloot) {
    await db
      .insert(schoolFleet)
      .values({ id: b.id, schoolId: DEMO_SCHOOL_ID, bootNummer: b.bootNummer, naam: b.naam, bootType: b.bootType })
      .onConflictDoUpdate({
        target: schoolFleet.id,
        set: { bootNummer: sql`excluded.boot_nummer` },
      })
  }

  // 6. Cursus
  await db
    .insert(schoolCourses)
    .values({
      id:        DEMO_COURSE_ID,
      schoolId:  DEMO_SCHOOL_ID,
      name:      'Kielboot II Praktijk 2026',
      cwoLevel:  'cwo_kielboot2',
      startDate: '2026-01-10',
      endDate:   '2026-06-30',
    })
    .onConflictDoUpdate({
      target: schoolCourses.id,
      set: { name: sql`excluded.name` },
    })

  // 7. Lessen
  for (const les of LESSEN) {
    await db
      .insert(schoolLessons)
      .values({
        id:            les.id,
        courseId:      DEMO_COURSE_ID,
        schoolId:      DEMO_SCHOOL_ID,
        datum:         les.datum,
        windRichting:  les.windRichting,
        windKracht:    les.windKracht,
        instructeurId: DEMO_INSTRUCTEUR_ID,
      })
      .onConflictDoUpdate({
        target: schoolLessons.id,
        set: { datum: sql`excluded.datum` },
      })
  }

  // 8. Cursisten per les + beoordelingen
  for (const cursist of CURSISTEN) {
    const curProgress = VOORTGANG[cursist.id]

    for (let li = 0; li < LESSEN.length; li++) {
      const les = LESSEN[li]
      const bootId = BOOT_ROULATIE[cursist.id]?.[les.id] ?? DEMO_BOOT_1
      const soloGevaren = SOLO[cursist.id]?.[les.id] ?? false

      await db
        .insert(lessonStudents)
        .values({ lessonId: les.id, studentUserId: cursist.id, bootId, soloGevaren })
        .onConflictDoUpdate({
          target: [lessonStudents.lessonId, lessonStudents.studentUserId],
          set: { bootId: sql`excluded.boot_id`, soloGevaren: sql`excluded.solo_gevaren` },
        })

      // Beoordelingen
      const lesScores = curProgress[li] ?? []
      for (let si = 0; si < kb2Skills.length; si++) {
        const score = lesScores[si]
        if (!score) continue

        const skill = kb2Skills[si]
        await db
          .insert(skillAssessments)
          .values({
            lessonId:      les.id,
            studentUserId: cursist.id,
            skillId:       skill.id,
            score,
            instructeurId: DEMO_INSTRUCTEUR_ID,
          })
          .onConflictDoUpdate({
            target: [skillAssessments.lessonId, skillAssessments.studentUserId, skillAssessments.skillId],
            set: { score: sql`excluded.score`, updatedAt: new Date() },
          })
      }
    }
  }

  // 9. Opmerkingen
  for (const o of OPMERKINGEN) {
    await db
      .insert(lessonNotes)
      .values({
        lessonId:      o.lesId,
        studentUserId: o.cursistId,
        note:          o.tekst,
        instructeurId: DEMO_INSTRUCTEUR_ID,
      })
      .onConflictDoUpdate({
        target: [lessonNotes.lessonId, lessonNotes.studentUserId],
        set: { note: sql`excluded.note` },
      })
  }

  // 10. Uitnodigingslink (cursisten)
  await db
    .insert(schoolInvites)
    .values({
      schoolId:  DEMO_SCHOOL_ID,
      token:     'demo-cursist-link',
      role:      'cursist',
      label:     'Kielboot II 2026',
      createdBy: DEMO_EIGENAAR_ID,
    })
    .onConflictDoUpdate({
      target: schoolInvites.token,
      set: { schoolId: sql`excluded.school_id` },
    })

  // 11. Bootverhuur voorbeelden
  const verhuurData = [
    { bootId: DEMO_BOOT_1, userId: DEMO_CURSIST_LISA, datum: '2026-03-28', startTijd: '09:00', eindTijd: '13:00', opmerking: 'Solo oefenen voor het examen', status: 'goedgekeurd' as const, reactie: 'Gelukt! Fijne oefening.' },
    { bootId: DEMO_BOOT_2, userId: DEMO_CURSIST_TOM,  datum: '2026-03-29', startTijd: '10:00', eindTijd: '16:00', opmerking: 'Extra oefensessie reven',        status: 'aangevraagd' as const, reactie: null },
    { bootId: DEMO_BOOT_3, userId: DEMO_CURSIST_EMMA, datum: '2026-04-05', startTijd: '09:00', eindTijd: '17:00', opmerking: null, status: 'aangevraagd' as const, reactie: null },
  ]

  for (const v of verhuurData) {
    await db
      .insert(boatRentals)
      .values({ ...v, schoolId: DEMO_SCHOOL_ID })
      .onConflictDoUpdate({
        target: [boatRentals.bootId, boatRentals.userId, boatRentals.datum],
        set: { status: sql`excluded.status` },
      })
  }

  // 12. Verhuur tarieven voor De Boet
  await db
    .update(sailingSchools)
    .set({
      verhuurTarieven: BOET_TARIEVEN,
      updatedAt: new Date(),
    })
    .where(eq(sailingSchools.id, DEMO_SCHOOL_ID))

  // 13. Uitgebreide vloot: sloepen + kano's toevoegen
  const uitgebreideVloot = [
    { id: BOET_BOOT_BOETSMEN, bootNummer: 'S1', naam: "Boet's men", bootType: 'anders' as const },
    { id: BOET_BOOT_ALMERA,   bootNummer: 'S2', naam: 'Almera',      bootType: 'anders' as const },
    { id: BOET_BOOT_KANO_1,   bootNummer: 'K1', naam: 'Kano 1',      bootType: 'anders' as const },
    { id: BOET_BOOT_KANO_2,   bootNummer: 'K2', naam: 'Kano 2',      bootType: 'anders' as const },
    { id: BOET_BOOT_KANO_3,   bootNummer: 'K3', naam: 'Kano 3',      bootType: 'anders' as const },
    { id: BOET_BOOT_KANO_4,   bootNummer: 'K4', naam: 'Kano 4',      bootType: 'anders' as const },
  ]

  for (const b of uitgebreideVloot) {
    await db
      .insert(schoolFleet)
      .values({ id: b.id, schoolId: DEMO_SCHOOL_ID, bootNummer: b.bootNummer, naam: b.naam, bootType: b.bootType })
      .onConflictDoUpdate({
        target: schoolFleet.id,
        set: { bootNummer: sql`excluded.boot_nummer` },
      })
  }

  // 14. Blok A cursussen (Ma/Wo + Di/Do)
  const blokACursussen = [
    { id: BOET_COURSE_BLOK_A_MAWO, name: 'Blok A — Ma/Wo 2026', startDate: '2026-04-13', endDate: '2026-05-13' },
    { id: BOET_COURSE_BLOK_A_DIDO, name: 'Blok A — Di/Do 2026', startDate: '2026-04-14', endDate: '2026-05-07' },
  ]

  for (const c of blokACursussen) {
    await db
      .insert(schoolCourses)
      .values({ id: c.id, schoolId: DEMO_SCHOOL_ID, name: c.name, cwoLevel: 'cwo_kielboot2', startDate: c.startDate, endDate: c.endDate })
      .onConflictDoUpdate({
        target: schoolCourses.id,
        set: { name: sql`excluded.name` },
      })
  }

  // 15. Blok A instructeurs + cursisten aanmaken
  const blokAGebruikers = [
    // Instructeur
    { id: BOET_INSTR_JAN_B,  email: 'jan.bijker.boet@vaarsamen.nl',    name: 'Jan Bijker',              role: 'instructeur' as const },
    // Ma/Wo cursisten
    { id: BOET_CURSIST_DICK,    email: 'dick.vanleeuwen.boet@vaarsamen.nl',   name: 'Dick van Leeuwen',   role: 'cursist' as const },
    { id: BOET_CURSIST_PAUL,    email: 'paul.kortekaas.boet@vaarsamen.nl',    name: 'Paul Kortekaas',     role: 'cursist' as const },
    { id: BOET_CURSIST_MARCEL,  email: 'marcel.oussoren.boet@vaarsamen.nl',   name: 'Marcel Oussoren',    role: 'cursist' as const },
    { id: BOET_CURSIST_MARTIN,  email: 'martin.kortekaas.boet@vaarsamen.nl',  name: 'Martin Kortekaas',   role: 'cursist' as const },
    { id: BOET_CURSIST_PIETER,  email: 'pieter.geene.boet@vaarsamen.nl',      name: 'Pieter Geene',       role: 'cursist' as const },
    { id: BOET_CURSIST_TESSA,   email: 'tessa.theele.boet@vaarsamen.nl',      name: 'Tessa Theele',       role: 'cursist' as const },
    // Di/Do cursisten
    { id: BOET_CURSIST_ROBERT,  email: 'robert.nasveld.boet@vaarsamen.nl',    name: 'Robert Nasveld',     role: 'cursist' as const },
    { id: BOET_CURSIST_BOB,     email: 'bob.schuchhard.boet@vaarsamen.nl',    name: 'Bob Schuchhard',     role: 'cursist' as const },
    { id: BOET_CURSIST_VINCENT, email: 'vincent.vanmunster.boet@vaarsamen.nl',name: 'Vincent van Munster',role: 'cursist' as const },
    { id: BOET_CURSIST_RENE_DB, email: 'rene.debondt.boet@vaarsamen.nl',      name: 'René de Bondt',      role: 'cursist' as const },
    { id: BOET_CURSIST_JAN_S,   email: 'jan.schaap.boet@vaarsamen.nl',        name: 'Jan Schaap',         role: 'cursist' as const },
    { id: BOET_CURSIST_GITTE,   email: 'gitte.schaap.boet@vaarsamen.nl',      name: 'Gitte Schaap-Kleinjan', role: 'cursist' as const },
    // Blok C instructeurs
    { id: BOET_INSTR_NICO,   email: 'nico.eiselin.boet@vaarsamen.nl',    name: 'Nico Eiselin',    role: 'instructeur' as const },
    { id: BOET_INSTR_BART,   email: 'bart.klinkenberg.boet@vaarsamen.nl',name: 'Bart Klinkenberg',role: 'instructeur' as const },
    { id: BOET_INSTR_WIM,    email: 'wim.klinkenberg.boet@vaarsamen.nl', name: 'Wim Klinkenberg', role: 'instructeur' as const },
    { id: BOET_INSTR_HENK,   email: 'henk.letter.boet@vaarsamen.nl',     name: 'Henk Letter',     role: 'instructeur' as const },
  ]

  for (const u of blokAGebruikers) {
    await db
      .insert(users)
      .values({ id: u.id, email: u.email, name: u.name })
      .onConflictDoUpdate({ target: users.email, set: { name: u.name, id: u.id } })

    await db
      .insert(schoolMemberships)
      .values({ schoolId: DEMO_SCHOOL_ID, userId: u.id, role: u.role })
      .onConflictDoUpdate({
        target: [schoolMemberships.schoolId, schoolMemberships.userId],
        set: { role: sql`excluded.role`, deletedAt: null },
      })
  }

  // 16. Blok A lessen aanmaken
  // Ma/Wo: 10 lessen (13 apr – 13 mei)
  const MAWO_LESSEN = [
    { id: BOET_LES_MAWO[0], datum: '2026-04-13' },
    { id: BOET_LES_MAWO[1], datum: '2026-04-15' },
    { id: BOET_LES_MAWO[2], datum: '2026-04-20' },
    { id: BOET_LES_MAWO[3], datum: '2026-04-22' },
    { id: BOET_LES_MAWO[4], datum: '2026-04-27' },
    { id: BOET_LES_MAWO[5], datum: '2026-04-29' },
    { id: BOET_LES_MAWO[6], datum: '2026-05-04' },
    { id: BOET_LES_MAWO[7], datum: '2026-05-06' },
    { id: BOET_LES_MAWO[8], datum: '2026-05-11' },
    { id: BOET_LES_MAWO[9], datum: '2026-05-13' },
  ]

  for (const les of MAWO_LESSEN) {
    await db
      .insert(schoolLessons)
      .values({ id: les.id, courseId: BOET_COURSE_BLOK_A_MAWO, schoolId: DEMO_SCHOOL_ID, datum: les.datum, instructeurId: BOET_INSTR_JAN_B })
      .onConflictDoUpdate({ target: schoolLessons.id, set: { datum: sql`excluded.datum` } })
  }

  // Di/Do: 8 lessen (14 apr – 7 mei)
  const DIDO_LESSEN = [
    { id: BOET_LES_DIDO[0], datum: '2026-04-14' },
    { id: BOET_LES_DIDO[1], datum: '2026-04-16' },
    { id: BOET_LES_DIDO[2], datum: '2026-04-21' },
    { id: BOET_LES_DIDO[3], datum: '2026-04-23' },
    { id: BOET_LES_DIDO[4], datum: '2026-04-28' },
    { id: BOET_LES_DIDO[5], datum: '2026-04-30' },
    { id: BOET_LES_DIDO[6], datum: '2026-05-05' },
    { id: BOET_LES_DIDO[7], datum: '2026-05-07' },
  ]

  for (const les of DIDO_LESSEN) {
    await db
      .insert(schoolLessons)
      .values({ id: les.id, courseId: BOET_COURSE_BLOK_A_DIDO, schoolId: DEMO_SCHOOL_ID, datum: les.datum, instructeurId: BOET_INSTR_JAN_B })
      .onConflictDoUpdate({ target: schoolLessons.id, set: { datum: sql`excluded.datum` } })
  }

  // 17. Cursistenopkomst Blok A
  // Ma/Wo: Dick 9/10, Paul 8/10, Marcel 9/10, Martin 7/10, Pieter 9/10, Tessa 7/10
  // Afwezig = index van les (0-9)
  const MAWO_AANWEZIGHEID: Record<string, number[]> = {
    [BOET_CURSIST_DICK]:   [0,1,2,3,4,5,6,7,8],           // 9 lessen (afwezig: les 9)
    [BOET_CURSIST_PAUL]:   [0,1,2,3,4,5,6,7],              // 8 lessen (afwezig: les 8, 9)
    [BOET_CURSIST_MARCEL]: [0,1,2,3,4,5,6,7,8],           // 9 lessen
    [BOET_CURSIST_MARTIN]: [0,1,2,3,5,7,8],               // 7 lessen
    [BOET_CURSIST_PIETER]: [0,1,2,3,4,5,6,7,9],           // 9 lessen
    [BOET_CURSIST_TESSA]:  [0,1,3,4,5,6,9],               // 7 lessen
  }

  for (const [cursistId, aanwezigeIndices] of Object.entries(MAWO_AANWEZIGHEID)) {
    for (const idx of aanwezigeIndices) {
      const les = MAWO_LESSEN[idx]
      await db
        .insert(lessonStudents)
        .values({ lessonId: les.id, studentUserId: cursistId, bootId: DEMO_BOOT_1 })
        .onConflictDoUpdate({
          target: [lessonStudents.lessonId, lessonStudents.studentUserId],
          set: { bootId: sql`excluded.boot_id` },
        })
    }
  }

  // Di/Do: alle 6 cursisten aanwezig op alle 8 lessen
  const DIDO_CURSISTEN = [
    BOET_CURSIST_ROBERT, BOET_CURSIST_BOB, BOET_CURSIST_VINCENT,
    BOET_CURSIST_RENE_DB, BOET_CURSIST_JAN_S, BOET_CURSIST_GITTE,
  ]

  for (const cursistId of DIDO_CURSISTEN) {
    for (const les of DIDO_LESSEN) {
      await db
        .insert(lessonStudents)
        .values({ lessonId: les.id, studentUserId: cursistId, bootId: DEMO_BOOT_2 })
        .onConflictDoUpdate({
          target: [lessonStudents.lessonId, lessonStudents.studentUserId],
          set: { bootId: sql`excluded.boot_id` },
        })
    }
  }

  // 18. Blok C cursus (instructeursplanning 17–20 juni 2026)
  await db
    .insert(schoolCourses)
    .values({ id: BOET_COURSE_BLOK_C, schoolId: DEMO_SCHOOL_ID, name: 'Blok C 2026', cwoLevel: 'cwo_kielboot2', startDate: '2026-06-17', endDate: '2026-06-20' })
    .onConflictDoUpdate({ target: schoolCourses.id, set: { name: sql`excluded.name` } })

  // Blok C lessen: 4 actieve dagen met 3 instructeurs elk
  const BLOK_C_LESSEN_DATA = [
    { id: BOET_LES_C[0], datum: '2026-06-17', instructeurId: BOET_INSTR_BART },
    { id: BOET_LES_C[1], datum: '2026-06-18', instructeurId: BOET_INSTR_NICO },
    { id: BOET_LES_C[2], datum: '2026-06-19', instructeurId: BOET_INSTR_WIM  },
    { id: BOET_LES_C[3], datum: '2026-06-20', instructeurId: BOET_INSTR_HENK },
  ]

  for (const les of BLOK_C_LESSEN_DATA) {
    await db
      .insert(schoolLessons)
      .values({ id: les.id, courseId: BOET_COURSE_BLOK_C, schoolId: DEMO_SCHOOL_ID, datum: les.datum, instructeurId: les.instructeurId })
      .onConflictDoUpdate({ target: schoolLessons.id, set: { datum: sql`excluded.datum` } })
  }

  // 19. Blok C cursisten — de 4 hoofdcursisten volgen het intensieve blok
  // Dag 3 en 4: Lisa en Daan solo
  const BLOK_C_CURSISTEN = [
    { id: DEMO_CURSIST_LISA, bootId: DEMO_BOOT_1 },
    { id: DEMO_CURSIST_TOM,  bootId: DEMO_BOOT_2 },
    { id: DEMO_CURSIST_EMMA, bootId: DEMO_BOOT_3 },
    { id: DEMO_CURSIST_DAAN, bootId: DEMO_BOOT_4 },
  ]
  const BLOK_C_SOLO: Record<string, Record<string, boolean>> = {
    [DEMO_CURSIST_LISA]: { [BOET_LES_C[2]]: true, [BOET_LES_C[3]]: true },
    [DEMO_CURSIST_DAAN]: { [BOET_LES_C[3]]: true },
  }

  for (const c of BLOK_C_CURSISTEN) {
    for (const les of BLOK_C_LESSEN_DATA) {
      await db
        .insert(lessonStudents)
        .values({
          lessonId:      les.id,
          studentUserId: c.id,
          bootId:        c.bootId,
          soloGevaren:   BLOK_C_SOLO[c.id]?.[les.id] ?? false,
        })
        .onConflictDoUpdate({
          target: [lessonStudents.lessonId, lessonStudents.studentUserId],
          set: { bootId: sql`excluded.boot_id`, soloGevaren: sql`excluded.solo_gevaren` },
        })
    }
  }

  // 20. Blok C beoordelingen — intensief 4-daags, skills KB2-10 t/m KB2-18
  // Elke dag een andere instructeur, voortbouwend op de eerder behaalde scores
  // Skill index 9–17 = KB2-10 t/m KB2-18
  type BlokCScores = (Score | null)[][]  // [dag0..dag3][skill9..17]

  const BLOK_C_VOORTGANG: Record<string, BlokCScores> = {
    // Lisa: versneld afronden, dag 4 bijna alles beheerst
    [DEMO_CURSIST_LISA]: [
      [null, null, null, null, null, null, null, null, null,   'redelijk',  'redelijk',  'matig',     'matig',    null,        null,        null,        null,        null       ],
      ['beheerst','beheerst','beheerst',null,null,null,null,null,null,       'beheerst',  'redelijk',  'redelijk',  'matig',    'matig',     'aangeboden',null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           null,        'beheerst',  'beheerst',  'redelijk', 'redelijk',  'matig',     'matig',     'aangeboden',null       ],
      [null,null,null,null,null,null,null,null,null,           null,        null,        null,        'beheerst', 'beheerst',  'redelijk',  'redelijk',  'matig',     'beheerst' ],
    ],
    // Tom: solide progressie
    [DEMO_CURSIST_TOM]: [
      [null,null,null,null,null,null,null,null,null,           'matig',     'matig',     'aangeboden','aangeboden',null,       null,        null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'redelijk',  'matig',     'matig',     'aangeboden','aangeboden',null,       null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'redelijk',  'redelijk',  'matig',     'matig',    'aangeboden','aangeboden',null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'beheerst',  'redelijk',  'redelijk',  'matig',    'matig',     'aangeboden','aangeboden',null,        null       ],
    ],
    // Emma: langzamer, veel begeleiding nodig
    [DEMO_CURSIST_EMMA]: [
      [null,null,null,null,null,null,null,null,null,           'aangeboden','aangeboden',null,        null,       null,        null,        null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'matig',     'aangeboden','aangeboden',null,      null,        null,        null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'matig',     'matig',     'aangeboden','aangeboden',null,      null,        null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'redelijk',  'matig',     'matig',     'aangeboden','aangeboden',null,      null,        null,        null       ],
    ],
    // Daan: goed in theorie, dag 4 solo
    [DEMO_CURSIST_DAAN]: [
      [null,null,null,null,null,null,null,null,null,           'redelijk',  'matig',     'matig',     'aangeboden',null,      null,        null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'redelijk',  'redelijk',  'matig',     'matig',    'aangeboden',null,       null,        null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'beheerst',  'redelijk',  'redelijk',  'matig',    'matig',    'aangeboden','aangeboden',null,        null       ],
      [null,null,null,null,null,null,null,null,null,           'beheerst',  'beheerst',  'redelijk',  'redelijk', 'redelijk', 'matig',     'matig',    'aangeboden','aangeboden'],
    ],
  }

  for (const c of BLOK_C_CURSISTEN) {
    const curProgress = BLOK_C_VOORTGANG[c.id]
    for (let di = 0; di < BLOK_C_LESSEN_DATA.length; di++) {
      const les = BLOK_C_LESSEN_DATA[di]
      const dagScores = curProgress[di] ?? []
      for (let si = 0; si < kb2Skills.length; si++) {
        const score = dagScores[si]
        if (!score) continue
        await db
          .insert(skillAssessments)
          .values({
            lessonId:      les.id,
            studentUserId: c.id,
            skillId:       kb2Skills[si].id,
            score,
            instructeurId: les.instructeurId,
          })
          .onConflictDoUpdate({
            target: [skillAssessments.lessonId, skillAssessments.studentUserId, skillAssessments.skillId],
            set: { score: sql`excluded.score`, updatedAt: new Date() },
          })
      }
    }
  }

  // Opmerkingen Blok C
  const BLOK_C_OPMERKINGEN = [
    { cursistId: DEMO_CURSIST_LISA, lesId: BOET_LES_C[0], tekst: 'Uitstekende start. KB2-10 t/m 12 vlot opgepakt.' },
    { cursistId: DEMO_CURSIST_LISA, lesId: BOET_LES_C[3], tekst: 'Solo perfect verlopen. Examenklaar.' },
    { cursistId: DEMO_CURSIST_TOM,  lesId: BOET_LES_C[1], tekst: 'Goede progressie maar reven vraagt meer herhaling.' },
    { cursistId: DEMO_CURSIST_EMMA, lesId: BOET_LES_C[2], tekst: 'Meer zelfvertrouwen nodig bij manoeuvres in wind.' },
    { cursistId: DEMO_CURSIST_DAAN, lesId: BOET_LES_C[3], tekst: 'Solovaren prima verlopen. Snel bijgeleerd deze week.' },
  ]

  for (const o of BLOK_C_OPMERKINGEN) {
    await db
      .insert(lessonNotes)
      .values({
        lessonId:      o.lesId,
        studentUserId: o.cursistId,
        note:          o.tekst,
        instructeurId: BLOK_C_LESSEN_DATA.find(l => l.id === o.lesId)!.instructeurId,
      })
      .onConflictDoUpdate({
        target: [lessonNotes.lessonId, lessonNotes.studentUserId],
        set: { note: sql`excluded.note` },
      })
  }

  // 20. Alle Boet instructeurs aanmaken (idempotent — bestaande worden overgeslagen)
  for (const instr of BOET_INSTRUCTEURS) {
    await db
      .insert(users)
      .values({ id: instr.id, email: instr.email, name: instr.name })
      .onConflictDoUpdate({ target: users.email, set: { name: instr.name, id: instr.id } })

    await db
      .insert(schoolMemberships)
      .values({ schoolId: DEMO_SCHOOL_ID, userId: instr.id, role: 'instructeur' })
      .onConflictDoUpdate({
        target: [schoolMemberships.schoolId, schoolMemberships.userId],
        set: { role: sql`excluded.role`, deletedAt: null },
      })
  }

  return {
    schoolId: DEMO_SCHOOL_ID,
    eigenaarId: DEMO_EIGENAAR_ID,
    cursisten: CURSISTEN.length,
    lessen: LESSEN.length,
    blokACursisten: blokAGebruikers.filter(u => u.role === 'cursist').length,
    blokALessen: MAWO_LESSEN.length + DIDO_LESSEN.length,
    blokCLessen:    BLOK_C_LESSEN_DATA.length,
    blokCCursisten: BLOK_C_CURSISTEN.length,
  }
}
