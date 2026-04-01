// ─── OPENROUTER CONFIG ────────────────────────────────────────────────────────

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1'

export const AI_MODEL = process.env.OPENROUTER_MODEL ?? 'anthropic/claude-opus-4.5'

// ─── STREAMING HELPER ─────────────────────────────────────────────────────────
// Stuurt een chat-completions request naar OpenRouter en schrijft text-deltas
// naar de gegeven ReadableStreamDefaultController.

export async function streamToController(
  controller: ReadableStreamDefaultController,
  opts: {
    system:   string
    prompt:   string
    maxTokens?: number
    signal?:  AbortSignal
  },
) {
  const encoder = new TextEncoder()

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method:  'POST',
    signal:  opts.signal,
    headers: {
      'Authorization':  `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type':   'application/json',
      'HTTP-Referer':   'https://vaarsamen.nl',
      'X-Title':        'VaarSamen',
    },
    body: JSON.stringify({
      model:      AI_MODEL,
      stream:     true,
      max_tokens: opts.maxTokens ?? 2048,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user',   content: opts.prompt },
      ],
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`OpenRouter fout ${res.status}: ${body}`)
  }

  const reader = res.body!.getReader()
  const dec    = new TextDecoder()
  let   buf    = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })

    // SSE: elke regel begint met "data: "
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''   // laatste onvolledige regel bewaren

    for (const line of lines) {
      const data = line.trim()
      if (!data || data === 'data: [DONE]') continue
      if (!data.startsWith('data: ')) continue

      try {
        const json   = JSON.parse(data.slice(6))
        const delta  = json.choices?.[0]?.delta?.content
        if (typeof delta === 'string' && delta) {
          controller.enqueue(encoder.encode(delta))
        }
      } catch {
        // Incomplete JSON chunk — overslaan
      }
    }
  }
}

// ─── SCORE LABELS ─────────────────────────────────────────────────────────────

export const SCORE_LABELS: Record<string, string> = {
  aangeboden: 'Aangeboden (A)',
  matig:      'Matig (M)',
  redelijk:   'Redelijk (R)',
  beheerst:   'Beheerst (B)',
}
