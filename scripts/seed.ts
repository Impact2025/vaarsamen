/**
 * Seed script: demo content + account voor v.munster@weareimpact.nl
 * Uitvoeren: npx tsx scripts/seed.ts
 */

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../src/lib/db/schema'
import { eq } from 'drizzle-orm'

const sql = neon(process.env.DATABASE_URL!)
const db  = drizzle(sql, { schema })

// ─── DEMO PROFIELEN ───────────────────────────────────────────────────────────

const demoProfiles = [
  {
    email:       'pieter.dejong@demo.vaarsamen.nl',
    displayName: 'Pieter de Jong',
    age:         42,
    city:        'Enkhuizen',
    homePort:    'WSV Enkhuizen',
    bio:         'Al 15 jaar zeiler op het IJsselmeer. Heb een Valk liggen en zoek een enthousiast maatje voor de weekenden. Ook open voor regatta\'s in het seizoen.',
    cwoLevel:    'cwo3' as const,
    cwoVerified: true,
    sailingRole: 'schipper' as const,
    lookingFor:  'weekend' as const,
    sailingAreas: ['ijsselmeer', 'friesland'],
    skillTags:   ['Regatta', 'Trimmen', 'Navigatie'],
    photoUrl:    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop',
    boatType:    'valk' as const,
    boatName:    'Blauwe Reiger',
    isFeatured:  true,
  },
  {
    email:       'lisa.vanderberg@demo.vaarsamen.nl',
    displayName: 'Lisa van den Berg',
    age:         31,
    city:        'Amsterdam',
    homePort:    'Loosdrechtse Plassen',
    bio:         'Ik zeil al van kinds af aan. Enthousiast om nieuwe vaargebieden te verkennen. Zoek een schipper met een kajuitjacht voor meerdaagse trips.',
    cwoLevel:    'cwo2' as const,
    cwoVerified: true,
    sailingRole: 'bemanning' as const,
    lookingFor:  'zeilvakantie' as const,
    sailingAreas: ['amsterdam', 'ijsselmeer', 'waddenzee'],
    skillTags:   ['Navigatie', 'Marifoon', 'EHBO'],
    photoUrl:    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop',
    boatType:    null,
    boatName:    null,
    isFeatured:  true,
  },
  {
    email:       'hans.kooiman@demo.vaarsamen.nl',
    displayName: 'Hans Kooiman',
    age:         55,
    city:        'Lelystad',
    homePort:    'Bataviastad Marina',
    bio:         'Gepensioneerd zeiler met een prachtige Bavaria 34. Zoek bemanning voor zeilvakantie naar de Waddenzee en Denemarken. Ervaring vereist.',
    cwoLevel:    'cwo_kielboot2' as const,
    cwoVerified: true,
    sailingRole: 'schipper' as const,
    lookingFor:  'zeilvakantie' as const,
    sailingAreas: ['ijsselmeer', 'waddenzee', 'noord_zee'],
    skillTags:   ['Nachtvaren', 'Navigatie', 'Ankeren', 'Marifoon', 'Seinvlag'],
    photoUrl:    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop',
    boatType:    'kajuitjacht' as const,
    boatName:    'Vrijheid',
    isFeatured:  true,
  },
  {
    email:       'emma.smit@demo.vaarsamen.nl',
    displayName: 'Emma Smit',
    age:         26,
    city:        'Utrecht',
    homePort:    'Loosdrechtse Plassen',
    bio:         'Beginner maar heel gemotiveerd! CWO 1 behaald en nu op zoek naar iemand om bij te leren. Weekenden vrij en doe ook mee aan clubwedstrijden.',
    cwoLevel:    'cwo1' as const,
    cwoVerified: false,
    sailingRole: 'bemanning' as const,
    lookingFor:  'dagje_varen' as const,
    sailingAreas: ['amsterdam', 'randmeren'],
    skillTags:   ['Regatta'],
    photoUrl:    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop',
    boatType:    null,
    boatName:    null,
    isFeatured:  false,
  },
  {
    email:       'marc.hendrikx@demo.vaarsamen.nl',
    displayName: 'Marc Hendrikx',
    age:         38,
    city:        'Sneek',
    homePort:    'Sneekermeer',
    bio:         'Friese zeiler, geboren en opgegroeid aan het water. Vaar op een Polyvalk. Zoek maatje voor de Friese Elfstedentocht te water en wedstrijden.',
    cwoLevel:    'cwo3' as const,
    cwoVerified: true,
    sailingRole: 'beide' as const,
    lookingFor:  'regatta' as const,
    sailingAreas: ['friesland', 'ijsselmeer'],
    skillTags:   ['Regatta', 'Trimmen', 'Spinnaker', 'Trapeze'],
    photoUrl:    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop',
    boatType:    'polyvalk' as const,
    boatName:    'De Sneker Pan',
    isFeatured:  false,
  },
  {
    email:       'anna.verhoef@demo.vaarsamen.nl',
    displayName: 'Anna Verhoef',
    age:         44,
    city:        'Den Haag',
    homePort:    'Scheveningen',
    bio:         'Kielbootzeiler met ervaring op de Noordzee. Zoek bemanning voor kustvaart langs de Hollandse kust. Vaar ook naar de Oosterschelde.',
    cwoLevel:    'cwo_kielboot1' as const,
    cwoVerified: false,
    sailingRole: 'schipper' as const,
    lookingFor:  'weekend' as const,
    sailingAreas: ['zeeland', 'noord_zee'],
    skillTags:   ['Navigatie', 'Nachtvaren', 'Motorervaring'],
    photoUrl:    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=500&fit=crop',
    boatType:    'kajuitjacht' as const,
    boatName:    'Zeekwint',
    isFeatured:  true,
  },
  {
    email:       'tim.broekman@demo.vaarsamen.nl',
    displayName: 'Tim Broekman',
    age:         29,
    city:        'Rotterdam',
    homePort:    'Kralingse Plas',
    bio:         'Sportieve zeiler die graag snel gaat. Laser en catamaran. Zoek iemand met dezelfde drive voor weekendregattas.',
    cwoLevel:    'cwo2' as const,
    cwoVerified: false,
    sailingRole: 'beide' as const,
    lookingFor:  'regatta' as const,
    sailingAreas: ['zeeland', 'randmeren'],
    skillTags:   ['Regatta', 'Trapeze', 'Spinnaker'],
    photoUrl:    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop',
    boatType:    'laser' as const,
    boatName:    null,
    isFeatured:  false,
  },
  {
    email:       'sophie.dejager@demo.vaarsamen.nl',
    displayName: 'Sophie de Jager',
    age:         35,
    city:        'Haarlem',
    homePort:    'Braassemermeer',
    bio:         'Heerlijk ontspannen toervaren op de meren. Geen haast, wel gezelligheid. Zoek iemand voor dagjes en weekendjes op de Friese meren.',
    cwoLevel:    'cwo2' as const,
    cwoVerified: true,
    sailingRole: 'beide' as const,
    lookingFor:  'dagje_varen' as const,
    sailingAreas: ['amsterdam', 'friesland', 'randmeren'],
    skillTags:   ['Toervaren', 'Ankeren'],
    photoUrl:    'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=500&fit=crop',
    boatType:    'valk' as const,
    boatName:    'Kwikstaart',
    isFeatured:  false,
  },
]

