// ─── BPR RECORDING API ───────────────────────────────────────────────────────────
// Video upload + status management voor Basis Praktijk Registratie

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { bprRecordings, schoolLessons } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { put } from '@vercel/blob'

// POST /api/school/[schoolId]/bpr
// Upload BPR video (max 2 min, MP4/WEBM)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const formData = await req.formData()
  const video = formData.get('video') as File
  const lesId = formData.get('lesId') as string
  const bootType = formData.get('bootType') as string

  if (!video || !lesId || !bootType) {
    return Response.json({ error: 'video, lesId, bootType required' }, { status: 400 })
  }

  // Upload to Vercel Blob
  const blob = await put(`bpr/${schoolId}/${lesId}/${video.name}`, video, {
    access: 'public',
    contentType: video.type,
  })

  // Create BPR record
  const [recording] = await db
    .insert(bprRecordings)
    .values({
      schoolId,
      lesId,
      userId: session.user.id,
      bootType: bootType as any,
      blobKey: blob.url,
    })
    .returning()

  return Response.json(recording)
}

// GET /api/school/[schoolId]/bpr
// Lijst BPR recordings (filter op lesId)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const { searchParams } = new URL(req.url)
  const lesId = searchParams.get('lesId')

  const recordings = await db
    .select()
    .from(bprRecordings)
    .where(lesId ? eq(bprRecordings.lesId, lesId) : eq(bprRecordings.schoolId, schoolId))

  return Response.json(recordings)
}