import { db } from '@/lib/db'
import {
  sailingSchools, schoolMemberships, schoolFleet, boatRentals, users,
} from '@/lib/db/schema'
import type { SchoolRole } from '@/lib/db/schema'
import { and, eq, desc, isNull, sql, count, sum, gte, lte, inArray } from 'drizzle-orm'

// Financiele config van de school (SEPA-crediteur). Opgeslagen in
// sailingSchools.financieel (jsonb).
export type SchoolFinancieelConfig = {
  iban:      string            // crediteur IBAN (zonder spaties)
  bic?:       string            // BIC (optioneel binnen SEPA)
  creditorId: string            // unieke creditor-id bij bank (NL9-pos)
  naam:       string            // ten name van (bv. 'Zeilschool De Zwaluw')
  type?:      'RCUR' | 'FRST'  // incasso-type
}

// ─── TYPES ──────────────────────────────────────────────────────────

export type Centen = number // bedrag in eurocenten

export type FinPeriode = {
  van: string  // YYYY-MM-DD
  tot: string  // YYYY-MM-DD
  label: string
}

export type FinKpis = {
  verhuurBetaald:   Centen  // sum bedrag_centen waar betaald_op in periode
  verhuurOpen:     Centen  // sum bedrag_centen waar betaald_op is null
  verhuurOpenAantal: number
  lidmaatschapBetaald: Centen // (nog niet per-periode relevant; totaal)
  lidmaatschapOpen:   Centen // sum lidmaatschap_bedrag waar status='open'
  lidmaatschapOpenAantal: number
  totaalInkomsten: Centen
}

export type FinVerhuurRij = {
  id:         string
  bootNummer: string
  bootNaam:   string | null
  datum:      string
  huurderNaam: string | null
  bedrag:     Centen | null
  betaaldOp:   string | null
  status:     string
}

export type FinLidRij = {
  userId:      string
  naam:        string | null
  email:       string
  bedrag:      Centen | null
  status:      'open' | 'betaald'
  sepaIban:    string | null
  sepaMachtigingId: string | null
  // Gereed voor SEPA-incasso als IBAN + machtiging aanwezig + open
  incassoGereed: boolean
}

export type SchoolFinancieelData = {
  schoolNaam: string
  periode:    FinPeriode
  kpis:       FinKpis
  verhuur:    FinVerhuurRij[]   // recente + open, gesorteerd op datum
  leden:      FinLidRij[]      // leden met contributie (bedrag != null), open eerst
  incassoGereed: FinLidRij[] // subset met IBAN + machtiging + open
}

// ─── PERIODE HELPER ───────────────────────────────────────────────────

export function periodeVanLabel(label: string, ref = new Date()): FinPeriode {
  const y = ref.getFullYear()
  const m = ref.getMonth() // 0-11
  switch (label) {
    case 'deze_maand': {
      const van = new Date(y, m, 1)
      const tot = new Date(y, m + 1, 0)
      return { van: iso(van), tot: iso(tot), label: 'Deze maand' }
    }
    case 'deze_kwartaal': {
      const q = Math.floor(m / 3)
      const van = new Date(y, q * 3, 1)
      const tot = new Date(y, q * 3 + 3, 0)
      return { van: iso(van), tot: iso(tot), label: 'Deze kwartaal' }
    }
    case 'dit_jaar': {
      return { van: `${y}-01-01`, tot: `${y}-12-31`, label: 'Dit jaar' }
    }
    case 'alle':
    default:
      return { van: '2000-01-01', tot: '2999-12-31', label: 'Alle jaren' }
  }
}

function iso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

// ─── QUERY ────────────────────────────────────────────────────────────

