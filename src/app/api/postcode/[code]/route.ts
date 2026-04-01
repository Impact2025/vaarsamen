// Postcode → plaats + coördinaten via PDOK Locatieserver (gratis, geen key nodig)
// Met huisnummer → ook straatnaam ophalen
// https://api.pdok.nl/bzk/locatieserver/search/v3_1/free

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params
  const { searchParams } = new URL(req.url)
  const huisnummer = searchParams.get('huisnummer')?.trim()

  // Sanitize: alleen letters en cijfers, max 6 tekens
  const sanitized = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6)

  if (!/^\d{4}[A-Z]{2}$/.test(sanitized)) {
    return Response.json({ error: 'Ongeldige postcode' }, { status: 400 })
  }

  try {
    // Met huisnummer: adresopzoeking (geeft ook straatnaam)
    if (huisnummer && /^\d+/.test(huisnummer)) {
      const q   = `${sanitized} ${huisnummer}`
      const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${encodeURIComponent(q)}&fq=type:adres&fl=straatnaam,woonplaatsnaam,huisnummer,postcode,centroide_ll&rows=1`
      const res = await fetch(url, { next: { revalidate: 86400 } })

      if (!res.ok) throw new Error('PDOK API fout')
      const data = await res.json()
      const doc  = data?.response?.docs?.[0]

      if (doc) {
        const match = doc.centroide_ll?.match(/POINT\(([\d.]+)\s+([\d.]+)\)/)
        const pc    = doc.postcode?.replace(/(\d{4})([A-Z]{2})/, '$1 $2') ?? sanitized.slice(0, 4) + ' ' + sanitized.slice(4)
        return Response.json({
          postcode:  pc,
          city:      doc.woonplaatsnaam ?? null,
          straat:    doc.straatnaam ?? null,
          huisnummer: doc.huisnummer ?? huisnummer,
          lat:       match ? parseFloat(match[2]) : null,
          lng:       match ? parseFloat(match[1]) : null,
        })
      }
    }

    // Alleen postcode: geeft stad terug
    const url = `https://api.pdok.nl/bzk/locatieserver/search/v3_1/free?q=${sanitized}&fl=postcode,woonplaatsnaam,centroide_ll&rows=1&fq=type:postcode`
    const res = await fetch(url, { next: { revalidate: 86400 } })

    if (!res.ok) throw new Error('PDOK API fout')
    const data = await res.json()
    const doc  = data?.response?.docs?.[0]

    if (!doc) {
      return Response.json({ error: 'Postcode niet gevonden' }, { status: 404 })
    }

    const match    = doc.centroide_ll?.match(/POINT\(([\d.]+)\s+([\d.]+)\)/)
    const postcode = sanitized.slice(0, 4) + ' ' + sanitized.slice(4)

    return Response.json({
      postcode,
      city:      doc.woonplaatsnaam ?? null,
      straat:    null,
      huisnummer: null,
      lat:       match ? parseFloat(match[2]) : null,
      lng:       match ? parseFloat(match[1]) : null,
    })
  } catch {
    return Response.json({ error: 'Postcode opzoeken mislukt' }, { status: 502 })
  }
}