async function seed() {
  console.log('🌊 VaarSamen seed script gestart...\n')

  // ─── 1. Hoofdgebruiker aanmaken ────────────────────────────────────────────

  console.log('👤 Account aanmaken voor v.munster@weareimpact.nl...')

  let mainUser = await db.query.users.findFirst({
    where: eq(schema.users.email, 'v.munster@weareimpact.nl'),
  })

  if (!mainUser) {
    ;[mainUser] = await db.insert(schema.users).values({
      email:         'v.munster@weareimpact.nl',
      name:          'V. Munster',
      emailVerified: new Date(),
    }).returning()
    console.log('  ✓ User aangemaakt:', mainUser.id)
  } else {
    console.log('  ℹ User bestaat al:', mainUser.id)
  }

  // Profiel voor hoofdgebruiker
  let mainProfile = await db.query.profiles.findFirst({
    where: eq(schema.profiles.userId, mainUser.id),
  })

  if (!mainProfile) {
    ;[mainProfile] = await db.insert(schema.profiles).values({
      userId:       mainUser.id,
      displayName:  'Vincent',
      age:          37,
      city:         'Amsterdam',
      homePort:     'Sixhaven Amsterdam',
      bio:          'Enthousiaste zeiler op het IJsselmeer en de Friese Meren. Heb een Valk liggen en zoek regelmatig iemand om mee te varen. Open voor dagjes, weekenden en soms een langere tocht.',
      cwoLevel:     'cwo2',
      cwoVerified:  false,
      sailingRole:  'beide',
      lookingFor:   'alles',
      experience:   8,
      sailingAreas: ['ijsselmeer', 'friesland', 'amsterdam'],
      skillTags:    ['Trimmen', 'Navigatie', 'Toervaren'],
      photoUrl:     'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop',
      isOnboarded:  true,
      isVisible:    true,
      isFeatured:   false,
      subscriptionTier: 'actief',
      subscriptionUntil: '2026-12-31',
    }).returning()

    await db.insert(schema.boats).values({
      profileId: mainProfile.id,
      name:      'De Avonturier',
      type:      'valk',
      homePort:  'Sixhaven Amsterdam',
    })

    console.log('  ✓ Profiel aangemaakt:', mainProfile.id)
  } else {
    console.log('  ℹ Profiel bestaat al:', mainProfile.id)
  }

  // ─── 2. Demo profielen aanmaken ────────────────────────────────────────────

  console.log('\n👥 Demo profielen aanmaken...')

  const createdProfiles: typeof schema.profiles.$inferSelect[] = []

  for (const demo of demoProfiles) {
    let user = await db.query.users.findFirst({
      where: eq(schema.users.email, demo.email),
    })

    if (!user) {
      ;[user] = await db.insert(schema.users).values({
        email:         demo.email,
        name:          demo.displayName,
        emailVerified: new Date(),
      }).returning()
    }

    let profile = await db.query.profiles.findFirst({
      where: eq(schema.profiles.userId, user.id),
    })

    if (!profile) {
      ;[profile] = await db.insert(schema.profiles).values({
        userId:       user.id,
        displayName:  demo.displayName,
        age:          demo.age,
        city:         demo.city,
        homePort:     demo.homePort,
        bio:          demo.bio,
        cwoLevel:     demo.cwoLevel,
        cwoVerified:  demo.cwoVerified,
        sailingRole:  demo.sailingRole,
        lookingFor:   demo.lookingFor,
        sailingAreas: demo.sailingAreas,
        skillTags:    demo.skillTags,
        photoUrl:     demo.photoUrl,
        isOnboarded:  true,
        isVisible:    true,
        isFeatured:   demo.isFeatured,
        averageRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount:   Math.floor(Math.random() * 15) + 1,
        lastActive:    new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }).returning()

      if (demo.boatType) {
        await db.insert(schema.boats).values({
          profileId: profile.id,
          name:      demo.boatName ?? undefined,
          type:      demo.boatType,
          homePort:  demo.homePort,
        })
      }

      console.log(`  ✓ ${demo.displayName}`)
    } else {
      console.log(`  ℹ ${demo.displayName} bestaat al`)
    }

    createdProfiles.push(profile)
  }

  // ─── 3. Twee matches aanmaken (Pieter + Lisa → chat met berichten) ─────────

  console.log('\n💬 Demo matches en berichten aanmaken...')

  const pieterProfile = createdProfiles[0] // Pieter de Jong
  const lisaProfile   = createdProfiles[1] // Lisa van den Berg

  // Match 1: Vincent ↔ Pieter
  let match1 = await db.query.matches.findFirst({
    where: (m) => {
      const { and, or, eq } = require('drizzle-orm')
      return and(
        or(eq(m.profileAId, mainProfile!.id), eq(m.profileBId, mainProfile!.id)),
        or(eq(m.profileAId, pieterProfile.id), eq(m.profileBId, pieterProfile.id)),
      )
    }
  })

  if (!match1) {
    // Swipes
    await db.insert(schema.swipes).values([
      { swiperId: mainProfile!.id, swipedId: pieterProfile.id, action: 'like' },
      { swiperId: pieterProfile.id, swipedId: mainProfile!.id, action: 'like' },
    ]).onConflictDoNothing()

    ;[match1] = await db.insert(schema.matches).values({
      profileAId: mainProfile!.id,
      profileBId: pieterProfile.id,
      hasSailed:  true,
    }).returning()

    // Berichten
    const msgs = [
      { senderId: pieterProfile.id, content: 'Hey Vincent! Leuk profiel. Ben ook regelmatig op het IJsselmeer. Wanneer ben jij beschikbaar dit weekend?', minutesAgo: 2880 },
      { senderId: mainProfile!.id,  content: 'Ha Pieter! Ja toevallig ben ik dit weekend vrij. Zaterdag of zondag?', minutesAgo: 2860 },
      { senderId: pieterProfile.id, content: 'Zaterdag past mij prima. Vertrekken vanuit Enkhuizen, dan richting Urk en terug?', minutesAgo: 2840 },
      { senderId: mainProfile!.id,  content: 'Top plan! Wat is de weersvoorspelling? Ik check Windy even.', minutesAgo: 2820 },
      { senderId: pieterProfile.id, content: 'Force 3-4 uit het zuidwesten. Prima omstandigheden. Ik haal de boot zeker klaar.', minutesAgo: 2800 },
      { senderId: mainProfile!.id,  content: 'Perfect. Ik ben er om 09:00 bij de haven. Tot zaterdag!', minutesAgo: 2780 },
      { senderId: pieterProfile.id, content: 'Top! Oh, neem eventueel een regenjack mee voor de terugweg. En ik heb koffie en koeken aan boord 😄', minutesAgo: 2760 },
      { senderId: mainProfile!.id,  content: 'Haha top. Ik breng broodjes mee. Tot snel!', minutesAgo: 2740 },
    ]

    for (const msg of msgs) {
      await db.insert(schema.messages).values({
        matchId:   match1.id,
        senderId:  msg.senderId,
        content:   msg.content,
        isRead:    true,
        createdAt: new Date(Date.now() - msg.minutesAgo * 60 * 1000),
      })
    }

    // Review van Pieter aan Vincent (hebben gevaren)
    await db.insert(schema.reviews).values({
      matchId:    match1.id,
      reviewerId: pieterProfile.id,
      revieweeId: mainProfile!.id,
      rating:     5,
      text:       'Geweldige dag gehad! Vincent is een echte teamspeler, kent zijn taken aan boord en is vrolijk gezelschap. Graag opnieuw!',
      sailedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    })

    // Update Vincent's rating
    await db.update(schema.profiles).set({
      averageRating: 5.0,
      reviewCount:   1,
    }).where(eq(schema.profiles.id, mainProfile!.id))

    console.log('  ✓ Match + chat met Pieter de Jong (gevaren, review gegeven)')
  } else {
    console.log('  ℹ Match met Pieter bestaat al')
  }

  // Match 2: Vincent ↔ Lisa (nieuw, ongelezen berichten)
  let match2 = await db.query.matches.findFirst({
    where: (m) => {
      const { and, or, eq } = require('drizzle-orm')
      return and(
        or(eq(m.profileAId, mainProfile!.id), eq(m.profileBId, mainProfile!.id)),
        or(eq(m.profileAId, lisaProfile.id), eq(m.profileBId, lisaProfile.id)),
      )
    }
  })

  if (!match2) {
    await db.insert(schema.swipes).values([
      { swiperId: mainProfile!.id, swipedId: lisaProfile.id, action: 'like' },
      { swiperId: lisaProfile.id,  swipedId: mainProfile!.id, action: 'like' },
    ]).onConflictDoNothing()

    ;[match2] = await db.insert(schema.matches).values({
      profileAId: mainProfile!.id,
      profileBId: lisaProfile.id,
      hasSailed:  false,
    }).returning()

    // Ongelezen bericht van Lisa
    await db.insert(schema.messages).values({
      matchId:  match2.id,
      senderId: lisaProfile.id,
      content:  'Hey! Leuk dat we een match hebben 🙌 Ik ben echt op zoek naar een schipper voor een weekje Waddenzee. Heb jij ervaring op de Waddenzee?',
      isRead:   false,
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    })

    console.log('  ✓ Match + ongelezen bericht van Lisa van den Berg')
  } else {
    console.log('  ℹ Match met Lisa bestaat al')
  }

  // ─── 4. Tochten aanmaken (16 oproepen, 3 weken vooruit) ───────────────────

  console.log('\n⛵ Tochten aanmaken...')

  const { count: tochtCount } = await db.select({ count: require('drizzle-orm').count() })
    .from(schema.tochten)
    .then(r => r[0])

  if (Number(tochtCount) >= 15) {
    console.log(`  ℹ Al ${tochtCount} tochten in DB, skip`)
  } else {
    // Verwijder bestaande demo-tochten en seed opnieuw
    await db.delete(schema.tochten)
    console.log('  ↺ Bestaande tochten verwijderd, opnieuw seeden...')

    const dag = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
    }

    // Profielmap voor leesbaarheid
    const p = {
      vincent: mainProfile!.id,
      pieter:  createdProfiles[0].id,  // Pieter de Jong
      lisa:    createdProfiles[1].id,  // Lisa van den Berg
      hans:    createdProfiles[2].id,  // Hans Kooiman
      emma:    createdProfiles[3].id,  // Emma Smit
      marc:    createdProfiles[4].id,  // Marc Hendrikx
      anna:    createdProfiles[5].id,  // Anna Verhoef
      tim:     createdProfiles[6].id,  // Tim Broekman
      sophie:  createdProfiles[7].id,  // Sophie de Jager
    }

    const tochtenData = [
      // ── Week 1 ────────────────────────────────────────────────────────────
      {
        profileId: p.vincent,
        titel:          'Donderdagochtend Kaag – zoek maatje voor Valk',
        beschrijving:   'Ik ga donderdagochtend varen op de Kaag met mijn Valk "De Avonturier". Zoek een enthousiast maatje dat mee wil varen. We vertrekken vanuit MZV De Boet en varen een paar uur op de Kagerplassen. Terug rond het middaguur. Ervaring fijn maar niet verplicht – wel fit zijn voor een Valk!',
        datum:          dag(4), vertrekTijd: '09:30', vaargebied: 'amsterdam',
        locatie: 'MZV De Boet, Kaag', bootType: 'valk' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.pieter,
        titel:          'Enkhuizen → Medemblik en terug – Valk zoekt maatje',
        beschrijving:   'Mooie dagtocht over het IJsselmeer. Vertrek vanuit WSV Enkhuizen richting Medemblik, koffie aan de kade en dan terug met de wind in de rug. Zoek een actief maatje dat mee wil als bemanning op mijn Valk "Blauwe Reiger". Minimaal CWO I of vergelijkbare ervaring op open water.',
        datum:          dag(2), vertrekTijd: '09:00', vaargebied: 'ijsselmeer',
        locatie: 'WSV Enkhuizen', bootType: 'valk' as const, cwoMinimum: 'cwo1' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.lisa,
        titel:          'Zondag rustig varen Amsterdam – beginners welkom',
        beschrijving:   'Zondag een ontspannen tocht op de Nieuwe Meer en de Amstelveense kanalen. Zoek 1-2 maatjes die de waterwijken van Amsterdam willen verkennen. Geen zwemdiploma vereist maar een regenjas mee! Ik huur een Valk bij jachthaven Sixhaven. Gezelligheid staat centraal.',
        datum:          dag(3), vertrekTijd: '10:00', vaargebied: 'amsterdam',
        locatie: 'Jachthaven Sixhaven, Amsterdam', bootType: 'valk' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 2,
      },
      {
        profileId: p.hans,
        titel:          'Weekje Waddenzee – Bavaria 34 zoekt ervaren bemanning',
        beschrijving:   'Vertrek maandag vanuit Den Helder richting Terschelling en Vlieland. Terug vrijdag. Ik zoek 2-3 man ervaren bemanning. Nachtwacht, marifoon (SRC) en basisnavigatie zijn vereisten. Perfect voor iedereen die de stap naar offshore wil maken. Eten en drinken aan boord geregeld.',
        datum:          dag(4), vertrekTijd: '07:00', vaargebied: 'waddenzee',
        locatie: 'Marinehaven Den Helder', bootType: 'kajuitjacht' as const, cwoMinimum: 'cwo_kielboot1' as const, aantalPlaatsen: 3,
      },
      {
        profileId: p.emma,
        titel:          'Gezellig dagje Loosdrecht – beginners en gevorderden welkom',
        beschrijving:   'Dinsdag op de Loosdrechtse Plassen. Ik ga varen met een gehuurde Valk en zoek een maatje dat ook nog aan het leren is – dan leren we van elkaar! Geen race, gewoon genieten van het water en de natuur. Koffie en koeken neem ik mee, broodjes voor de lunch zijn handig.',
        datum:          dag(5), vertrekTijd: '11:00', vaargebied: 'randmeren',
        locatie: 'Jachthaven de Drecht, Loosdrecht', bootType: 'valk' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.marc,
        titel:          'Polyvalk trainingsdag Sneekermeer – trapeze gezocht',
        beschrijving:   'Trainingsrondes op het Sneekermeer als voorbereiding op de clubkampioenschappen. Zoek iemand met CWO II die de trapeze durft te pakken en snel kan communiceren. We oefenen gybe-sets, start-procedures en kraai-ophalen. Wedstrijdzeilers hebben voorkeur maar enthousiaste amateurs ook welkom!',
        datum:          dag(6), vertrekTijd: '08:30', vaargebied: 'friesland',
        locatie: 'WSV Sneek, Sneekermeer', bootType: 'polyvalk' as const, cwoMinimum: 'cwo2' as const, aantalPlaatsen: 1,
      },
      // ── Week 2 ────────────────────────────────────────────────────────────
      {
        profileId: p.anna,
        titel:          'Kustvaart Scheveningen → Hoek van Holland – zaterdagmiddag',
        beschrijving:   'Een mooie kustvaart langs de Hollandse kust. Vertrek vroeg vanuit Scheveningen, lunchstop in Hoek van Holland en terug voor zonsondergang. Kajuitjacht "Zeekwint", 34 voet. Zoek 1-2 man ervaren bemanning. Kielbootdiploma vereist vanwege mogelijke zeeomstandigheden.',
        datum:          dag(9), vertrekTijd: '08:00', vaargebied: 'noord_zee',
        locatie: 'Jachthaven Scheveningen', bootType: 'kajuitjacht' as const, cwoMinimum: 'cwo_kielboot1' as const, aantalPlaatsen: 2,
      },
      {
        profileId: p.tim,
        titel:          'Catamaran speedsessie Grevelingen – zoek dappere foredeck',
        beschrijving:   'De Grevelingen staat bekend om strakke banen en betrouwbare wind. Zondag ga ik er voluit op mijn catamaran. Zoek iemand die niet bang is voor wat spray en hoge snelheden. Trapeze-ervaring is een vereiste. We mikken op 20+ knopen als het meezit. Helm en wetsuit aanwezig.',
        datum:          dag(10), vertrekTijd: '09:30', vaargebied: 'zeeland',
        locatie: 'Grevelingenstrand, Scharendijke', bootType: 'catamaran' as const, cwoMinimum: 'cwo2' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.sophie,
        titel:          'Rustige toerentocht Friese Meren – maandag geen stress',
        beschrijving:   'Weekstart op het water! Maandag vaar ik van De Veenhoop richting Eernewoude en Grou. Prachtige route langs rietlanden en kleine dorpjes. Weinig recreatieverkeer doordeweeks. Zoek een gezellig maatje dat het niet erg vindt om ook even te ankeren voor de lunch. Geen haast, wel plezier!',
        datum:          dag(11), vertrekTijd: '10:00', vaargebied: 'friesland',
        locatie: 'Jachthaven De Veenhoop', bootType: 'valk' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.pieter,
        titel:          'Regatta training IJsselmeer Medemblik – dinsdag',
        beschrijving:   "Dinsdag trainingsrondes voor de regatta's in de bocht van Medemblik. Zoek 1-2 bemanningsleden voor mijn Valk. We focussen op startprocedures, kruis-oplopen en gybe-sets. Enige wedstrijdervaring is een pré. Borrel na afloop bij de Watersportvereniging Medemblik.",
        datum:          dag(12), vertrekTijd: '08:00', vaargebied: 'ijsselmeer',
        locatie: 'WV Medemblik', bootType: 'valk' as const, cwoMinimum: 'cwo1' as const, aantalPlaatsen: 2,
      },
      {
        profileId: p.hans,
        titel:          'Nachtelijke oversteek naar Texel – woensdag vertrek',
        beschrijving:   'Woensdagavond oversteek naar Texel, aankomst donderdagochtend. Ik zoek 2 bemanners met offshore en/of wachtervaring. Wachtrooster, marifoon en navigatie zijn vereisten. Bavaria 34 "Vrijheid", volledig uitgerust. Na aankomst Texel dagje eiland verkennen, vrijdag terug.',
        datum:          dag(13), vertrekTijd: '20:00', vaargebied: 'waddenzee',
        locatie: 'KMJC Den Helder', bootType: 'kajuitjacht' as const, cwoMinimum: 'cwo_kielboot2' as const, aantalPlaatsen: 2,
      },
      // ── Week 3 ────────────────────────────────────────────────────────────
      {
        profileId: p.marc,
        titel:          'Clubwedstrijd Bergumermeer – Polyvalk zoekt trapezebemanningslid',
        beschrijving:   'Zaterdag de clubwedstrijd op het Bergumermeer. Ik doe mee met mijn Polyvalk en zoek een ervaren trapezebemanningslid. Je moet de boot kennen en snel kunnen communiceren. Afgelopen seizoen top-5 gehaald, dit jaar gaan we voor de titel. Serieuze deelname, maar ook feest na afloop!',
        datum:          dag(16), vertrekTijd: '09:00', vaargebied: 'friesland',
        locatie: 'WSV Bergumermeer, Bergum', bootType: 'polyvalk' as const, cwoMinimum: 'cwo2' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.tim,
        titel:          'Laser trainingsdag Grevelingen – zoek sparringpartners',
        beschrijving:   'Zondagmiddag trainingsrondes met andere Laser-zeilers op de Grevelingen. Enkelvoudige Laser is de perfecte school voor boot-balance en trim. We starten om 13:00 en varen tot zonsondergang. Zoek trainingspartners – gezelligheid aan de kade is net zo belangrijk als het zeilen.',
        datum:          dag(17), vertrekTijd: '13:00', vaargebied: 'zeeland',
        locatie: 'Grevelingendam, Bruinisse', bootType: 'laser' as const, cwoMinimum: 'cwo1' as const, aantalPlaatsen: 1,
      },
      {
        profileId: p.anna,
        titel:          'Lang weekend Zeeland – Zierikzee als uitvalsbasis',
        beschrijving:   'Vrijdag t/m maandag op de Oosterschelde. Uitvalsbase Zierikzee. Daguitstapjes naar Veerse Meer en Grevelingen. Kajuitjacht "Zeekwint". Alle niveaus welkom – het is geen technisch uitdagende vaart maar een heerlijk zeillweekend met gezellig groepje. Kook je mee? Dan heb je extra punten!',
        datum:          dag(19), vertrekTijd: '16:00', vaargebied: 'zeeland',
        locatie: 'Marina Zierikzee', bootType: 'kajuitjacht' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 3,
      },
      {
        profileId: p.sophie,
        titel:          'Zondagtocht Westeinderplassen Aalsmeer – gezellig en ontspannen',
        beschrijving:   'De Westeinderplassen zijn verrassend gevarieerd voor zo\'n klein water. Ik ken de geulen als mijn broekzak. Zoek 1-2 maatjes voor een ronde met een lekkere picknick ergens aan de kant. Vertrek vanuit Jachthaven Aalsmeer. Perfect voor beginners én gevorderden die het rustiger willen aandoen.',
        datum:          dag(20), vertrekTijd: '09:30', vaargebied: 'amsterdam',
        locatie: 'Jachthaven Aalsmeer', bootType: 'valk' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 2,
      },
      {
        profileId: p.lisa,
        titel:          'Zeilweekend Friesland – kajuitjacht zoekt 2 bemanners',
        beschrijving:   'Ik ga een lang weekend de Friese Meren verkennen met een gehuurd kajuitjacht. Zoek 2 enthousiaste bemanners die mee willen op een ontspannen maar avontuurlijk weekend. Van Sneek naar Lemmer via het Sneekermeer, IJlst en de Heegermeer. Eerste zeilerservaring is een pré.',
        datum:          dag(21), vertrekTijd: '10:00', vaargebied: 'friesland',
        locatie: 'Jachthaven Sneek', bootType: 'kajuitjacht' as const, cwoMinimum: 'geen' as const, aantalPlaatsen: 2,
      },
    ]

    await db.insert(schema.tochten).values(tochtenData.map(t => ({ ...t, status: 'open' as const })))
    console.log(`  ✓ ${tochtenData.length} tochten aangemaakt`)
  }

  // ─── 5. Samenvatting ───────────────────────────────────────────────────────

  console.log('\n🎉 Seed voltooid!\n')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Account:    v.munster@weareimpact.nl')
  console.log('Naam:       Vincent')
  console.log('Abonnement: Actief (premium)')
  console.log(`Profile ID: ${mainProfile!.id}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`Demo zeilers: ${demoProfiles.length} aangemaakt`)
  console.log('Matches:      2 (1 gevaren + review, 1 nieuw met ongelezen bericht)')
  console.log('Tochten:      16 (alle vaargebieden, 3 weken vooruit)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\nInloggen via: http://localhost:3000/login')
  console.log('Gebruik magic link met: v.munster@weareimpact.nl\n')

  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed mislukt:', err)
  process.exit(1)
})
