import 'fastify'
import type { JwtUserClaims } from './index.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtUserClaims
  }
}
