import { put } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  // Rate limiting per gebruiker
  const { allowed } = checkRateLimit(
    `upload:${session.user.id}`,
    RATE_LIMITS.upload.max,
    RATE_LIMITS.upload.windowMs
  )
  if (!allowed) return Response.json({ error: 'Te veel uploads' }, { status: 429 })

  const form = await req.formData()
  const file = form.get('file') as File | null

  if (!file) return Response.json({ error: 'Geen bestand meegestuurd' }, { status: 400 })
  if (file.size > MAX_FILE_SIZE) return Response.json({ error: 'Bestand te groot (max 5MB)' }, { status: 400 })
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: 'Ongeldig bestandstype. Gebruik JPG, PNG, WebP of GIF.' }, { status: 400 })
  }

  const profile = await getProfileByUserId(session.user.id)
  const folder  = profile ? `avatars/${profile.id}` : `temp/${session.user.id}`

  const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, {
    access:      'public',
    contentType: file.type,
  })

  return Response.json({ url: blob.url })
}
