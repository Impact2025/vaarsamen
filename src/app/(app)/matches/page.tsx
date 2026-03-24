import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getMatchesForProfile } from '@/lib/db/queries/matches'
import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { nl } from 'date-fns/locale'
import { MatchCardSkeleton } from '@/components/ui/Skeleton'

export default async function MatchesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) redirect('/onboarding')

  const matches = await getMatchesForProfile(profile.id)

  return (
    <div className="px-4 pt-6">
      <header className="mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Matches</h1>
        <p className="font-body text-sm text-on-surface-variant mt-1">
          {matches.length} {matches.length === 1 ? 'match' : 'matches'}
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4" aria-hidden="true">
            sailing
          </span>
          <h2 className="font-headline font-bold text-xl text-on-surface mb-2">
            Nog geen matches
          </h2>
          <p className="font-body text-sm text-on-surface-variant mb-6">
            Ga swipen om je eerste zeilmaatje te vinden!
          </p>
          <Link
            href="/ontdekken"
            className="gradient-primary text-on-primary font-label font-bold
                       px-8 py-4 rounded-full shadow-glow"
          >
            Ontdekken
          </Link>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Matches lijst">
          {matches.map((match) => (
            <li key={match.id}>
              <Link
                href={`/matches/${match.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl glass-card border border-white/5
                           hover:border-primary/20 active:scale-[0.98] transition-all
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Chat met ${match.profile?.displayName}`}
              >
                {/* Foto */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container-high">
                    {match.profile?.photoUrl ? (
                      <Image
                        src={match.profile.photoUrl}
                        alt={`Foto van ${match.profile.displayName}`}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-2xl text-on-surface-variant" aria-hidden="true">person</span>
                      </div>
                    )}
                  </div>
                  {match.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full gradient-primary
                                    flex items-center justify-center" aria-label={`${match.unreadCount} ongelezen berichten`}>
                      <span className="font-label text-[10px] font-black text-on-primary">
                        {match.unreadCount > 9 ? '9+' : match.unreadCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label font-bold text-sm text-on-surface truncate">
                      {match.profile?.displayName}
                    </span>
                    {match.lastMessage && (
                      <span className="font-label text-[10px] text-on-surface-variant flex-shrink-0 ml-2">
                        {match.lastMessage.createdAt ? formatDistanceToNow(new Date(String(match.lastMessage.createdAt)), { addSuffix: true, locale: nl }) : ''}
                      </span>
                    )}
                  </div>
                  <p className={`font-body text-xs truncate ${match.unreadCount > 0 ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
                    {match.lastMessage
                      ? match.lastMessage.content
                      : 'Nieuwe match! Stuur een bericht.'}
                  </p>
                </div>

                <span className="material-symbols-outlined text-sm text-on-surface-variant flex-shrink-0" aria-hidden="true">
                  chevron_right
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
