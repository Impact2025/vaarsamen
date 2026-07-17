'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolInvites, schoolMemberships, users } from '@/lib/db/schema'
import { schoolOnboardingSchema } from '@/lib/validations'
import { sendEmailAsync } from '@/lib/email'
import { nieuweAanmeldingEmail } from '@/emails/templates'
import { getGeldigeUitnodiging } from '@/lib/db/queries/uitnodiging'
import { and, eq, isNull, inArray } from 'drizzle-orm'
import { redirect } from 'next/navigation'

const BASE = process.env.NEXTAUTH_URL ?? 'https://vaarsamen.nl'

export type OnboardingState = { error?: string }

export async function rondOnboardingAf(
  token: string,
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Je bent niet meer ingelogd. Log opnieuw in.' }

  const parsed = schoolOnboardingSchema.safeParse({
    naam:          formData.get('naam'),
    telefoon:      formData.get('telefoon'),
    geboortedatum: formData.get('geboortedatum') || undefined,
    ervaring:      formData.get('ervaring') || undefined,
    noodContact:   formData.get('noodContact'),
    nieuwsbrief:   formData.get('nieuwsbrief') === 'on',
    akkoord:       formData.get('akkoord') === 'on',
  })
  if (!parsed.success) {
    const eerste = parsed.error.issues[0]
    return { error: eerste?.message ?? 'Controleer de ingevulde gegevens' }
  }

  const invite = await getGeldigeUitnodiging(token)
  if (!invite) return { error: 'Deze uitnodiging is niet meer geldig.' }

  // De uitnodiging is persoonlijk: alleen het uitgenodigde adres mag hem inwisselen.
  const [ik] = await db.select({ email: users.email, name: users.name })
    .from(users).where(eq(users.id, session.user.id)).limit(1)
  if (!ik || ik.email.toLowerCase() !== invite.email?.toLowerCase()) {
    return { error: 'Deze uitnodiging hoort bij een ander e-mailadres.' }
  }

  // Naam op het account bijwerken als die nog leeg was
  if (!ik.name) {
    await db.update(users).set({ name: parsed.data.naam }).where(eq(users.id, session.user.id))
  }

  const velden = {
    role:           invite.role,
    status:         'wacht_op_goedkeuring' as const,
    onboardingAt:   new Date(),
    telefoon:       parsed.data.telefoon,
    ervaring:       parsed.data.ervaring ?? null,
    noodContact:    parsed.data.noodContact,
    geboortedatum:  parsed.data.geboortedatum ?? null,
    nieuwsbrief:    parsed.data.nieuwsbrief,
    deletedAt:      null,
  }

  // Eerder verwijderd lid dat opnieuw wordt uitgenodigd: rij hergebruiken,
  // want (school_id, user_id) is uniek.
  const [bestaand] = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, invite.schoolId),
      eq(schoolMemberships.userId, session.user.id),
    ))
    .limit(1)

  if (bestaand) {
    await db.update(schoolMemberships).set({ ...velden, joinedAt: new Date() })
      .where(eq(schoolMemberships.id, bestaand.id))
  } else {
    await db.insert(schoolMemberships).values({
      schoolId: invite.schoolId,
      userId:   session.user.id,
      ...velden,
    })
  }

  await db.update(schoolInvites)
    .set({ acceptedAt: new Date(), usedCount: (invite.usedCount ?? 0) + 1 })
    .where(eq(schoolInvites.id, invite.id))

  // Staff op de hoogte brengen dat er iets te beoordelen valt
  const staff = await db
    .select({ email: users.email })
    .from(schoolMemberships)
    .innerJoin(users, eq(users.id, schoolMemberships.userId))
    .where(and(
      eq(schoolMemberships.schoolId, invite.schoolId),
      inArray(schoolMemberships.role, ['eigenaar', 'instructeur']),
      isNull(schoolMemberships.deletedAt),
    ))
  if (staff.length > 0) {
    sendEmailAsync({
      to:      staff.map(s => s.email),
      subject: `Nieuwe aanmelding bij ${invite.schoolNaam}`,
      html:    nieuweAanmeldingEmail({
        schoolName: invite.schoolNaam,
        ledenNaam:  parsed.data.naam,
        ledenEmail: ik.email,
        url:        `${BASE}/school/${invite.schoolId}/dashboard`,
      }),
    })
  }

  redirect(`/uitnodiging/${token}/bedankt`)
}
