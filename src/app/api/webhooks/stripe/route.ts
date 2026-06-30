// ─── STRIPE WEBHOOK ───────────────────────────────────────────────────────────────

import { db } from '@/lib/db'
import { subscriptions, invoices } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// POST /api/webhooks/stripe
export async function POST(req: Request) {
  const sig = req.headers.get('stripe-signature')
  const body = await req.text()

  if (!process.env.STRIPE_WEBHOOK_SECRET) return new Response('No webhook secret', { status: 500 })

  // Webhook handling - implementeer later met Stripe SDK
  return Response.json({ received: true })
}