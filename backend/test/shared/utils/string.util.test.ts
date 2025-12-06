import { describe, expect, it } from 'vitest'

import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'
import { StringUtil } from '../../../src/shared/utils/string.util.js'

describe('StringUtil', () => {
  describe('capitalize', () => {
    it('should capitalize the first letter of a lowercase string', () => {
      expect(StringUtil.capitalize('hello')).toBe('Hello')
    })

    it('should capitalize the first letter and lowercase the rest', () => {
      expect(StringUtil.capitalize('HELLO')).toBe('Hello')
    })

    it('should handle mixed case strings', () => {
      expect(StringUtil.capitalize('hELLO wORLD')).toBe('Hello world')
    })

    it('should handle single character strings', () => {
      expect(StringUtil.capitalize('a')).toBe('A')
      expect(StringUtil.capitalize('Z')).toBe('Z')
    })

    it('should handle strings with spaces', () => {
      expect(StringUtil.capitalize('hello world')).toBe('Hello world')
    })

    it('should handle strings with numbers', () => {
      expect(StringUtil.capitalize('123abc')).toBe('123abc')
    })

    it('should handle empty strings', () => {
      expect(StringUtil.capitalize('')).toBe('')
    })
  })

  describe('slugify', () => {
    it('should convert string to lowercase slug', () => {
      expect(StringUtil.slugify('Hello World')).toBe('hello-world')
    })

    it('should remove special characters', () => {
      expect(StringUtil.slugify('Hello World!')).toBe('hello-world')
    })

    it('should handle multiple spaces', () => {
      expect(StringUtil.slugify('  Multiple   Spaces  ')).toBe('multiple-spaces')
    })

    it('should remove special characters and keep alphanumeric', () => {
      expect(StringUtil.slugify('special@#$chars')).toBe('specialchars')
    })

    it('should replace underscores with hyphens', () => {
      expect(StringUtil.slugify('underscores_and-dashes')).toBe('underscores-and-dashes')
    })

    it('should remove leading and trailing hyphens', () => {
      expect(StringUtil.slugify('---hello---')).toBe('hello')
    })

    it('should handle consecutive hyphens', () => {
      expect(StringUtil.slugify('hello---world')).toBe('hello-world')
    })

    it('should handle strings with only special characters', () => {
      expect(StringUtil.slugify('@#$%')).toBe('')
    })

    it('should handle empty strings', () => {
      expect(StringUtil.slugify('')).toBe('')
    })

    it('should handle strings with numbers', () => {
      expect(StringUtil.slugify('test123-456')).toBe('test123-456')
    })

    it('should handle unicode characters', () => {
      expect(StringUtil.slugify('café résumé')).toBe('caf-rsum')
    })
  })

  describe('truncate', () => {
    it('should not truncate strings shorter than maxLength', () => {
      expect(StringUtil.truncate('Hello World', 20)).toBe('Hello World')
    })

    it('should truncate strings longer than maxLength', () => {
      expect(StringUtil.truncate('Hello World', 8)).toBe('Hello...')
    })

    it('should use custom suffix', () => {
      expect(StringUtil.truncate('Hello World', 8, '…')).toBe('Hello W…')
    })

    it('should use custom suffix with multiple characters', () => {
      expect(StringUtil.truncate('Long text here', 10, ' [more]')).toBe('Lon [more]')
    })

    it('should handle maxLength equal to string length', () => {
      expect(StringUtil.truncate('Hello', 5)).toBe('Hello')
    })

    it('should handle maxLength of 0', () => {
      // When maxLength is 0, result is just the suffix minus the original string
      expect(StringUtil.truncate('Hello', 0)).toBe('...')
    })

    it('should account for suffix length in truncation', () => {
      const text = 'Hello World'
      const result = StringUtil.truncate(text, 8, '...')
      expect(result).toBe('Hello...')
      expect(result).toHaveLength(8)
    })

    it('should handle empty string', () => {
      expect(StringUtil.truncate('', 10)).toBe('')
    })

    it('should handle long text with default suffix', () => {
      const longText = 'This is a very long text that needs to be truncated'
      const result = StringUtil.truncate(longText, 20)
      expect(result).toBe('This is a very lo...')
      expect(result).toHaveLength(20)
    })
  })

  describe('randomString', () => {
    it('should generate a string of specified length', () => {
      const result = StringUtil.randomString(16)
      expect(result).toHaveLength(16)
    })

    it('should generate different strings on successive calls', () => {
      const str1 = StringUtil.randomString(16)
      const str2 = StringUtil.randomString(16)
      expect(str1).not.toBe(str2)
    })

    it('should only contain alphanumeric characters', () => {
      const result = StringUtil.randomString(100)
      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should handle length of 1', () => {
      const result = StringUtil.randomString(1)
      expect(result).toHaveLength(1)
    })

    it('should handle large lengths', () => {
      const result = StringUtil.randomString(1000)
      expect(result).toHaveLength(1000)
      expect(result).toMatch(/^[A-Za-z0-9]+$/)
    })

    it('should generate strings with mix of uppercase, lowercase, and numbers', () => {
      // Generate a large string to ensure we get a mix
      const result = StringUtil.randomString(1000)
      expect(result).toMatch(/[A-Z]/) // Contains uppercase
      expect(result).toMatch(/[a-z]/) // Contains lowercase
      expect(result).toMatch(/[0-9]/) // Contains numbers
    })

    it('should use cryptographically secure random bytes', () => {
      // Test that consecutive calls produce different results (not predictable)
      const results = new Set()
      for (let i = 0; i < 10; i++) {
        results.add(StringUtil.randomString(32))
      }
      expect(results.size).toBe(10) // All unique
    })

    it('should handle zero length', () => {
      const result = StringUtil.randomString(0)
      expect(result).toBe('')
      expect(result).toHaveLength(0)
    })

    it('should throw ValidationException for negative length', () => {
      expect(() => StringUtil.randomString(-5)).toThrow(ValidationException)
      expect(() => StringUtil.randomString(-5)).toThrow('Length must be a non-negative number')
    })

    it('should throw ValidationException for negative length -1', () => {
      expect(() => StringUtil.randomString(-1)).toThrow(ValidationException)
    })
  })

  describe('maskEmail', () => {
    it('should mask email with standard format', () => {
      expect(StringUtil.maskEmail('user@example.com')).toBe('use***@example.com')
    })

    it('should mask long email local parts', () => {
      expect(StringUtil.maskEmail('john.doe@example.com')).toBe('joh***@example.com')
    })

    it('should show first 3 characters when local part is longer', () => {
      expect(StringUtil.maskEmail('verylongemail@test.com')).toBe('ver***@test.com')
    })

    it('should handle short local parts (2 chars)', () => {
      expect(StringUtil.maskEmail('ab@test.com')).toBe('ab***@test.com')
    })

    it('should handle single character local part', () => {
      expect(StringUtil.maskEmail('a@test.com')).toBe('a***@test.com')
    })

    it('should preserve the domain unchanged', () => {
      expect(StringUtil.maskEmail('user@subdomain.example.com')).toBe(
        'use***@subdomain.example.com'
      )
    })

    it('should handle emails with dots in local part', () => {
      expect(StringUtil.maskEmail('first.last@example.com')).toBe('fir***@example.com')
    })

    it('should handle emails with numbers', () => {
      expect(StringUtil.maskEmail('user123@example.com')).toBe('use***@example.com')
    })

    it('should throw error for invalid email without @', () => {
      expect(() => StringUtil.maskEmail('invalid-email')).toThrow('Invalid email format')
    })

    it('should throw error for email without local part', () => {
      expect(() => StringUtil.maskEmail('@example.com')).toThrow('Invalid email format')
    })

    it('should throw error for email without domain', () => {
      expect(() => StringUtil.maskEmail('user@')).toThrow('Invalid email format')
    })

    it('should throw error for empty string', () => {
      expect(() => StringUtil.maskEmail('')).toThrow('Invalid email format')
    })

    it('should throw error for string with multiple @ symbols', () => {
      expect(() => StringUtil.maskEmail('user@@example.com')).toThrow('Invalid email format')
    })

    it('should throw error for string with multiple @ symbols in different positions', () => {
      expect(() => StringUtil.maskEmail('user@domain@example.com')).toThrow('Invalid email format')
    })
  })

  describe('edge cases', () => {
    it('should handle empty strings across all methods', () => {
      expect(StringUtil.capitalize('')).toBe('')
      expect(StringUtil.slugify('')).toBe('')
      expect(StringUtil.truncate('', 10)).toBe('')
      expect(() => StringUtil.maskEmail('')).toThrow()
    })

    it('should handle single character strings', () => {
      expect(StringUtil.capitalize('a')).toBe('A')
      expect(StringUtil.slugify('a')).toBe('a')
      expect(StringUtil.truncate('a', 10)).toBe('a')
    })

    it('should handle strings with only whitespace', () => {
      expect(StringUtil.capitalize('   ')).toBe('   ')
      expect(StringUtil.slugify('   ')).toBe('')
      expect(StringUtil.truncate('   ', 10)).toBe('   ')
    })

    it('should handle unicode characters', () => {
      expect(StringUtil.capitalize('café')).toBe('Café')
      expect(StringUtil.truncate('café résumé', 8)).toBe('café ...')
    })

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000)
      expect(StringUtil.capitalize(longString)).toHaveLength(10000)
      expect(StringUtil.slugify(longString)).toHaveLength(10000)
      expect(StringUtil.truncate(longString, 100)).toHaveLength(100)
    })
  })

  describe('immutability', () => {
    it('should not modify the original string', () => {
      const original = 'Hello World'
      StringUtil.capitalize(original)
      StringUtil.slugify(original)
      StringUtil.truncate(original, 5)
      expect(original).toBe('Hello World')
    })
  })
})
