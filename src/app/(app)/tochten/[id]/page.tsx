import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getTochtById } from '@/lib/db/queries/tochten'
import { TochtDetailClient } from './TochtDetailClient'
import { SAILING_AREAS } from '@/types'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const detail  = await getTochtById(id)
  if (!detail) return { title: 'Tocht niet gevonden' }

  const { tocht, poster } = detail
  const gebied = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied
  const desc   = tocht.beschrijving
    ? tocht.beschrijving.slice(0, 160)
    : `${poster.displayName} zoekt een maatje voor een tocht op ${gebied}.`

  return {
    title: `${tocht.titel} · VaarSamen`,
    description: desc,
    openGraph: {
      title:       tocht.titel,
      description: desc,
      siteName:    'VaarSamen',
      type:        'article',
      ...(poster.photoUrl ? { images: [{ url: poster.photoUrl, width: 400, height: 500 }] } : {}),
    },
    twitter: {
      card:        'summary',
      title:       tocht.titel,
      description: desc,
    },
  }
}

export default async function TochtDetailPage({ params }: Props) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { id } = await params
  const [detail, userProfile] = await Promise.all([
    getTochtById(id),
    getProfileByUserId(session.user.id),
  ])

  if (!detail) notFound()

  const myProfileId = userProfile?.id ?? null
  const isPoster    = myProfileId === detail.tocht.profileId

  return (
    <TochtDetailClient
      {...detail}
      myProfileId={myProfileId}
      isPoster={isPoster}
    />
  )
}
