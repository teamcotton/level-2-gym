import { describe, expect,it } from 'vitest'

import { LoginSchema, RegisterSchema } from '../../src/schemas/auth.js'

describe('Auth Schemas', () => {
  describe('LoginSchema', () => {
    it('should validate valid login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      }

      const result = LoginSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'password123',
      }

      const result = LoginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      }

      const result = LoginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty email', () => {
      const invalidData = {
        email: '',
        password: 'password123',
      }

      const result = LoginSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('RegisterSchema', () => {
    it('should validate valid registration data', () => {
      const validData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password12345',
        confirmPassword: 'password12345',
      }

      const result = RegisterSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid',
        name: 'John Doe',
        password: 'password12345',
        confirmPassword: 'password12345',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject password too short', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'short',
        confirmPassword: 'short',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject mismatched passwords', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'John Doe',
        password: 'password12345',
        confirmPassword: 'different12345',
      }

      const result = RegisterSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes('confirmPassword'))).toBe(
          true
        )
      }
    })
  })
})
