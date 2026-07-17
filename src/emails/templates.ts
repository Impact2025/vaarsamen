// VaarSamen — gedeelde email templates
// Inline styles zijn verplicht voor brede emailclient-compatibiliteit.
// Kleurenpalet volgt de lichte variant van de website.

const TEAL        = '#46f1c5'
const TEAL_DARK   = '#00d4aa'
const ON_TEAL     = '#00382b'
const TEXT        = '#0f172a'
const TEXT_MUTED  = '#64748b'
const TEXT_FOOTER = '#94a3b8'
const BG          = '#f0f5f9'
const CARD        = '#ffffff'
const BORDER      = '#e2e8f0'
const FOOTER_BG   = '#f8fafc'

// Vereenvoudigde vector zeilboot — compatibel met de meeste emailclients
const LOGO_SVG = `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
  <rect width="36" height="36" rx="9" fill="${TEAL}"/>
  <path d="M18 8v16" stroke="${ON_TEAL}" stroke-width="2" stroke-linecap="round"/>
  <path d="M18 9L10 20h8V9z" fill="${ON_TEAL}" opacity="0.9"/>
  <path d="M18 9l8 7h-8V9z" fill="${ON_TEAL}" opacity="0.55"/>
  <path d="M8 26c2.5-1.5 5-1.5 10 0s7.5 1.5 10 0" stroke="${ON_TEAL}" stroke-width="2" stroke-linecap="round"/>
</svg>`.trim()

function header(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" role="presentation">
            <tr>
              <td style="vertical-align:middle;padding-right:10px;">${LOGO_SVG}</td>
              <td style="vertical-align:middle;">
                <span style="font-size:20px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">VaarSamen</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`
}

function footer(): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
      style="background:${FOOTER_BG};border-top:1px solid ${BORDER};border-radius:0 0 16px 16px;">
      <tr>
        <td style="padding:20px 40px;text-align:center;">
          <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            VaarSamen &mdash; Vind jouw zeilmaatje
          </p>
          <p style="margin:6px 0 0;font-size:12px;color:${TEXT_FOOTER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            &copy; ${new Date().getFullYear()} VaarSamen. Alle rechten voorbehouden.
          </p>
        </td>
      </tr>
    </table>`
}

function wrap(content: string): string {
  return `<!DOCTYPE html>
<html lang="nl" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:${BG};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
    style="background:${BG};padding:48px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

          <!-- Logo header -->
          <tr><td>${header()}</td></tr>

          <!-- Card -->
          <tr>
            <td style="background:${CARD};border-radius:16px;border:1px solid ${BORDER};overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:40px 40px 36px;">
                    ${content}
                  </td>
                </tr>
                <tr><td>${footer()}</td></tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, url: string): string {
  return `
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0;">
      <tr>
        <td style="border-radius:10px;background:${TEAL};" align="center">
          <a href="${url}"
            style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:${ON_TEAL};text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;border-radius:10px;background:${TEAL};">
            ${label}
          </a>
        </td>
      </tr>
    </table>`
}

function divider(): string {
  return `<hr style="margin:24px 0;border:none;border-top:1px solid ${BORDER};" />`
}

function bodyText(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:${TEXT};letter-spacing:-0.02em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</h1>`
}

function mutedText(text: string): string {
  return `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${text}</p>`
}

// ─────────────────────────────────────────────
// Template 1: Magic link (inloggen / registreren)
// ─────────────────────────────────────────────
export function magicLinkEmail({ url, isNew = false }: { url: string; isNew?: boolean }): string {
  const action = isNew ? 'account aanmaken' : 'aanmelden'
  const content = `
    ${heading(`Jouw aanmeldlink`)}
    ${bodyText(`Je hebt een link aangevraagd om je ${action} bij VaarSamen. Klik op de knop hieronder om verder te gaan.`)}
    ${ctaButton('Aanmelden bij VaarSamen', url)}
    ${divider()}
    ${mutedText('Deze link is 24 uur geldig en kan slechts eenmaal gebruikt worden.')}
    ${mutedText('Heb je dit verzoek niet gedaan? Dan kun je deze email veilig negeren.')}
    ${mutedText(`Of kopieer deze link in je browser: <a href="${url}" style="color:${TEAL_DARK};word-break:break-all;">${url}</a>`)}
  `
  return wrap(content)
}

export function magicLinkText({ url }: { url: string }): string {
  return [
    'VaarSamen — Jouw aanmeldlink',
    '',
    'Klik op de onderstaande link om aan te melden bij VaarSamen.',
    'De link is 24 uur geldig en kan slechts eenmaal gebruikt worden.',
    '',
    url,
    '',
    'Heb je dit verzoek niet gedaan? Dan kun je deze email veilig negeren.',
    '',
    '— VaarSamen',
  ].join('\n')
}

