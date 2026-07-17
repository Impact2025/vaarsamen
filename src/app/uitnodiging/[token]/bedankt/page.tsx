import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Aanmelding verstuurd · VaarSamen' }

export default function BedanktPage() {
  return (
    <main className="min-h-screen bg-surface flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-[1.5rem] gradient-primary shadow-glow flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary text-3xl"
                  style={{ fontVariationSettings: "'FILL' 1" }} aria-hidden="true">
              mark_email_read
            </span>
          </div>
        </div>
        <div className="glass-card rounded-card p-6 space-y-3">
          <h1 className="font-headline font-black text-2xl text-on-surface tracking-tight">
            Aanmelding verstuurd
          </h1>
          <p className="font-body text-on-surface-variant">
            De school beoordeelt je aanmelding. Je krijgt een e-mail zodra je bent goedgekeurd —
            daarna kun je boten reserveren.
          </p>
        </div>
        <Link
          href="/ontdekken"
          className="inline-block font-label font-bold text-sm text-primary hover:underline"
        >
          Verder op VaarSamen
        </Link>
      </div>
    </main>
  )
}
