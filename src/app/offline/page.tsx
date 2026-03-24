'use client'

export default function OfflinePage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-on-primary text-4xl" aria-hidden="true">wifi_off</span>
      </div>
      <h1 className="font-headline font-black text-3xl text-on-surface mb-3">Geen verbinding</h1>
      <p className="font-body text-on-surface-variant text-base leading-relaxed max-w-xs mb-8">
        VaarSamen heeft internet nodig om zeilers te laden. Controleer je verbinding en probeer opnieuw.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-8 py-4 rounded-full gradient-primary text-on-primary
                   font-headline font-extrabold text-base shadow-glow
                   active:scale-95 transition-all
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        Opnieuw proberen
      </button>
    </main>
  )
}
