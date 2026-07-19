'use server'

import { signOut } from '@/lib/auth'

/**
 * Gedeelde server-action voor uitloggen. Werkt voor ELKE gebruiker
 * (zeiler, instructeur, zeilschool én platform-admin) ongeacht provider.
 * NextAuth ruimt de sessie-cookie op en stuurt door naar de startpagina.
 */
export async function logout() {
  await signOut({ redirectTo: '/' })
}
