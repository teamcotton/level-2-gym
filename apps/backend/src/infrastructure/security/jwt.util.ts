import jwt, { type SignOptions } from 'jsonwebtoken'
import { EnvConfig } from '../config/env.config.js'
import { isString, isNullOrUndefined } from '../../shared/guards/type.guards.js'
import type { JwtUserClaims } from '../../shared/types/index.js'
import { UnauthorizedException } from '../../shared/exceptions/unauthorized.exception.js'
import { ErrorCode } from '../../shared/constants/error-codes.js'

/**
 * Utility class for JSON Web Token (JWT) operations
 *
 * Provides static methods for generating, verifying, and decoding JWTs used for
 * authentication and authorization. Handles token lifecycle including signing,
 * validation, expiration, and claim extraction with comprehensive error handling.
 *
 * @remarks
 * **Configuration:**
 * - Uses environment variables via EnvConfig for JWT secret and settings
 * - Secret key: `JWT_SECRET` (must be cryptographically secure)
 * - Expiration: `JWT_EXPIRATION` (in seconds)
 * - Issuer: `JWT_ISSUER` (identifies token issuer)
 *
 * **Security Features:**
 * - HMAC SHA-256 signing algorithm (HS256)
 * - Automatic token expiration validation
 * - Issuer verification to prevent token reuse across systems
 * - Subject claim separation to prevent injection attacks
 * - Comprehensive error categorization for security monitoring
 *
 * **Token Structure:**
 * - Header: Algorithm (HS256) and token type (JWT)
 * - Payload: User claims (sub, email, roles) + metadata (iss, exp, iat)
 * - Signature: HMAC-SHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
 *
 * @example
 * ```typescript
 * // Generate token
 * const claims: JwtUserClaims = {
 *   sub: 'user-123',
 *   email: 'user@example.com',
 *   roles: ['user', 'admin']
 * }
 * const token = JwtUtil.generateToken(claims)
 *
 * // Verify token
 * try {
 *   const user = JwtUtil.verifyToken(token)
 *   console.log(user.sub, user.email, user.roles)
 * } catch (error) {
 *   // Handle authentication errors
 * }
 *
 * // Decode without verification (for debugging)
 * const decoded = JwtUtil.decodeToken(token)
 * ```
 *
 * @see {@link https://datatracker.ietf.org/doc/html/rfc7519|RFC 7519 - JWT Specification}
 * @see {@link EnvConfig} for configuration details
 */
export class JwtUtil {
  /**
   * Generates a signed JWT token from user claims
   *
   * Creates a new JWT with the provided claims, automatically adding metadata
   * (issuer, expiration, issued-at time) and signing with the configured secret.
   * The subject (sub) claim is extracted and placed in the JWT options rather than
   * the payload to prevent duplication and potential security issues.
   *
   * @param claims - User identity and authorization claims
   * @param claims.sub - Subject identifier (user ID) - will be set in JWT options
   * @param claims.email - User's email address
   * @param claims.roles - Optional array of user roles for authorization
   * @returns Signed JWT token as a Base64URL-encoded string (format: header.payload.signature)
   *
   * @example
   * ```typescript
   * const token = JwtUtil.generateToken({
   *   sub: 'user-123',
   *   email: 'alice@example.com',
   *   roles: ['user', 'editor']
   * })
   * // Returns: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * ```
   *
   * @remarks
   * **Automatic Claims:**
   * - `iss`: Issuer from `JWT_ISSUER` env var
   * - `exp`: Expiration time (current time + `JWT_EXPIRATION` seconds)
   * - `iat`: Issued-at time (current Unix timestamp)
   * - `sub`: Subject from claims.sub (passed in options, not payload)
   *
   * **Security Notes:**
   * - Token expiration is enforced during verification
   * - Secret key must be at least 256 bits for HS256 security
   * - Subject claim is intentionally separated to prevent payload manipulation
   */
  static generateToken(claims: JwtUserClaims): string {
    const { sub, ...restClaims } = claims
    const options: SignOptions = {
      expiresIn: Number.parseInt(EnvConfig.JWT_EXPIRATION),
      issuer: EnvConfig.JWT_ISSUER,
      subject: sub,
    }

    return jwt.sign(restClaims, EnvConfig.JWT_SECRET as string, options)
  }

