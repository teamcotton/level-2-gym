import type { TokenGeneratorPort } from '../../../application/ports/token-generator.port.js'
import type { JwtUserClaims } from '../../../shared/types/index.js'
import { JwtUtil } from '../../../infrastructure/security/jwt.util.js'

/**
 * JWT implementation of the TokenGeneratorPort interface
 *
 * Adapts the JwtUtil static methods to the TokenGeneratorPort interface,
 * enabling dependency injection and easier testing in use cases.
 *
 * @remarks
 * This adapter implements the Hexagonal Architecture pattern by:
 * - Implementing a port defined in the application layer
 * - Delegating to infrastructure code (JwtUtil)
 * - Allowing use cases to depend on abstractions, not concrete implementations
 */
export class JwtTokenGeneratorService implements TokenGeneratorPort {
  /**
   * Generates a JWT token from user claims
   *
   * @param claims - User identity and authorization information
   * @returns Signed JWT token string
   */
  generateToken(claims: JwtUserClaims): string {
    return JwtUtil.generateToken(claims)
  }
}
