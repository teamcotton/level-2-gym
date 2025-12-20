import type { JwtUserClaims } from '../../shared/types/index.js'

/**
 * Port interface for token generation operations
 *
 * Defines the contract for generating authentication tokens from user claims.
 * This abstraction allows the application layer to remain independent of specific
 * token implementation details (JWT, OAuth, etc.) and enables easy testing through
 * mock implementations.
 *
 * @remarks
 * This follows the Dependency Inversion Principle by defining the interface in
 * the application layer (high-level) that infrastructure adapters (low-level)
 * must implement. This makes the use case easier to test and more flexible.
 */
export interface TokenGeneratorPort {
  /**
   * Generates an authentication token from user claims
   *
   * @param claims - User identity and authorization information
   * @param claims.sub - Subject identifier (user ID)
   * @param claims.email - User's email address
   * @param claims.roles - Optional array of user roles
   * @returns Signed authentication token string
   *
   * @example
   * ```typescript
   * const token = tokenGenerator.generateToken({
   *   sub: 'user-123',
   *   email: 'user@example.com',
   *   roles: ['user', 'admin']
   * })
   * ```
   */
  generateToken(claims: JwtUserClaims): string
}
