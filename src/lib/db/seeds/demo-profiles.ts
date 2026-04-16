import { db } from '@/lib/db'
import { users, profiles, boats } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'

// Vaste UUIDs — idempotent: seed kan meerdere keren veilig worden uitgevoerd
const DEMO_PROFILES = [
  {
    userId:    'bbcc0001-0000-0000-0000-000000000001',
    email:     'anne.dejong.demo@vaarsamen.nl',
    name:      'Anne de Jong',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000001',
      displayName:  'Anne de Jong',
      age:          34,
      bio:          'Zeil al 10 jaar op het IJsselmeer en de Waddenzee. Zoek bemanning voor weekendtochten en af en toe een regatta. Ervaring met Valken en kajuitjachten.',
      cwoLevel:     'cwo3' as const,
      sailingRole:  'schipper' as const,
      lookingFor:   'weekend' as const,
      sailingAreas: ['ijsselmeer', 'waddenzee'],
      skillTags:    ['navigatie', 'ankeren', 'weerskennis'],
      city:         'Amsterdam',
      province:     'Noord-Holland',
      homePort:     'Sixhaven Amsterdam',
      isFeatured:   true,
      cwoVerified:  true,
      averageRating: 4.8,
      reviewCount:  12,
    },
    boat: {
      type:   'kajuitjacht' as const,
      name:   'Zeemeeuw',
      brand:  'Beneteau',
      length: 9.5,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000002',
    email:     'marc.visser.demo@vaarsamen.nl',
    name:      'Marc Visser',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000002',
      displayName:  'Marc Visser',
      age:          28,
      bio:          'Enthousiaste CWO2-er die wil doorgroeien. Ben bemanningslid op zoek naar schippers met een eigen boot. Vrijwel elk weekend beschikbaar.',
      cwoLevel:     'cwo2' as const,
      sailingRole:  'bemanning' as const,
      lookingFor:   'dagje_varen' as const,
      sailingAreas: ['friese_meren', 'ijsselmeer'],
      skillTags:    ['fok_bedienen', 'trimmen'],
      city:         'Leeuwarden',
      province:     'Friesland',
      homePort:     'Sneekermeer',
      isFeatured:   true,
      cwoVerified:  false,
      averageRating: 4.5,
      reviewCount:  5,
    },
    boat: null,
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000003',
    email:     'lisa.bakker.demo@vaarsamen.nl',
    name:      'Lisa Bakker',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000003',
      displayName:  'Lisa Bakker',
      age:          42,
      bio:          'Kielbootzeiler met passie voor langeafstandstochten. Heb een Jeanneau Sun Odyssey 36 liggen in Enkhuizen. Zoek ervaren bemanning voor zeilvakantie Scandinavië.',
      cwoLevel:     'cwo_kielboot2' as const,
      sailingRole:  'schipper' as const,
      lookingFor:   'zeilvakantie' as const,
      sailingAreas: ['ijsselmeer', 'waddenzee', 'markermeer'],
      skillTags:    ['langeafstand', 'navigatie', 'weerskennis', 'nacht_varen'],
      city:         'Enkhuizen',
      province:     'Noord-Holland',
      homePort:     'Jachthaven Enkhuizen',
      isFeatured:   true,
      cwoVerified:  true,
      averageRating: 4.9,
      reviewCount:  23,
    },
    boat: {
      type:   'kajuitjacht' as const,
      name:   'Vrijheid',
      brand:  'Jeanneau',
      length: 11.2,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000004',
    email:     'tom.smits.demo@vaarsamen.nl',
    name:      'Tom Smits',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000004',
      displayName:  'Tom Smits',
      age:          22,
      bio:          'Net CWO1 gehaald en super enthousiast. Wil zo veel mogelijk op het water komen en bijleren van ervaren zeilers. Heb een Laser maar zoek ook kansen op grotere boten.',
      cwoLevel:     'cwo1' as const,
      sailingRole:  'beide' as const,
      lookingFor:   'dagje_varen' as const,
      sailingAreas: ['ijsselmeer', 'friese_meren'],
      skillTags:    ['optuigen', 'basismanoeuvres'],
      city:         'Utrecht',
      province:     'Utrecht',
      homePort:     'Loosdrechtse Plassen',
      isFeatured:   true,
      cwoVerified:  false,
      averageRating: null,
      reviewCount:  0,
    },
    boat: {
      type:   'laser' as const,
      name:   null,
      brand:  'Laser',
      length: 4.2,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000005',
    email:     'sandra.dekker.demo@vaarsamen.nl',
    name:      'Sandra Dekker',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000005',
      displayName:  'Sandra Dekker',
      age:          51,
      bio:          'Regatta-zeiler met 20 jaar ervaring op de Valk. Ben lid van WSV Sneek en zoek bemanningsleden voor de Sneekweek. Tactisch sterk, focus op prestatie.',
      cwoLevel:     'cwo4' as const,
      sailingRole:  'schipper' as const,
      lookingFor:   'regatta' as const,
      sailingAreas: ['friese_meren', 'ijsselmeer'],
      skillTags:    ['regatta', 'tactiek', 'trimmen', 'spinnaker'],
      city:         'Sneek',
      province:     'Friesland',
      homePort:     'WSV Sneek',
      isFeatured:   true,
      cwoVerified:  true,
      averageRating: 4.7,
      reviewCount:  18,
    },
    boat: {
      type:   'valk' as const,
      name:   'Windkracht 4',
      brand:  'Valk',
      length: 6.0,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000006',
    email:     'pieter.vandam.demo@vaarsamen.nl',
    name:      'Pieter van Dam',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000006',
      displayName:  'Pieter van Dam',
      age:          38,
      bio:          'Zeila al 15 jaar, nu meer op de Noordzee. CWO Kielboot 3 gecertificeerd. Mijn boot ligt in Den Helder. Zoek bemanning voor Waddenzee-tochten en af en toe naar Engeland.',
      cwoLevel:     'cwo_kielboot3' as const,
      sailingRole:  'schipper' as const,
      lookingFor:   'zeilvakantie' as const,
      sailingAreas: ['waddenzee', 'noordzee'],
      skillTags:    ['offshore', 'navigatie', 'motordienst', 'nacht_varen', 'ankeren'],
      city:         'Den Helder',
      province:     'Noord-Holland',
      homePort:     'Marinehaven Den Helder',
      isFeatured:   true,
      cwoVerified:  true,
      averageRating: 4.6,
      reviewCount:  9,
    },
    boat: {
      type:   'kajuitjacht' as const,
      name:   'Noordster',
      brand:  'Hallberg-Rassy',
      length: 13.0,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000007',
    email:     'eva.koops.demo@vaarsamen.nl',
    name:      'Eva Koops',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000007',
      displayName:  'Eva Koops',
      age:          31,
      bio:          'Catamaran-fan! Heb een Topcat en doe veel aan catamaran racing. Zoek meezeilers die net zo fanatiek zijn als ik. Beschikbaar doordeweeks en weekenden.',
      cwoLevel:     'cwo3' as const,
      sailingRole:  'beide' as const,
      lookingFor:   'regatta' as const,
      sailingAreas: ['ijsselmeer', 'markermeer', 'randmeren'],
      skillTags:    ['catamaran', 'trapeze', 'snelheid'],
      city:         'Almere',
      province:     'Flevoland',
      homePort:     'Jachthaven Almere',
      isFeatured:   true,
      cwoVerified:  false,
      averageRating: 4.4,
      reviewCount:  7,
    },
    boat: {
      type:   'catamaran' as const,
      name:   'Tweemaster',
      brand:  'Topcat',
      length: 5.5,
    },
  },
  {
    userId:    'bbcc0001-0000-0000-0000-000000000008',
    email:     'joris.hendriks.demo@vaarsamen.nl',
    name:      'Joris Hendriks',
    profile: {
      id:           'bbcc0002-0000-0000-0000-000000000008',
      displayName:  'Joris Hendriks',
      age:          45,
      bio:          'Zeilersvader met twee zoons op de club. Heb een Polyvalk en ga elke zaterdag varen vanuit Loosdrecht. Zoek gezellige meezeilers of familie-zeildagen.',
      cwoLevel:     'cwo2' as const,
      sailingRole:  'schipper' as const,
      lookingFor:   'dagje_varen' as const,
      sailingAreas: ['loosdrechtse_plassen', 'randmeren'],
      skillTags:    ['gezellig_varen', 'beginners_welkom'],
      city:         'Loosdrecht',
      province:     'Utrecht',
      homePort:     'WSV Loosdrecht',
      isFeatured:   true,
      cwoVerified:  false,
      averageRating: 4.3,
      reviewCount:  4,
    },
    boat: {
      type:   'polyvalk' as const,
      name:   'Zonnewijzer',
      brand:  'Polyvalk',
      length: 5.8,
    },
  },
]

