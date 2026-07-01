import { db } from '@/lib/db'
import { users, sailingSchools, schoolMemberships, profiles } from '@/lib/db/schema'

// ─── ZEILSCHOOL DE ZWALUW DEMO ACCOUNTS ───────────────────────────────────────────
export const ZWALUW_SCHOOL_ID = 'aadde400-0000-0000-0000-000000000040'

export const ZWALUW_ACCOUNTS = [
  { id: 'aadde400-0000-0000-0000-000000000001', name: 'Karin Mulder',  email: 'karin@zwaluw.nl',  label: 'Eigenaar',    icon: 'shield_person' },
  { id: 'aadde400-0000-0000-0000-000000000002', name: 'Pieter Jansen', email: 'pieter@zwaluw.nl', label: 'Instructeur', icon: 'person_check' },
  { id: 'aadde400-0000-0000-0000-000000000003', name: 'Sanne de Vries',  email: 'sanne@zwaluw.nl',  label: 'Instructeur', icon: 'person_check' },
  { id: 'aadde400-0000-0000-0000-000000000004', name: 'Milan Bakker',    email: 'milan.demo@zwaluw.nl', label: 'Demo cursist', icon: 'school' },
  { id: 'aadde400-0000-0000-0000-000000000005', name: 'Sophie de Boer',  email: 'sophie.demo@zwaluw.nl', label: 'Demo cursist', icon: 'school' },
] as const

export async function seedZwaluw() {
  // Users aanmaken
  for (const account of ZWALUW_ACCOUNTS) {
    await db
      .insert(users)
      .values({ id: account.id, email: account.email, name: account.name, emailVerified: new Date() })
      .onConflictDoNothing()
  }

  // School aanmaken
  await db
    .insert(sailingSchools)
    .values({
      id: ZWALUW_SCHOOL_ID,
      name: 'Zeilschool De Zwaluw',
      slug: 'zeilschool-de-zwaluw',
      description: 'Demo school voor VaarSamen',
      city: 'Enkhuizen',
      ownerUserId: ZWALUW_ACCOUNTS[0].id,
    })
    .onConflictDoNothing()

  // Owner membership
  await db
    .insert(schoolMemberships)
    .values({ schoolId: ZWALUW_SCHOOL_ID, userId: ZWALUW_ACCOUNTS[0].id, role: 'eigenaar' })
    .onConflictDoNothing()

  // Instructeur memberships
  for (let i = 1; i < 3; i++) {
    await db
      .insert(schoolMemberships)
      .values({ schoolId: ZWALUW_SCHOOL_ID, userId: ZWALUW_ACCOUNTS[i].id, role: 'instructeur' })
      .onConflictDoNothing()
  }

  // Cursist memberships
  for (let i = 3; i < 5; i++) {
    await db
      .insert(schoolMemberships)
      .values({ schoolId: ZWALUW_SCHOOL_ID, userId: ZWALUW_ACCOUNTS[i].id, role: 'cursist' })
      .onConflictDoNothing()
  }

  // Profielen aanmaken (om onboarding te omzeilen)
  for (const account of ZWALUW_ACCOUNTS) {
    await db
      .insert(profiles)
      .values({
        userId: account.id,
        displayName: account.name,
        cwoLevel: 'cwo3',
        sailingRole: 'beide',
        lookingFor: 'alles',
        sailingAreas: ['ijsselmeer', 'friese_meren'],
        isOnboarded: true,
      })
      .onConflictDoNothing()
  }

  return { schoolId: ZWALUW_SCHOOL_ID, accounts: ZWALUW_ACCOUNTS.length }
}
