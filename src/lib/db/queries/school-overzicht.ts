import { db } from '@/lib/db'
import {
  sailingSchools, schoolMemberships, schoolCourses,
  schoolFleet, boatRentals, boatIssues, users,
} from '@/lib/db/schema'
import type { SchoolRole, MembershipStatus } from '@/lib/db/schema'
import { and, eq, desc, isNull, sql, count, inArray } from 'drizzle-orm'

// ─── TYPES ──────────────────────────────────────────────────────────────────

export type OverzichtLid = {
  userId:    string
  naam:      string | null
  email:     string
  image:     string | null
  role:      SchoolRole
  joinedAt:  Date | null
  status:    MembershipStatus
}

export type OverzichtVerhuur = {
  id:         string
  bootNummer: string
  bootNaam:   string | null
  datum:      string
  startTijd:  string
  eindTijd:  string
  status:     string
  aanvragerNaam: string | null
}

export type OverzichtKlus = {
  id:         string
  titel:      string
  status:     string
  prioriteit: string | null
  bootNummer: string | null
  bootNaam:   string | null
  gemeldOp:   Date | null
}

export type SchoolOverzichtData = {
  schoolNaam:     string
  kpis: {
    totaalLeden:   number
    openVerhuur:    number   // aangevraagd (wacht op goedkeuring)
    goedgekeurd:    number
    openKlussen:    number
  }
  nieuweLeden:     OverzichtLid[]
  laatsteVerhuur:  OverzichtVerhuur[]
  openKlussen:     OverzichtKlus[]
}

// ─── QUERY ───────────────────────────────────────────────────────────────────
// Eén server-call die alles voor het overzicht-dashboard ophaalt.

export async function getSchoolOverzicht(schoolId: string, myRole: SchoolRole): Promise<SchoolOverzichtData | null> {
  const [school] = await db
    .select({ name: sailingSchools.name })
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) return null

  const isStaff = myRole === 'eigenaar' || myRole === 'instructeur'

  const [
    memberAgg,
    openVerhuurAgg,
    goedGekeurdAgg,
    openKlusAgg,
    nieuweLeden,
    laatsteVerhuur,
    openKlussen,
  ] = await Promise.all([
    // Totaal actieve leden
    db.select({ n: count() }).from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt))),
    // Aanvragen wachtend op goedkeuring
    db.select({ n: count() }).from(boatRentals)
      .where(and(eq(boatRentals.schoolId, schoolId), eq(boatRentals.status, 'aangevraagd'), isNull(boatRentals.deletedAt))),
    // Goedgekeurde boekingen (komende / lopende)
    db.select({ n: count() }).from(boatRentals)
      .where(and(eq(boatRentals.schoolId, schoolId), eq(boatRentals.status, 'goedgekeurd'), isNull(boatRentals.deletedAt))),
    // Open klussen (niet gesloten/gerepareerd)
    db.select({ n: count() }).from(boatIssues)
      .where(and(eq(boatIssues.schoolId, schoolId), sql`${boatIssues.status} NOT IN ('gesloten','gerepareerd')`)),
    // Nieuwe leden (laatste 6, alleen voor staff)
    db.select({
      userId:   schoolMemberships.userId,
      naam:     users.name,
      email:    users.email,
      image:    users.image,
      role:     schoolMemberships.role,
      joinedAt: schoolMemberships.joinedAt,
      status:   schoolMemberships.status,
    })
      .from(schoolMemberships)
      .innerJoin(users, eq(schoolMemberships.userId, users.id))
      .where(and(eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt)))
      .orderBy(desc(schoolMemberships.joinedAt))
      .limit(6),
    // Laatste bootverhuur (laatste 6)
    db.select({
      id:         boatRentals.id,
      bootNummer: schoolFleet.bootNummer,
      bootNaam:   schoolFleet.naam,
      datum:      boatRentals.datum,
      startTijd:  boatRentals.startTijd,
      eindTijd:   boatRentals.eindTijd,
      status:     boatRentals.status,
      aanvragerNaam: users.name,
    })
      .from(boatRentals)
      .innerJoin(schoolFleet, eq(boatRentals.bootId, schoolFleet.id))
      .leftJoin(users, eq(boatRentals.userId, users.id))
      .where(and(eq(boatRentals.schoolId, schoolId), isNull(boatRentals.deletedAt)))
      .orderBy(desc(boatRentals.datum), desc(boatRentals.createdAt))
      .limit(6),
    // Open klussen (laatste 6, gesorteerd op urgentie)
    db.select({
      id:         boatIssues.id,
      titel:      boatIssues.titel,
      status:     boatIssues.status,
      prioriteit: boatIssues.prioriteit,
      bootNummer: schoolFleet.bootNummer,
      bootNaam:   schoolFleet.naam,
      gemeldOp:   boatIssues.createdAt,
    })
      .from(boatIssues)
      .leftJoin(schoolFleet, eq(boatIssues.bootId, schoolFleet.id))
      .where(and(eq(boatIssues.schoolId, schoolId), sql`${boatIssues.status} NOT IN ('gesloten','gerepareerd')`))
      .orderBy(
        sql`CASE ${boatIssues.prioriteit}
              WHEN 'urgent' THEN 0
              WHEN 'hoog'   THEN 1
              WHEN 'normaal' THEN 2
              WHEN 'laag'   THEN 3
              ELSE 4 END`,
        desc(boatIssues.createdAt),
      )
      .limit(6),
  ])

  return {
    schoolNaam: school.name,
    kpis: {
      totaalLeden:  Number(memberAgg[0]?.n ?? 0),
      openVerhuur:   Number(openVerhuurAgg[0]?.n ?? 0),
      goedgekeurd:   Number(goedGekeurdAgg[0]?.n ?? 0),
      openKlussen:   Number(openKlusAgg[0]?.n ?? 0),
    },
    nieuweLeden:   isStaff ? nieuweLeden.map(r => ({
      userId: r.userId, naam: r.naam, email: r.email, image: r.image, role: r.role, joinedAt: r.joinedAt, status: r.status,
    })) : [],
    laatsteVerhuur: laatsteVerhuur.map(r => ({
      id: r.id, bootNummer: r.bootNummer, bootNaam: r.bootNaam, datum: r.datum,
      startTijd: r.startTijd, eindTijd: r.eindTijd, status: r.status, aanvragerNaam: r.aanvragerNaam,
    })),
    openKlussen: openKlussen.map(r => ({
      id: r.id, titel: r.titel, status: r.status, prioriteit: r.prioriteit,
      bootNummer: r.bootNummer, bootNaam: r.bootNaam, gemeldOp: r.gemeldOp,
    })),
  }
}
