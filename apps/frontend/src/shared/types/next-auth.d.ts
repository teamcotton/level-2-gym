import { DefaultSession } from 'next-auth'
import { JWT as DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken: string
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      roles: string[]
    }
  }

  interface User {
    id: string
    email: string
    accessToken: string
    roles: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    accessToken: string
    id: string
    roles: string[]
  }
}
