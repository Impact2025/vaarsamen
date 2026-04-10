import 'next-auth'
import type { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id:          string
      isAdmin:     boolean
      isOnboarded: boolean
    } & DefaultSession['user']
  }
  interface User {
    isAdmin?: boolean
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    isAdmin?:     boolean
    isOnboarded?: boolean
  }
}
