import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { lessonMaterials, sailingSchools } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'

const BEHEER_ROLES = ['eigenaar', 'instructeur'] as const

// Self-healing: zorg dat de tabel bestaat op prod (idempotent).
async function ensureTable() {
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS lesson_materials (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      school_id uuid NOT NULL REFERENCES sailing_schools(id) ON DELETE CASCADE,
      titel varchar(160) NOT NULL,
      beschrijving text,
      bestands_naam varchar(255) NOT NULL,
      bestands_url text NOT NULL,
      bestands_type varchar(120),
      bestands_grootte integer,
      cwo_niveau cwo_level DEFAULT 'geen',
      categorie varchar(40) DEFAULT 'theorie',
      uploaded_by_id uuid REFERENCES users(id),
      created_at timestamp DEFAULT now()
    )
  `))
  await db.execute(sql.raw(
    'CREATE INDEX IF NOT EXISTS lesson_materials_school_idx ON lesson_materials (school_id)'
  ))
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })

  try {
    await ensureTable()
  } catch { /* tabel bestaat al */ }

  const rows = await db
    .select()
    .from(lessonMaterials)
    .where(sql`${lessonMaterials.schoolId} = ${schoolId}`)
    .orderBy(sql`${lessonMaterials.createdAt} DESC`)

  return NextResponse.json({ materialen: rows })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { schoolId } = await params
    const membership = await getSchoolMembership(schoolId, session.user.id)
    if (!membership || !BEHEER_ROLES.includes(membership.role as any)) {
      return NextResponse.json({ error: 'Alleen instructeurs en eigenaren mogen lesmateriaal toevoegen' }, { status: 403 })
    }

    const body = await req.json()
    const titel = (body.titel as string)?.trim()
    const beschrijving = (body.beschrijving as string)?.trim() || null
    const cwoNiveau = (body.cwoNiveau as string) || 'geen'
    const categorie = (body.categorie as string) || 'theorie'
    const bestandsNaam = (body.bestandsNaam as string) || 'bestand'
    const bestandstype = (body.bestandstype as string) || 'application/octet-stream'
    const dataB64 = body.data as string // base64 van de bestandsinhoud
    const bestandsGrootte = Number(body.bestandsGrootte) || 0

    if (!titel) {
      return NextResponse.json({ error: 'Titel is verplicht' }, { status: 400 })
    }
    if (!dataB64 || bestandsGrootte === 0) {
      return NextResponse.json({ error: 'Bestand ontbreekt' }, { status: 400 })
    }
    if (bestandsGrootte > 25 * 1024 * 1024) {
      return NextResponse.json({ error: 'Bestand is groter dan 25 MB' }, { status: 400 })
    }

    const buffer = Buffer.from(dataB64, 'base64')
    const ext = (bestandsNaam.split('.').pop() || 'bin').slice(0, 8)
    const safeName = titel.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
    const pathname = `lesmateriaal/${schoolId}/${Date.now()}-${safeName}.${ext}`

    console.error('[lesmateriaal] put start', { pathname, size: buffer.length, type: bestandstype })
    const blob = await put(pathname, buffer, {
      access: 'public',
      contentType: bestandstype,
      addRandomSuffix: false,
    })
    console.error('[lesmateriaal] put done', { url: blob.url.slice(0, 60) })

    try {
      await ensureTable()
    } catch { /* bestaat al */ }

    const [row] = await db
      .insert(lessonMaterials)
      .values({
        schoolId,
        titel,
        beschrijving,
        bestandsNaam,
        bestandsUrl: blob.url,
        bestandstype,
        bestandsGrootte,
        cwoNiveau: cwoNiveau as any,
        categorie: categorie as any,
        uploadedById: session.user.id,
      })
      .returning()

    console.error('[lesmateriaal] insert done', { id: row.id })
    return NextResponse.json({ materiaal: row }, { status: 201 })
  } catch (err: any) {
    console.error('[lesmateriaal] POST ERROR', err?.message, err?.stack?.slice(0, 400))
    return NextResponse.json({ error: 'Serverfout bij upload', detail: String(err?.message ?? err) }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !BEHEER_ROLES.includes(membership.role as any)) {
    return NextResponse.json({ error: 'Geen toegang' }, { status: 403 })
  }
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id vereist' }, { status: 400 })

  const [row] = await db
    .select()
    .from(lessonMaterials)
    .where(sql`${lessonMaterials.id} = ${id} AND ${lessonMaterials.schoolId} = ${schoolId}`)
    .limit(1)
  if (!row) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })

  try {
    const { del } = await import('@vercel/blob')
    await del(row.bestandsUrl)
  } catch { /* bestand al weg */ }

  await db.execute(sql`DELETE FROM lesson_materials WHERE id = ${id}`)
  return NextResponse.json({ ok: true })
}
