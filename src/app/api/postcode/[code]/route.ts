// Postcode → plaats + coördinaten via PDOK Locatieserver (gratis, geen key nodig)
// https://api.pdok.nl/bzk/locatieserver/search/v3_1/free

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params

  // Sanitize: alleen letters en cijfers, max 6 tekens
  const sanitized = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)

  if (!/^\d{4}[A-Z]{2}$/.test(sanitized)) {
    return Response.json({ error: 'Ongeldige postcode' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${sanitized}&fl=postcode,woonplaatsnaam,centroide_ll&rows=1&fq=type:postcode`,
      { next: { revalidate: 86400 } } // Cache 24 uur — plaatsnamen veranderen niet
    )

    if (!res.ok) throw new Error('PDOK API fout')

    const data = await res.json()
    const doc  = data?.response?.docs?.[0]

    if (!doc) {
      return Response.json({ error: 'Postcode niet gevonden' }, { status: 404 })
    }

    // centroide_ll formaat: "POINT(lng lat)"
    const match = doc.centroide_ll?.match(/POINT\(([\d.]+)\s+([\d.]+)\)/)
    const lng   = match ? parseFloat(match[1]) : null
    const lat   = match ? parseFloat(match[2]) : null

    // Normaliseer postcode naar "1234 AB"
    const postcode = sanitized.slice(0, 4) + ' ' + sanitized.slice(4)

    return Response.json({ postcode, city: doc.woonplaatsnaam, lat, lng })
  } catch {
    return Response.json({ error: 'Postcode opzoeken mislukt' }, { status: 502 })
  }
}
