import * as bcrypt from 'bcrypt'
import { describe, expect, it } from 'vitest'

import { Password } from '../../../src/domain/value-objects/password.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('Password', () => {
  describe('create', () => {
    it('should create a password from plain text', async () => {
      const password = await Password.create('mySecurePassword123')
      expect(password).toBeInstanceOf(Password)
    })

    it('should hash the password using bcrypt', async () => {
      const plainPassword = 'mySecurePassword123'
      const password = await Password.create(plainPassword)
      const hash = password.getHash()

      expect(hash).not.toBe(plainPassword)
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/) // bcrypt hash format
    })

    it('should create different hashes for the same password due to salting', async () => {
      const plainPassword = 'mySecurePassword123'
      const password1 = await Password.create(plainPassword)
      const password2 = await Password.create(plainPassword)

      expect(password1.getHash()).not.toBe(password2.getHash())
    })

    it('should throw ValidationException for password less than 8 characters', async () => {
      await expect(Password.create('short')).rejects.toThrow(ValidationException)
      await expect(Password.create('short')).rejects.toThrow(
        'Password must be at least 8 characters'
      )
    })

    it('should throw ValidationException for 7 character password', async () => {
      await expect(Password.create('1234567')).rejects.toThrow(ValidationException)
    })

    it('should accept exactly 8 character password', async () => {
      const password = await Password.create('12345678')
      expect(password).toBeInstanceOf(Password)
    })

    it('should accept long passwords', async () => {
      const longPassword = 'a'.repeat(100)
      const password = await Password.create(longPassword)
      expect(password).toBeInstanceOf(Password)
    })

    it('should accept passwords with special characters', async () => {
      const password = await Password.create('P@ssw0rd!#$%')
      expect(password).toBeInstanceOf(Password)
    })

    it('should accept passwords with spaces', async () => {
      const password = await Password.create('my password 123')
      expect(password).toBeInstanceOf(Password)
    })

    it('should accept passwords with unicode characters', async () => {
      const password = await Password.create('pässwörd123')
      expect(password).toBeInstanceOf(Password)
    })

    it('should throw ValidationException for empty string', async () => {
      await expect(Password.create('')).rejects.toThrow(ValidationException)
    })
  })

  describe('fromHash', () => {
    it('should create a password from a valid bcrypt hash', () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      const password = Password.fromHash(hash)
      expect(password).toBeInstanceOf(Password)
    })

    it('should return the same hash that was provided', () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      const password = Password.fromHash(hash)
      expect(password.getHash()).toBe(hash)
    })

    it('should accept $2a$ bcrypt hash format', () => {
      const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      const password = Password.fromHash(hash)
      expect(password.getHash()).toBe(hash)
    })

    it('should accept $2y$ bcrypt hash format', () => {
      const hash = '$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      const password = Password.fromHash(hash)
      expect(password.getHash()).toBe(hash)
    })

    it('should throw ValidationException for invalid hash format', () => {
      const invalidHash = 'not-a-real-hash'
      expect(() => Password.fromHash(invalidHash)).toThrow(ValidationException)
      expect(() => Password.fromHash(invalidHash)).toThrow(
        'Invalid bcrypt hash provided to Password.fromHash'
      )
    })

    it('should throw ValidationException for empty string', () => {
      expect(() => Password.fromHash('')).toThrow(ValidationException)
      expect(() => Password.fromHash('')).toThrow(
        'Invalid bcrypt hash provided to Password.fromHash'
      )
    })

    it('should throw ValidationException for hash with wrong length', () => {
      const shortHash = '$2b$10$tooshort'
      expect(() => Password.fromHash(shortHash)).toThrow(ValidationException)
    })

    it('should throw ValidationException for hash with wrong prefix', () => {
      const wrongPrefix = '$3b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      expect(() => Password.fromHash(wrongPrefix)).toThrow(ValidationException)
    })

    it('should throw ValidationException for hash with invalid characters', () => {
      const invalidChars = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh@#'
      expect(() => Password.fromHash(invalidChars)).toThrow(ValidationException)
    })
  })

  describe('matches', () => {
    it('should return true for matching password', async () => {
      const plainPassword = 'mySecurePassword123'
      const password = await Password.create(plainPassword)
      const matches = await password.matches(plainPassword)
      expect(matches).toBe(true)
    })

    it('should return false for non-matching password', async () => {
      const password = await Password.create('mySecurePassword123')
      const matches = await password.matches('wrongPassword')
      expect(matches).toBe(false)
    })

    it('should be case-sensitive', async () => {
      const password = await Password.create('MyPassword123')
      const matches = await password.matches('mypassword123')
      expect(matches).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const plainPassword = 'P@ssw0rd!#$%^&*()'
      const password = await Password.create(plainPassword)
      expect(await password.matches(plainPassword)).toBe(true)
      expect(await password.matches('P@ssw0rd!#$%^&*(')).toBe(false)
    })

    it('should handle unicode characters correctly', async () => {
      const plainPassword = 'pässwörd123'
      const password = await Password.create(plainPassword)
      expect(await password.matches(plainPassword)).toBe(true)
      expect(await password.matches('password123')).toBe(false)
    })

    it('should handle passwords with spaces', async () => {
      const plainPassword = 'my password 123'
      const password = await Password.create(plainPassword)
      expect(await password.matches(plainPassword)).toBe(true)
      expect(await password.matches('mypassword123')).toBe(false)
    })

    it('should work with password reconstructed from hash', async () => {
      const plainPassword = 'testPassword123'
      const original = await Password.create(plainPassword)
      const hash = original.getHash()

      const reconstructed = Password.fromHash(hash)
      expect(await reconstructed.matches(plainPassword)).toBe(true)
      expect(await reconstructed.matches('wrongPassword')).toBe(false)
    })

    it('should return false for empty string when password is set', async () => {
      const password = await Password.create('myPassword123')
      expect(await password.matches('')).toBe(false)
    })
  })

  describe('getHash', () => {
    it('should return the bcrypt hash', async () => {
      const password = await Password.create('myPassword123')
      const hash = password.getHash()
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should return a valid bcrypt hash that can be verified', async () => {
      const plainPassword = 'testPassword123'
      const password = await Password.create(plainPassword)
      const hash = password.getHash()

      const isValid = await bcrypt.compare(plainPassword, hash)
      expect(isValid).toBe(true)
    })

    it('should return consistent hash from same Password instance', async () => {
      const password = await Password.create('myPassword123')
      const hash1 = password.getHash()
      const hash2 = password.getHash()
      expect(hash1).toBe(hash2)
    })

    it('should return the exact hash provided to fromHash', () => {
      const originalHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
      const password = Password.fromHash(originalHash)
      expect(password.getHash()).toBe(originalHash)
    })
  })

  describe('immutability', () => {
    it('should not allow modification of hash after creation', async () => {
      const password = await Password.create('myPassword123')
      const hash = password.getHash()

      // Attempting to modify the returned hash should not affect the internal state
      const modifiedHash = hash + 'tampered'
      expect(password.getHash()).toBe(hash)
      expect(password.getHash()).not.toBe(modifiedHash)
    })

    it('should maintain hash integrity after multiple matches calls', async () => {
      const password = await Password.create('myPassword123')
      const originalHash = password.getHash()

      await password.matches('myPassword123')
      await password.matches('wrongPassword')
      await password.matches('anotherWrong')

      expect(password.getHash()).toBe(originalHash)
    })
  })

  describe('type safety', () => {
    it('should work with string literal types', async () => {
      const password = await Password.create('myPassword123' as const)
      expect(password).toBeInstanceOf(Password)
    })

    it('should work with generic string types', async () => {
      const passwordString: string = 'myPassword123'
      const password = await Password.create(passwordString)
      expect(password).toBeInstanceOf(Password)
    })

    it('should work with fromHash using string literal types', () => {
      const hash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' as const
      const password = Password.fromHash(hash)
      expect(password).toBeInstanceOf(Password)
    })
  })

  describe('edge cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000)
      const password = await Password.create(longPassword)
      expect(await password.matches(longPassword)).toBe(true)
    })

    it('should handle password with only numbers', async () => {
      const password = await Password.create('12345678')
      expect(await password.matches('12345678')).toBe(true)
    })

    it('should handle password with only special characters', async () => {
      const password = await Password.create('!@#$%^&*()')
      expect(await password.matches('!@#$%^&*()')).toBe(true)
    })

    it('should handle password with newlines and tabs', async () => {
      const password = await Password.create('pass\nword\t123')
      expect(await password.matches('pass\nword\t123')).toBe(true)
    })

    it('should handle multiple password instances independently', async () => {
      const password1 = await Password.create('password1-test')
      const password2 = await Password.create('password2-test')

      expect(await password1.matches('password1-test')).toBe(true)
      expect(await password2.matches('password2-test')).toBe(true)
      expect(await password1.matches('password2-test')).toBe(false)
      expect(await password2.matches('password1-test')).toBe(false)
    })
  })

  describe('bcrypt integration', () => {
    it('should use bcrypt with 10 salt rounds', async () => {
      const password = await Password.create('testPassword123')
      const hash = password.getHash()

      // Bcrypt hash format: $2b$10$... where 10 is the cost factor
      expect(hash).toMatch(/^\$2[aby]\$10\$/)
    })

    it('should produce hash of correct length', async () => {
      const password = await Password.create('testPassword123')
      const hash = password.getHash()

      // Bcrypt hashes are always 60 characters
      expect(hash).toHaveLength(60)
    })

    it('should use bcrypt version 2b', async () => {
      const password = await Password.create('testPassword123')
      const hash = password.getHash()

      // Modern bcrypt uses $2b$ prefix
      expect(hash).toMatch(/^\$2b\$/)
    })
  })
})
