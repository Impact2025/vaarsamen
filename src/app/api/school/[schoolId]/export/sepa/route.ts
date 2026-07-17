import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sailingSchools, schoolMemberships } from '@/lib/db/schema'
import { getSchoolFinancieel, periodeVanLabel, normalizeIban } from '@/lib/db/queries/school-financieel'
import type { SchoolFinancieelConfig, FinLidRij } from '@/lib/db/queries/school-financieel'
import { buildSepaIncassoXml } from '@/lib/sepa'
import { and, eq, isNull } from 'drizzle-orm'

// POST /api/school/[schoolId]/export/sepa
// Genereert een pain.008 incasso-XML voor alle leden met een geldige
// SEPA-machtiging + IBAN + open contributie. De school moet als
// SEPA-crediteur geconfigureerd zijn (sailingSchools.financieel).
export async function POST(
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

  const [school] = await db.select({ fin: sailingSchools.financieel })
    .from(sailingSchools)
    .where(eq(sailingSchools.id, schoolId))
    .limit(1)
  const cfg = (school?.fin ?? null) as SchoolFinancieelConfig | null
  if (!cfg?.iban || !cfg?.creditorId || !cfg?.naam) {
    return Response.json({
      error: 'De school heeft nog geen SEPA-crediteurgegevens. Stel die in onder Instellingen → Financieel.',
    }, { status: 400 })
  }

  const fin = await getSchoolFinancieel(schoolId, periodeVanLabel('alle'))
  if (!fin) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  if (fin.incassoGereed.length === 0) {
    return Response.json({
      error: 'Geen leden met een geldige SEPA-machtiging + IBAN en een open contributie.',
    }, { status: 422 })
  }

  const xml = buildSepaIncassoXml(
    {
      creditorNaam: cfg.naam,
      creditorIban: cfg.iban,
      creditorBic: cfg.bic,
      creditorId: cfg.creditorId,
      type: cfg.type,
      uitvoerDatum: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    },
    fin.incassoGereed,
  )

  const filename = `sepa-incasso-${schoolId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.xml`
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
