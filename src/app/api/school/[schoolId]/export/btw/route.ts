import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sailingSchools, schoolMemberships, boatRentals, schoolFleet } from '@/lib/db/schema'
import {
  getSchoolFinancieel, periodeVanLabel, eur,
} from '@/lib/db/queries/school-financieel'
import { buildBtwCsv, type BtwTarief } from '@/lib/sepa'
import { and, eq, desc, isNull, sql, gte, lte, inArray } from 'drizzle-orm'

// GET /api/school/[schoolId]/export/btw?periode=deze_kwartaal
// BTW-overzicht (CSV) van de verhuur-inkomsten in de gekozen periode.
// Verhuur aan particulieren = 21% (aanpasbaar via query-param tarief).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await db.select({ role: schoolMemberships.role })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, session.user.id), isNull(schoolMemberships.deletedAt)))
    .limit(1)
  if (!['eigenaar', 'instructeur'].includes(membership?.[0]?.role ?? '')) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const label = (searchParams.get('periode') ?? 'deze_kwartaal') as
    | 'deze_maand' | 'deze_kwartaal' | 'dit_jaar' | 'alle'
  const tarief: BtwTarief = (searchParams.get('tarief') as BtwTarief) ?? 'hoog'

  const [school] = await db.select({ naam: sailingSchools.name })
    .from(sailingSchools)
    .where(eq(sailingSchools.id, schoolId))
    .limit(1)
  const periode = periodeVanLabel(label)

  // Verhuur met bedrag binnen periode
  const rijen = await db
    .select({
      id: boatRentals.id,
      bootNummer: schoolFleet.bootNummer,
      bootNaam: schoolFleet.naam,
      datum: boatRentals.datum,
      bedrag: boatRentals.bedragCenten,
    })
    .from(boatRentals)
    .innerJoin(schoolFleet, eq(boatRentals.bootId, schoolFleet.id))
    .where(and(
      eq(boatRentals.schoolId, schoolId),
      isNull(boatRentals.deletedAt),
      sql`${boatRentals.bedragCenten} is not null`,
      gte(boatRentals.datum, periode.van),
      lte(boatRentals.datum, periode.tot),
    ))
    .orderBy(desc(boatRentals.datum))

  if (rijen.length === 0) {
    return Response.json({ error: 'Geen verhuur-inkomsten in deze periode.' }, { status: 422 })
  }

  const csv = buildBtwCsv(
    school?.naam ?? 'Zeilschool',
    periode.label,
    rijen.map(r => ({
      omschrijving: `Verhuur boot ${r.bootNummer}${r.bootNaam ? ` (${r.bootNaam})` : ''} ${r.datum}`,
      bedragCenten: r.bedrag ?? 0,
      tarief,
    })),
  )

  const filename = `btw-${label}-${new Date().toISOString().slice(0, 10)}.csv`
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
