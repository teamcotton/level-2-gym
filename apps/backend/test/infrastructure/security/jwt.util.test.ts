import jwt from 'jsonwebtoken'
import { uuidv7 } from 'uuidv7'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserId } from '../../../src/domain/value-objects/userID.js'
import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'
import { JwtUtil } from '../../../src/infrastructure/security/jwt.util.js'
import { ErrorCode } from '../../../src/shared/constants/error-codes.js'
import { UnauthorizedException } from '../../../src/shared/exceptions/unauthorized.exception.js'
import type { JwtUserClaims } from '../../../src/shared/types/index.js'

// Helper function to create mock claims with proper UserIdType
function createMockClaims(email: string, roles?: string[], userId?: string): JwtUserClaims {
  return {
    sub: new UserId(userId || uuidv7()).getValue(),
    email,
    roles,
  }
}

describe('JwtUtil', () => {
  const validClaims: JwtUserClaims = createMockClaims('test@example.com', ['user', 'admin'])

  const validClaimsWithoutRoles: JwtUserClaims = createMockClaims('basic@example.com')

  beforeEach(() => {
    // Clear any mocks and restore spies before each test
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  describe('generateToken', () => {
    it('should generate a valid JWT token with all claims', () => {
      const token = JwtUtil.generateToken(validClaims)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })

    it('should generate a valid JWT token without roles', () => {
      const token = JwtUtil.generateToken(validClaimsWithoutRoles)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3)
    })

    it('should include correct claims in the token', () => {
      const token = JwtUtil.generateToken(validClaims)
      const decoded = jwt.decode(token) as unknown as JwtUserClaims & { iss: string; exp: number }

      expect(decoded.sub).toBe(validClaims.sub)
      expect(decoded.email).toBe(validClaims.email)
      expect(decoded.roles).toEqual(validClaims.roles)
    })

    it('should set issuer from EnvConfig', () => {
      const token = JwtUtil.generateToken(validClaims)
      const decoded = jwt.decode(token) as { iss: string }

      expect(decoded.iss).toBe(EnvConfig.JWT_ISSUER)
    })

    it('should set subject from claims.sub', () => {
      const token = JwtUtil.generateToken(validClaims)
      const decoded = jwt.decode(token) as { sub: string }

      expect(decoded.sub).toBe(validClaims.sub)
    })

    it('should set expiration time from EnvConfig', () => {
      const token = JwtUtil.generateToken(validClaims)
      const decoded = jwt.decode(token) as { iat: number; exp: number }

      const expectedExpiration = Number.parseInt(EnvConfig.JWT_EXPIRATION)
      const actualDuration = decoded.exp - decoded.iat

      expect(actualDuration).toBe(expectedExpiration)
    })

    it('should generate different tokens for different claims', () => {
      const token1 = JwtUtil.generateToken(validClaims)
      const token2 = JwtUtil.generateToken(validClaimsWithoutRoles)

      expect(token1).not.toBe(token2)
    })

    it('should use JWT secret from EnvConfig', () => {
      const token = JwtUtil.generateToken(validClaims)

      // Verify the token can be decoded with the secret
      expect(() => jwt.verify(token, EnvConfig.JWT_SECRET as string)).not.toThrow()
    })
  })

  describe('verifyToken', () => {
    let validToken: string

    beforeEach(() => {
      validToken = JwtUtil.generateToken(validClaims)
    })

    it('should verify and return claims from a valid token', () => {
      const result = JwtUtil.verifyToken(validToken)

      expect(result).toEqual({
        sub: validClaims.sub,
        email: validClaims.email,
        roles: validClaims.roles,
      })
    })

    it('should verify token without roles', () => {
      const token = JwtUtil.generateToken(validClaimsWithoutRoles)
      const result = JwtUtil.verifyToken(token)

      expect(result).toEqual({
        sub: validClaimsWithoutRoles.sub,
        email: validClaimsWithoutRoles.email,
        roles: undefined,
      })
    })

    it('should throw UnauthorizedException for invalid token signature', () => {
      const invalidToken = validToken.slice(0, -5) + 'XXXXX'

      expect(() => JwtUtil.verifyToken(invalidToken)).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for token with wrong issuer', () => {
      const tokenWithWrongIssuer = jwt.sign(validClaims, EnvConfig.JWT_SECRET as string, {
        issuer: 'wrong-issuer',
        expiresIn: 3600,
      })

      expect(() => JwtUtil.verifyToken(tokenWithWrongIssuer)).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException with TOKEN_EXPIRED code for expired token', () => {
      const expiredToken = jwt.sign(validClaims, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: -1,
      })

      let caughtError: UnauthorizedException | undefined
      try {
        JwtUtil.verifyToken(expiredToken)
        expect.fail('Should have thrown UnauthorizedException')
      } catch (error) {
        caughtError = error as UnauthorizedException
      }

      expect(caughtError).toBeInstanceOf(UnauthorizedException)
      expect(caughtError?.code).toBe(ErrorCode.TOKEN_EXPIRED)
      expect(caughtError?.message).toBe('Token has expired')
    })

    it('should throw UnauthorizedException for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt'

      expect(() => JwtUtil.verifyToken(malformedToken)).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for token missing sub claim', () => {
      const tokenWithoutSub = jwt.sign(
        { email: 'test@example.com' },
        EnvConfig.JWT_SECRET as string,
        {
          issuer: EnvConfig.JWT_ISSUER,
          expiresIn: 3600,
        }
      )

      expect(() => JwtUtil.verifyToken(tokenWithoutSub)).toThrow('Token missing required claims')
      expect(() => JwtUtil.verifyToken(tokenWithoutSub)).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for token missing email claim', () => {
      const tokenWithoutEmail = jwt.sign({ sub: 'user-123' }, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: 3600,
      })

      expect(() => JwtUtil.verifyToken(tokenWithoutEmail)).toThrow('Token missing required claims')
      expect(() => JwtUtil.verifyToken(tokenWithoutEmail)).toThrow(UnauthorizedException)
    })

    it('should throw UnauthorizedException for null decoded payload', () => {
      // Create a mock token that would result in null when decoded
      // We'll mock jwt.verify to return null to simulate this edge case
      const token = JwtUtil.generateToken(validClaims)
      vi.spyOn(jwt, 'verify').mockReturnValue(null as any)

      expect(() => JwtUtil.verifyToken(token)).toThrow('Invalid token payload')
      expect(() => JwtUtil.verifyToken(token)).toThrow(UnauthorizedException)
    })

    it('should verify token and check issuer from EnvConfig', () => {
      const result = JwtUtil.verifyToken(validToken)

      expect(result.sub).toBe(validClaims.sub)
      expect(result.email).toBe(validClaims.email)
    })

    it('should handle token with extra claims', () => {
      const claimsWithExtra = {
        ...validClaims,
        sub: validClaims.sub, // sub is already a branded string (UserIdType) suitable for jwt.sign
        extraClaim: 'extra-value',
        anotherField: 123,
      }
      const token = jwt.sign(claimsWithExtra, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: 3600,
      })

      const result = JwtUtil.verifyToken(token)

      expect(result.sub).toBe(validClaims.sub)
      expect(result.email).toBe(validClaims.email)
      expect(result.roles).toEqual(validClaims.roles)
    })
  })

  describe('decodeToken', () => {
    let validToken: string

    beforeEach(() => {
      validToken = JwtUtil.generateToken(validClaims)
    })

    it('should decode a valid token without verification', () => {
      const decoded = JwtUtil.decodeToken(validToken)

      expect(decoded).toBeDefined()
      expect(decoded).toMatchObject({
        sub: validClaims.sub,
        email: validClaims.email,
        roles: validClaims.roles,
      })
    })

    it('should decode token without verifying signature', () => {
      const invalidSignatureToken = validToken.slice(0, -5) + 'XXXXX'
      const decoded = JwtUtil.decodeToken(invalidSignatureToken)

      // Should still decode even with invalid signature
      expect(decoded).toBeDefined()
    })

    it('should decode expired token', () => {
      const expiredToken = jwt.sign(validClaims, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: -1,
      })

      const decoded = JwtUtil.decodeToken(expiredToken)

      // Should still decode even if expired
      expect(decoded).toBeDefined()
      expect(decoded).toMatchObject({
        sub: validClaims.sub,
        email: validClaims.email,
      })
    })

    it('should return null for malformed token', () => {
      const malformedToken = 'not.a.valid.jwt'
      const decoded = JwtUtil.decodeToken(malformedToken)

      expect(decoded).toBeNull()
    })

    it('should decode and return all claims', () => {
      const decoded = JwtUtil.decodeToken(validToken) as JwtUserClaims & {
        iss: string
        exp: number
        iat: number
      }

      expect(decoded.sub).toBe(validClaims.sub)
      expect(decoded.email).toBe(validClaims.email)
      expect(decoded.roles).toEqual(validClaims.roles)
      expect(decoded.iss).toBe(EnvConfig.JWT_ISSUER)
      expect(decoded.exp).toBeDefined()
      expect(decoded.iat).toBeDefined()
    })

    it('should decode token created by generateToken', () => {
      const token = JwtUtil.generateToken(validClaimsWithoutRoles)
      const decoded = JwtUtil.decodeToken(token) as JwtUserClaims

      expect(decoded.sub).toBe(validClaimsWithoutRoles.sub)
      expect(decoded.email).toBe(validClaimsWithoutRoles.email)
      expect(decoded.roles).toBeUndefined()
    })

    it('should return complete token payload structure', () => {
      const decoded = JwtUtil.decodeToken(validToken) as Record<string, unknown>

      expect(decoded).toHaveProperty('sub')
      expect(decoded).toHaveProperty('email')
      expect(decoded).toHaveProperty('roles')
      expect(decoded).toHaveProperty('iss')
      expect(decoded).toHaveProperty('exp')
      expect(decoded).toHaveProperty('iat')
    })
  })

  describe('Integration tests', () => {
    it('should generate, verify, and decode token successfully', () => {
      const token = JwtUtil.generateToken(validClaims)
      const verified = JwtUtil.verifyToken(token)
      const decoded = JwtUtil.decodeToken(token) as JwtUserClaims

      expect(verified.sub).toBe(validClaims.sub)
      expect(verified.email).toBe(validClaims.email)
      expect(verified.roles).toEqual(validClaims.roles)

      expect(decoded.sub).toBe(validClaims.sub)
      expect(decoded.email).toBe(validClaims.email)
      expect(decoded.roles).toEqual(validClaims.roles)
    })

    it('should handle complete user authentication flow', () => {
      // Generate token for user login
      const loginToken = JwtUtil.generateToken(validClaims)

      // Verify token on subsequent requests
      const verifiedClaims = JwtUtil.verifyToken(loginToken)
      expect(verifiedClaims.sub).toBe(validClaims.sub)

      // Decode token for debugging/logging (without verification)
      const decodedInfo = JwtUtil.decodeToken(loginToken)
      expect(decodedInfo).toBeDefined()
    })

    it('should differentiate between users with different claims', () => {
      const user1Token = JwtUtil.generateToken(validClaims)
      const user2Token = JwtUtil.generateToken(validClaimsWithoutRoles)

      const user1Verified = JwtUtil.verifyToken(user1Token)
      const user2Verified = JwtUtil.verifyToken(user2Token)

      expect(user1Verified.sub).not.toBe(user2Verified.sub)
      expect(user1Verified.email).not.toBe(user2Verified.email)
      expect(user1Verified.roles).toBeDefined()
      expect(user2Verified.roles).toBeUndefined()
    })
  })

  describe('Security tests', () => {
    it('should not accept token signed with different secret', () => {
      const tokenWithWrongSecret = jwt.sign(validClaims, 'wrong-secret', {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: 3600,
      })

      expect(() => JwtUtil.verifyToken(tokenWithWrongSecret)).toThrow(UnauthorizedException)
    })

    it('should not accept tampered token', () => {
      const validToken = JwtUtil.generateToken(validClaims)
      const [header, signature] = validToken.split('.')

      // Tamper with payload
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: 'hacker', email: 'hack@example.com' })
      ).toString('base64url')
      const tamperedToken = `${header}.${tamperedPayload}.${signature}`

      expect(() => JwtUtil.verifyToken(tamperedToken)).toThrow(UnauthorizedException)
    })

    it('should validate token expiration', () => {
      const shortLivedToken = jwt.sign(validClaims, EnvConfig.JWT_SECRET as string, {
        issuer: EnvConfig.JWT_ISSUER,
        expiresIn: 1,
      })

      // Token should be valid immediately
      expect(() => JwtUtil.verifyToken(shortLivedToken)).not.toThrow()
    })

    it('should require issuer to match', () => {
      const tokenWithoutIssuer = jwt.sign(validClaims, EnvConfig.JWT_SECRET as string, {
        expiresIn: 3600,
      })

      expect(() => JwtUtil.verifyToken(tokenWithoutIssuer)).toThrow(UnauthorizedException)
    })
  })

  describe('Edge cases', () => {
    it('should handle claims with special characters', () => {
      const specialClaims: JwtUserClaims = createMockClaims('test+special@example.com', [
        'admin',
        'super-user',
      ])

      const token = JwtUtil.generateToken(specialClaims)
      const verified = JwtUtil.verifyToken(token)

      expect(verified.sub).toBe(specialClaims.sub)
      expect(verified.email).toBe(specialClaims.email)
    })

    it('should handle empty roles array', () => {
      const claimsWithEmptyRoles: JwtUserClaims = createMockClaims('empty@example.com', [])

      const token = JwtUtil.generateToken(claimsWithEmptyRoles)
      const verified = JwtUtil.verifyToken(token)

      expect(verified.roles).toEqual([])
    })

    it('should handle long email addresses', () => {
      const longEmailClaims: JwtUserClaims = createMockClaims(
        'very.long.email.address.that.exceeds.normal.length@example.com'
      )

      const token = JwtUtil.generateToken(longEmailClaims)
      const verified = JwtUtil.verifyToken(token)

      expect(verified.email).toBe(longEmailClaims.email)
    })

    it('should handle multiple roles', () => {
      const multiRoleClaims: JwtUserClaims = createMockClaims('multi@example.com', [
        'user',
        'admin',
        'moderator',
        'editor',
        'viewer',
      ])

      const token = JwtUtil.generateToken(multiRoleClaims)
      const verified = JwtUtil.verifyToken(token)

      expect(verified.roles).toHaveLength(5)
      expect(verified.roles).toEqual(multiRoleClaims.roles)
    })
  })
})
