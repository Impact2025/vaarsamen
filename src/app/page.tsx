import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Achtergrond glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center text-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-[1.2rem] gradient-primary shadow-glow flex items-center justify-center">
            <span
              className="material-symbols-outlined text-on-primary text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              sailing
            </span>
          </div>
          <span className="font-headline font-black text-3xl text-on-surface tracking-tight">
            VaarSamen
          </span>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h1 className="font-headline font-black text-5xl text-on-surface tracking-tight leading-[0.95]">
            Vind jouw{' '}
            <span className="text-primary italic">zeilmaatje</span>
          </h1>
          <p className="font-body text-on-surface-variant text-lg leading-relaxed">
            Match op CWO-niveau, boot en beschikbaarheid.
            Vertrouwde zeilers, echte tochten.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2" aria-label="Kenmerken">
          {[
            { icon: 'verified', label: 'CWO gecheckt' },
            { icon: 'anchor',   label: '300+ havens' },
            { icon: 'favorite', label: 'Echte matches' },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-1.5 px-4 py-2 glass-card rounded-full border border-white/10"
            >
              <span className="material-symbols-outlined text-sm text-primary" style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
                {icon}
              </span>
              <span className="font-label text-xs font-semibold text-on-surface/80">{label}</span>
            </div>
          ))}
        </div>

        {/* CTA knoppen */}
        <div className="w-full space-y-3">
          <Link
            href="/login"
            className="block w-full py-5 rounded-full gradient-primary text-on-primary
                       font-headline font-extrabold text-lg text-center
                       shadow-glow active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            Begin met varen
          </Link>
          <Link
            href="/login"
            className="block w-full py-4 rounded-full glass-card text-on-surface
                       font-headline font-bold text-base text-center
                       border border-white/10 active:scale-95 transition-all
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-outline"
          >
            Inloggen
          </Link>
        </div>

        {/* Social proof */}
        <p className="font-label text-xs text-on-surface-variant">
          Al <strong className="text-primary">500+</strong> zeilers aan boord &bull; Gratis beginnen
        </p>
      </div>
    </main>
  )
}