// ─────────────────────────────────────────────
// Template 2: Admin rapportage notificatie
// ─────────────────────────────────────────────
export function reportNotificationEmail({
  reportedId,
  total,
  reason,
  description,
}: {
  reportedId: string
  total: number
  reason: string
  description?: string
}): string {
  const content = `
    ${heading(`Profiel heeft ${total} rapportages ontvangen`)}
    ${bodyText(`Profiel <strong style="color:${TEXT};">${reportedId}</strong> heeft in totaal <strong style="color:${TEXT};">${total} rapportages</strong> ontvangen en vereist mogelijk aandacht.`)}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:20px;">
      <tr>
        <td style="padding:16px;background:${BG};border-radius:10px;border:1px solid ${BORDER};">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Reden</p>
          <p style="margin:0 0 12px;font-size:14px;color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${reason}</p>
          ${description ? `
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:${TEXT_MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">Toelichting</p>
          <p style="margin:0;font-size:14px;color:${TEXT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${description}</p>
          ` : ''}
        </td>
      </tr>
    </table>
    ${ctaButton('Bekijk admin dashboard', 'https://vaarsamen.nl/admin')}
    ${mutedText('Dit bericht is automatisch verzonden door het VaarSamen rapportagesysteem.')}
  `
  return wrap(content)
}

export function reportNotificationText({
  reportedId,
  total,
  reason,
  description,
}: {
  reportedId: string
  total: number
  reason: string
  description?: string
}): string {
  return [
    `[VaarSamen Admin] Profiel ${reportedId} heeft ${total} rapportages`,
    '',
    `Profiel ${reportedId} heeft ${total} rapportages ontvangen.`,
    '',
    `Reden: ${reason}`,
    description ? `Toelichting: ${description}` : '',
    '',
    'Controleer via het admin dashboard: https://vaarsamen.nl/admin',
  ].filter(Boolean).join('\n')
}

// ─────────────────────────────────────────────
// Template 3: Nieuwsbrief double-opt-in bevestiging
// ─────────────────────────────────────────────

export function newsletterConfirmEmail({
  schoolName,
  confirmUrl,
}: {
  schoolName: string
  confirmUrl: string
}): string {
  const content = `
    ${heading(`Bevestig je inschrijving`)}
    ${bodyText(`Bedankt voor je interesse in de nieuwsbrief van ${schoolName}. Klik op de knop hieronder om je inschrijving te bevestigen. Zo weten we zeker dat dit echt jouw e-mailadres is.`)}
    ${ctaButton('Inschrijving bevestigen', confirmUrl)}
    ${divider()}
    ${mutedText('Geen nieuwsbrief van ons verwacht? Dan kun je deze email veilig negeren. Je wordt dan niet ingeschreven.')}
  `
  return wrap(content)
}

export function newsletterConfirmText({
  schoolName,
  confirmUrl,
}: {
  schoolName: string
  confirmUrl: string
}): string {
  return [
    `${schoolName} — Bevestig je nieuwsbrief-inschrijving`,
    '',
    `Klik op de onderstaande link om je inschrijving voor de nieuwsbrief van ${schoolName} te bevestigen:`,
    confirmUrl,
    '',
    'Geen nieuwsbrief verwacht? Negeer deze mail.',
    '',
    '— VaarSamen',
  ].join('\n')
}

// ─────────────────────────────────────────────
// Template 4: Nieuwsbrief zelf (campagne body)
// ─────────────────────────────────────────────
// Wrap een door de school geschreven HTML-body in het merk-template,
// met verplichte uitschrijf- en webversie-links (AVG).

export function newsletterCampaignEmail({
  schoolName,
  subject,
  bodyHtml,
  unsubscribeUrl,
  webUrl,
}: {
  schoolName: string
  subject: string
  bodyHtml: string
  unsubscribeUrl: string
  webUrl: string
}): string {
  const content = `
    ${bodyHtml}
    ${divider()}
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center" style="padding-top:8px;">
          <p style="margin:0 0 8px;font-size:12px;color:${TEXT_FOOTER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            Je ontvangt deze mail van ${schoolName} via VaarSamen.
          </p>
          <p style="margin:0;font-size:12px;color:${TEXT_FOOTER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <a href="${webUrl}" style="color:${TEAL_DARK};text-decoration:none;">Bekijk in je browser</a>
            &nbsp;·&nbsp;
            <a href="${unsubscribeUrl}" style="color:${TEAL_DARK};text-decoration:none;">Uitschrijven</a>
          </p>
        </td>
      </tr>
    </table>
  `
  return wrap(content)
}

// ─────────────────────────────────────────────
// Template 5: Bevestiging uitschrijven
// ─────────────────────────────────────────────

export function newsletterUnsubscribeEmail({ schoolName }: { schoolName: string }): string {
  const content = `
    ${heading(`Uitgeschreven`)}
    ${bodyText(`Je ontvangt geen nieuwsbrieven meer van ${schoolName}. Bedankt voor het zeilen met ons!`)}
    ${mutedText('Je kunt je altijd opnieuw inschrijven via de website van de school.')}
  `
  return wrap(content)
}
