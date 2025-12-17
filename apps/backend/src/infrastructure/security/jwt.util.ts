import jwt, { type SignOptions } from 'jsonwebtoken'
import { EnvConfig } from '../config/env.config.js'
import { isString, isNullOrUndefined } from '../../shared/guards/type.guards.js'
import type { JwtUserClaims } from '../../shared/types/index.js'
import { UnauthorizedException } from '../../shared/exceptions/unauthorized.exception.js'
import { ErrorCode } from '../../shared/constants/error-codes.js'

export class JwtUtil {
  static generateToken(claims: JwtUserClaims): string {
    const { sub, ...restClaims } = claims
    const options: SignOptions = {
      expiresIn: Number.parseInt(EnvConfig.JWT_EXPIRATION),
      issuer: EnvConfig.JWT_ISSUER,
      subject: sub,
    }

    return jwt.sign(restClaims, EnvConfig.JWT_SECRET as string, options)
  }

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

  static decodeToken(token: string): unknown {
    return jwt.decode(token)
  }
}