export async function seedDemoProfiles() {
  let aangemaakt = 0
  let bestaand = 0

  for (const demo of DEMO_PROFILES) {
    // Idempotent: sla over als user al bestaat
    const [bestaandeUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, demo.userId))
      .limit(1)

    if (!bestaandeUser) {
      await db.insert(users).values({
        id:    demo.userId,
        email: demo.email,
        name:  demo.name,
        emailVerified: new Date(),
      })
    }

    // Idempotent: sla over als profiel al bestaat
    const [bestaandProfiel] = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.id, demo.profile.id))
      .limit(1)

    if (bestaandProfiel) {
      bestaand++
      continue
    }

    await db.insert(profiles).values({
      id:           demo.profile.id,
      userId:       demo.userId,
      displayName:  demo.profile.displayName,
      age:          demo.profile.age,
      bio:          demo.profile.bio,
      cwoLevel:     demo.profile.cwoLevel,
      sailingRole:  demo.profile.sailingRole,
      lookingFor:   demo.profile.lookingFor,
      sailingAreas: demo.profile.sailingAreas,
      skillTags:    demo.profile.skillTags,
      city:         demo.profile.city,
      province:     demo.profile.province,
      homePort:     demo.profile.homePort,
      isFeatured:   demo.profile.isFeatured,
      cwoVerified:  demo.profile.cwoVerified,
      averageRating: demo.profile.averageRating ?? null,
      reviewCount:  demo.profile.reviewCount,
      isOnboarded:  true,
      isVisible:    true,
      lastActive:   new Date(),
    })

    if (demo.boat) {
      await db.insert(boats).values({
        profileId: demo.profile.id,
        type:      demo.boat.type,
        name:      demo.boat.name ?? undefined,
        brand:     demo.boat.brand,
        length:    demo.boat.length,
      })
    }

    aangemaakt++
  }

  return { aangemaakt, bestaand, totaal: DEMO_PROFILES.length }
}
