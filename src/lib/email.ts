import { Resend } from 'resend'

// Centrale server-side e-mail helper. Gebruikt Resend wanneer RESEND_API_KEY
// aanwezig is; anders logt hij alleen (zodat dev/test niet crasht).

const FROM = process.env.EMAIL_FROM ?? 'VaarSamen <noreply@vaarsamen.nl>'

let client: Resend | null = null
if (process.env.RESEND_API_KEY) {
  client = new Resend(process.env.RESEND_API_KEY)
}

export type SendArgs = {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
}

export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!client) {
    // Geen Resend key — in dev/preview alleen loggen
    console.info('[email] (no RESEND_API_KEY) zou verzenden naar', to, '—', subject)
    return { ok: true, id: 'dev-noop' }
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
      ...(replyTo ? { replyTo } : {}),
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true, id: data?.id }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// Fire-and-forget variant (niet op de response wachten, wel fout loggen)
export function sendEmailAsync(args: SendArgs): void {
  void sendEmail(args).then(r => {
    if (!r.ok) console.error('[email] verzenden mislukt:', r.error)
  })
}