export async function getSchoolFinancieel(
  schoolId: string,
  periode: FinPeriode,
): Promise<SchoolFinancieelData | null> {
  const [school] = await db
    .select({ name: sailingSchools.name })
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) return null

  // INKOMSTEN verhuur binnen periode
  const [verhuurAgg] = await db
    .select({
      betaald:  sql<number>`coalesce(sum(case when ${boatRentals.betaaldOp} is not null then ${boatRentals.bedragCenten} else 0 end), 0)`,
      open:     sql<number>`coalesce(sum(case when ${boatRentals.betaaldOp} is null then coalesce(${boatRentals.bedragCenten},0) else 0 end), 0)`,
    })
    .from(boatRentals)
    .where(and(
      eq(boatRentals.schoolId, schoolId),
      isNull(boatRentals.deletedAt),
      gte(boatRentals.datum, periode.van),
      lte(boatRentals.datum, periode.tot),
    ))

  const [verhuurOpenAantal] = await db
    .select({ n: count() })
    .from(boatRentals)
    .where(and(
      eq(boatRentals.schoolId, schoolId),
      isNull(boatRentals.deletedAt),
      sql`${boatRentals.betaaldOp} is null`,
      sql`${boatRentals.bedragCenten} is not null`,
    ))

  // LIDMAATSCHAP open contributie (totaal, niet per periode — contributie is jaarlijks)
  const [lidOpenAgg] = await db
    .select({
      open:    sql<number>`coalesce(sum(${schoolMemberships.lidmaatschapBedrag}), 0)`,
      aantal: count(),
    })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
      eq(schoolMemberships.lidmaatschapStatus, 'open'),
      sql`${schoolMemberships.lidmaatschapBedrag} is not null`,
    ))

  // Recenste verhuur-rijen (laatste 25)
  const verhuurRijen = await db
    .select({
      id:         boatRentals.id,
      bootNummer: schoolFleet.bootNummer,
      bootNaam:   schoolFleet.naam,
      datum:      boatRentals.datum,
      huurderNaam: users.name,
      bedrag:     boatRentals.bedragCenten,
      betaaldOp:  boatRentals.betaaldOp,
      status:     boatRentals.status,
    })
    .from(boatRentals)
    .innerJoin(schoolFleet, eq(boatRentals.bootId, schoolFleet.id))
    .leftJoin(users, eq(boatRentals.userId, users.id))
    .where(and(eq(boatRentals.schoolId, schoolId), isNull(boatRentals.deletedAt)))
    .orderBy(desc(boatRentals.datum))
    .limit(25)

  // Leden met contributie
  const lidRijen = await db
    .select({
      userId:      schoolMemberships.userId,
      naam:        users.name,
      email:       users.email,
      bedrag:      schoolMemberships.lidmaatschapBedrag,
      status:      schoolMemberships.lidmaatschapStatus,
      sepaIban:    schoolMemberships.sepaIban,
      sepaMachtigingId: schoolMemberships.sepaMachtigingId,
    })
    .from(schoolMemberships)
    .innerJoin(users, eq(schoolMemberships.userId, users.id))
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
      sql`${schoolMemberships.lidmaatschapBedrag} is not null`,
    ))
    .orderBy(
      sql`case ${schoolMemberships.lidmaatschapStatus} when 'open' then 0 else 1 end`,
      desc(schoolMemberships.lidmaatschapBedrag),
    )

  const leden: FinLidRij[] = lidRijen.map(r => {
    const incassoGereed = !!(
      r.sepaIban && r.sepaMachtigingId && r.status === 'open'
    )
    return {
      userId: r.userId,
      naam: r.naam,
      email: r.email,
      bedrag: r.bedrag,
      status: (r.status === 'betaald' ? 'betaald' : 'open') as 'open' | 'betaald',
      sepaIban: r.sepaIban,
      sepaMachtigingId: r.sepaMachtigingId,
      incassoGereed,
    }
  })

  const incassoGereed = leden.filter(l => l.incassoGereed)

  const verhuurBetaald = Number(verhuurAgg?.betaald ?? 0)
  const verhuurOpen = Number(verhuurAgg?.open ?? 0)
  const lidmaatschapOpen = Number(lidOpenAgg?.open ?? 0)
  const lidmaatschapBetaald = leden
    .filter(l => l.status === 'betaald')
    .reduce((s, l) => s + (l.bedrag ?? 0), 0)

  return {
    schoolNaam: school.name,
    periode,
    kpis: {
      verhuurBetaald,
      verhuurOpen,
      verhuurOpenAantal: Number(verhuurOpenAantal?.n ?? 0),
      lidmaatschapBetaald,
      lidmaatschapOpen,
      lidmaatschapOpenAantal: Number(lidOpenAgg?.aantal ?? 0),
      totaalInkomsten: verhuurBetaald + lidmaatschapBetaald,
    },
    verhuur: verhuurRijen.map(r => ({
      id: r.id,
      bootNummer: r.bootNummer,
      bootNaam: r.bootNaam,
      datum: r.datum,
      huurderNaam: r.huurderNaam,
      bedrag: r.bedrag,
      betaaldOp: r.betaaldOp ? new Date(r.betaaldOp).toISOString() : null,
      status: r.status,
    })),
    leden,
    incassoGereed,
  }
}

// ─── HELPERS ────────────────────────────────────────────────────────────

// EUR-centen → "€ 45,00"
export function eur(centen: number | null | undefined): string {
  if (centen == null) return '—'
  const neg = centen < 0
  const euro = Math.abs(centen) / 100
  return (neg ? '−€ ' : '€ ') + euro.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Valideer + normaliseer IBAN (spaties verwijderen, hoofdletters)
export function normalizeIban(raw: string | null | undefined): string | null {
  if (!raw) return null
  const s = raw.replace(/\s+/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(s)) return null
  return s
}