  /**
   * Verifies and decodes a JWT token, extracting user claims
   *
   * Validates the token's cryptographic signature, expiration, and issuer claim,
   * then extracts and returns the user identity claims. Throws typed exceptions
   * for different failure scenarios to enable appropriate error handling.
   *
   * @param token - JWT token string to verify (format: header.payload.signature)
   * @returns Verified user claims object containing sub, email, and optional roles
   * @throws {UnauthorizedException} When token is invalid, expired, or malformed
   *
   * @example
   * ```typescript
   * try {
   *   const user = JwtUtil.verifyToken(bearerToken)
   *   console.log(`User ${user.email} authenticated`)
   *   if (user.roles?.includes('admin')) {
   *     // Grant admin access
   *   }
   * } catch (error) {
   *   if (error.code === ErrorCode.TOKEN_EXPIRED) {
   *     // Prompt for re-authentication
   *   } else {
   *     // Invalid token - deny access
   *   }
   * }
   * ```
   *
   * @remarks
   * **Validation Checks:**
   * 1. Cryptographic signature verification (HMAC-SHA256)
   * 2. Issuer claim matches `JWT_ISSUER` configuration
   * 3. Token has not expired (exp claim < current time)
   * 4. Token is not being used before its valid time (nbf claim if present)
   * 5. Payload contains required claims (sub, email)
   *
   * **Error Handling:**
   * - `TokenExpiredError`: Token exp claim is in the past → ErrorCode.TOKEN_EXPIRED
   * - `JsonWebTokenError`: Invalid signature or malformed token → ErrorCode.UNAUTHORIZED
   * - `NotBeforeError`: Token used before nbf claim → ErrorCode.UNAUTHORIZED
   * - Missing claims (sub/email): Missing required data → ErrorCode.UNAUTHORIZED
   * - Invalid payload type: Payload is string/null → ErrorCode.UNAUTHORIZED
   *
   * **Security Considerations:**
   * - Constant-time signature verification prevents timing attacks
   * - Issuer validation prevents token reuse from other systems
   * - Required claims validation ensures complete user identity
   * - Original error messages included in exception metadata for debugging
   *
   * @see {@link generateToken} for token creation
   * @see {@link UnauthorizedException} for exception structure
   */
  static verifyToken(token: string): { sub: string; email: string; roles?: string[] } {
    try {
      const decoded = jwt.verify(token, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
      })

      if (isString(decoded) || isNullOrUndefined(decoded)) {
        throw new UnauthorizedException('Invalid token payload', ErrorCode.UNAUTHORIZED)
      }

      const { sub, email, roles } = decoded as Partial<JwtUserClaims>
      if (!sub || !email) {
        throw new UnauthorizedException('Token missing required claims', ErrorCode.UNAUTHORIZED)
      }
      return { sub, email, roles }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }
      // Handle jsonwebtoken library errors
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new UnauthorizedException('Token has expired', ErrorCode.TOKEN_EXPIRED, {
            originalError: error.message,
          })
        }
        if (error.name === 'JsonWebTokenError') {
          throw new UnauthorizedException('Invalid token', ErrorCode.UNAUTHORIZED, {
            originalError: error.message,
          })
        }
        if (error.name === 'NotBeforeError') {
          throw new UnauthorizedException('Token not yet valid', ErrorCode.UNAUTHORIZED, {
            originalError: error.message,
          })
        }
      }
      throw new UnauthorizedException('Token verification failed', ErrorCode.UNAUTHORIZED)
    }
  }

  /**
   * Decodes a JWT token without verification
   *
   * Extracts the payload from a JWT token without validating its signature,
   * expiration, or issuer. Useful for debugging, logging, or inspecting tokens
   * in non-security-critical contexts.
   *
   * @param token - JWT token string to decode
   * @returns Decoded token payload as an unknown type, or null if token is malformed
   *
   * @example
   * ```typescript
   * const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   * const payload = JwtUtil.decodeToken(token)
   * console.log(payload) // { sub: 'user-123', email: 'user@example.com', ... }
   * ```
   *
   * @remarks
   * **⚠️ WARNING - Security Critical:**
   * This method does NOT verify the token's signature, expiration, or authenticity.
   * The returned data cannot be trusted for authentication or authorization decisions.
   *
   * **Use Cases:**
   * - Debugging token contents during development
   * - Logging token metadata (issuer, expiration) for monitoring
   * - Extracting claims for display before verification
   * - Testing and validation of token structure
   *
   * **Do NOT use for:**
   * - Authentication decisions (use `verifyToken` instead)
   * - Authorization checks (use `verifyToken` instead)
   * - Any security-critical operations
   *
   * **Return Value:**
   * - Valid JWT: Returns decoded payload object
   * - Malformed JWT: Returns null
   * - Type safety: Returned as `unknown` - caller must validate structure
   *
   * @see {@link verifyToken} for verified token decoding
   */
  static decodeToken(token: string): unknown {
    return jwt.decode(token)
  }
}
