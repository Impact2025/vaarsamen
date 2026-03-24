import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { getMyTochten } from '@/lib/db/queries/tochten'
import { db } from '@/lib/db'
import { boats, reviews } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import { CWO_LABELS, BOAT_LABELS, ROLE_LABELS, ROLE_EMOJI, SAILING_AREAS, GEBIED_COLOR_HEX } from '@/types'
import { signOut } from '@/lib/auth'
import { format, parseISO, isToday, isTomorrow } from 'date-fns'
import { nl } from 'date-fns/locale'

export default async function ProfielPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) redirect('/onboarding')

  const [profileBoats, profileReviews, myTochten] = await Promise.all([
    db.select().from(boats).where(eq(boats.profileId, profile.id)),
    db.select().from(reviews).where(eq(reviews.revieweeId, profile.id)).orderBy(desc(reviews.createdAt)).limit(5),
    getMyTochten(profile.id),
  ])

  return (
    <div className="px-4 pt-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline font-black text-2xl text-on-surface">Profiel</h1>
        <Link
          href="/profiel/bewerken"
          className="flex items-center gap-1.5 px-4 py-2 glass-card rounded-full border border-white/10
                     font-label text-sm font-bold text-on-surface hover:border-primary/30 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Profiel bewerken"
        >
          <span className="material-symbols-outlined text-sm text-primary" aria-hidden="true">edit</span>
          Bewerken
        </Link>
      </div>

      {/* Profiel foto + naam */}
      <div className="glass-card rounded-card p-6 mb-4">
        <div className="flex items-center gap-5 mb-5">
          <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-surface-container-high flex-shrink-0">
            {profile.photoUrl ? (
              <Image
                src={profile.photoUrl}
                alt="Jouw profielfoto"
                width={80}
                height={80}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant" aria-hidden="true">account_circle</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="font-headline font-extrabold text-2xl text-on-surface truncate">
              {profile.displayName}
              {profile.age && <span className="text-on-surface-variant font-normal text-xl">, {profile.age}</span>}
            </h2>
            {profile.homePort && (
              <div className="flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-sm text-on-surface-variant" aria-hidden="true">anchor</span>
                <span className="font-label text-xs text-on-surface-variant">{profile.homePort}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-lg" aria-hidden="true">{ROLE_EMOJI[profile.sailingRole ?? 'beide']}</span>
              <span className="font-label text-xs text-on-surface-variant">{ROLE_LABELS[profile.sailingRole ?? 'beide']}</span>
            </div>
          </div>
        </div>

        {/* CWO badge */}
        {profile.cwoLevel && profile.cwoLevel !== 'geen' && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border
              ${profile.cwoVerified
                ? 'border-primary/30 bg-primary/10'
                : 'border-white/10 bg-surface-container-high'}`}>
              <span
                className="material-symbols-outlined text-sm"
                style={{ fontVariationSettings: "'FILL' 1", color: profile.cwoVerified ? '#46f1c5' : '#85948d' }}
                aria-hidden="true"
              >
                {profile.cwoVerified ? 'verified' : 'anchor'}
              </span>
              <span className={`font-label text-xs font-bold ${profile.cwoVerified ? 'text-primary' : 'text-on-surface-variant'}`}>
                {CWO_LABELS[profile.cwoLevel]}
                {!profile.cwoVerified && ' (niet geverifieerd)'}
              </span>
            </div>
          </div>
        )}

        {/* Rating */}
        {profile.averageRating && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-base"
                  style={{
                    fontVariationSettings: `'FILL' ${i < Math.round(profile.averageRating!) ? 1 : 0}`,
                    color: i < Math.round(profile.averageRating!) ? '#46f1c5' : '#85948d',
                  }}
                  aria-hidden="true"
                >
                  star
                </span>
              ))}
            </div>
            <span className="font-label text-sm font-bold text-primary">{profile.averageRating.toFixed(1)}</span>
            <span className="font-label text-xs text-on-surface-variant">({profile.reviewCount} {profile.reviewCount === 1 ? 'review' : 'reviews'})</span>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <p className="font-body text-sm text-on-surface-variant leading-relaxed">{profile.bio}</p>
        )}
      </div>

      {/* Boten */}
      {profileBoats.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="boten-heading">
          <h3 id="boten-heading" className="font-label text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
            Mijn boten
          </h3>
          <ul className="space-y-2">
            {profileBoats.map(boat => (
              <li key={boat.id} className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" aria-hidden="true">sailing</span>
                <div>
                  <p className="font-label text-sm font-bold text-on-surface">
                    {boat.name ?? BOAT_LABELS[boat.type]}
                  </p>
                  {boat.homePort && (
                    <p className="font-label text-xs text-on-surface-variant">{boat.homePort}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Vaargebieden */}
      {profile.sailingAreas && profile.sailingAreas.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="gebieden-heading">
          <h3 id="gebieden-heading" className="font-label text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
            Vaargebieden
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.sailingAreas.map(area => {
              const kleur = GEBIED_COLOR_HEX[area]
              const label = SAILING_AREAS.find(a => a.id === area)?.label ?? area
              return (
                <span key={area}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label text-xs font-semibold"
                  style={kleur ? { backgroundColor: kleur + '22', borderColor: kleur + '44', color: kleur, border: '1px solid' } : {}}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} aria-hidden="true" />
                  {label}
                </span>
              )
            })}
          </div>
        </section>
      )}

      {/* Reviews */}
      {profileReviews.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="reviews-heading">
          <h3 id="reviews-heading" className="font-label text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
            Reviews
          </h3>
          <ul className="space-y-4">
            {profileReviews.map(review => (
              <li key={review.id} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-sm"
                      style={{
                        fontVariationSettings: `'FILL' ${i < review.rating ? 1 : 0}`,
                        color: i < review.rating ? '#46f1c5' : '#85948d',
                      }}
                      aria-hidden="true"
                    >
                      star
                    </span>
                  ))}
                </div>
                {review.text && (
                  <p className="font-body text-sm text-on-surface-variant">{review.text}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Mijn oproepen */}
      {myTochten.length > 0 && (
        <section className="glass-card rounded-card p-5 mb-4" aria-labelledby="oproepen-heading">
          <div className="flex items-center justify-between mb-3">
            <h3 id="oproepen-heading" className="font-label text-sm font-bold text-on-surface uppercase tracking-wider">
              Mijn oproepen
            </h3>
            <Link
              href="/tochten/nieuw"
              className="flex items-center gap-1 font-label text-xs text-primary hover:underline"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
              Nieuwe oproep
            </Link>
          </div>
          <ul className="space-y-3">
            {myTochten.map(({ tocht, aanmeldingen }) => {
              const datum      = parseISO(tocht.datum as string)
              const datumLabel = isToday(datum) ? 'Vandaag'
                : isTomorrow(datum) ? 'Morgen'
                : format(datum, 'EEE d MMM', { locale: nl })
              const kleur      = GEBIED_COLOR_HEX[tocht.vaargebied] ?? '#46f1c5'
              const gebied     = SAILING_AREAS.find(a => a.id === tocht.vaargebied)?.label ?? tocht.vaargebied
              const isPast     = new Date(tocht.datum as string) < new Date(new Date().toISOString().slice(0,10))

              return (
                <li key={tocht.id}>
                  <Link
                    href={`/tochten/${tocht.id}`}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                      ${isPast ? 'opacity-50 border-white/5 bg-surface-container/50' : 'border-white/5 bg-surface-container hover:border-primary/20'}`}
                  >
                    <div className="w-1.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: kleur }} />
                    <div className="flex-1 min-w-0">
                      <p className="font-label text-xs font-black capitalize mb-0.5" style={{ color: isPast ? undefined : kleur }}>
                        {datumLabel} · {gebied}
                      </p>
                      <p className="font-headline font-bold text-sm text-on-surface line-clamp-1">{tocht.titel}</p>
                      {tocht.locatie && (
                        <p className="font-label text-xs text-on-surface-variant mt-0.5">{tocht.locatie}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {aanmeldingen > 0 ? (
                        <span className="px-2.5 py-1 rounded-full font-label text-xs font-bold"
                          style={{ backgroundColor: kleur + '22', color: kleur }}>
                          {aanmeldingen} aanm.
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-surface-container-high font-label text-xs text-on-surface-variant">
                          0 aanm.
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full font-label text-[10px] font-semibold
                        ${tocht.status === 'open' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                        {tocht.status}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {myTochten.length === 0 && (
        <section className="glass-card rounded-card p-5 mb-4 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block" aria-hidden="true">directions_boat</span>
          <p className="font-body text-sm text-on-surface-variant mb-3">Nog geen oproepen geplaatst</p>
          <Link
            href="/tochten/nieuw"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full gradient-primary text-on-primary font-label text-sm font-bold shadow-glow active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">add</span>
            Oproep plaatsen
          </Link>
        </section>
      )}

      {/* Uitloggen */}
      <form action={async () => {
        'use server'
        await signOut({ redirectTo: '/' })
      }}>
        <button
          type="submit"
          className="w-full py-4 rounded-full glass-card border border-error/20 text-error
                     font-label font-bold text-sm hover:bg-error/10 transition-all
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-error"
        >
          Uitloggen
        </button>
      </form>
    </div>
  )
}
