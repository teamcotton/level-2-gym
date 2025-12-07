import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, it } from 'vitest'

import { TokeniseOpenAI } from '../../../src/infrastructure/ai/tokeniseOpenAI.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const FIXTURES_DIR = path.join(__dirname, 'fixtures')

describe('TokeniseOpenAI', () => {
  describe('Singleton Pattern', () => {
    beforeEach(() => {
      // Reset the singleton instance between tests
      // @ts-expect-error - Accessing private static property for testing
      TokeniseOpenAI.instance = undefined
    })

    it('should return the same instance on multiple calls to getInstance', () => {
      const instance1 = TokeniseOpenAI.getInstance()
      const instance2 = TokeniseOpenAI.getInstance()

      expect(instance1).toBe(instance2)
    })

    it('should create only one instance', () => {
      const instance1 = TokeniseOpenAI.getInstance()
      const instance2 = TokeniseOpenAI.getInstance()
      const instance3 = TokeniseOpenAI.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance2).toBe(instance3)
    })

    it('should have getInstance as a static method', () => {
      expect(typeof TokeniseOpenAI.getInstance).toBe('function')
    })

    it('should have a private constructor (TypeScript compile-time check)', () => {
      // This test documents that the constructor is private
      // TypeScript prevents direct instantiation at compile time
      const instance = TokeniseOpenAI.getInstance()
      expect(instance).toBeDefined()
    })
  })

  describe('tokeniseFile', () => {
    let tokenizer: TokeniseOpenAI

    beforeEach(() => {
      // Reset the singleton instance between tests
      // @ts-expect-error - Accessing private static property for testing
      TokeniseOpenAI.instance = undefined
      tokenizer = TokeniseOpenAI.getInstance()
    })

    it('should tokenize a simple text file', () => {
      const tokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens.every((token) => typeof token === 'number')).toBe(true)
    })

    it('should tokenize an empty file', () => {
      const tokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'empty.txt'))

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBe(0)
    })

    it('should tokenize files with special characters', () => {
      const tokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'special-chars.txt'))

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens.every((token) => typeof token === 'number')).toBe(true)
    })

    it('should return consistent tokens for the same file', () => {
      const tokens1 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))
      const tokens2 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(tokens1).toEqual(tokens2)
    })

    it('should return different tokens for different files', () => {
      const tokens1 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))
      const tokens2 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'special-chars.txt'))

      expect(tokens1).not.toEqual(tokens2)
    })

    it('should validate file path is within base directory when baseDir is provided', () => {
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')
      const tokens = tokenizer.tokeniseFile(filePath, FIXTURES_DIR)

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
    })

    it('should reject file path outside base directory', () => {
      const filePath = path.join(FIXTURES_DIR, 'sample.txt')
      const wrongBaseDir = path.join(__dirname, 'wrong-dir')

      expect(() => tokenizer.tokeniseFile(filePath, wrongBaseDir)).toThrow(
        /outside the allowed base directory/
      )
    })
  })

  describe('tokeniseContent', () => {
    let tokenizer: TokeniseOpenAI

    beforeEach(() => {
      // Reset the singleton instance between tests
      // @ts-expect-error - Accessing private static property for testing
      TokeniseOpenAI.instance = undefined
      tokenizer = TokeniseOpenAI.getInstance()
    })

    it('should tokenize simple text content', () => {
      const content = 'Hello, world!'
      const tokens = tokenizer.tokeniseContent(content)

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
      expect(tokens.every((token) => typeof token === 'number')).toBe(true)
    })

    it('should tokenize empty content', () => {
      const tokens = tokenizer.tokeniseContent('')

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBe(0)
    })

    it('should tokenize content with special characters', () => {
      const content = 'Special characters: 特殊文字 émojis 🎉'
      const tokens = tokenizer.tokeniseContent(content)

      expect(Array.isArray(tokens)).toBe(true)
      expect(tokens.length).toBeGreaterThan(0)
    })

    it('should return consistent tokens for the same content', () => {
      const content = 'Test content'
      const tokens1 = tokenizer.tokeniseContent(content)
      const tokens2 = tokenizer.tokeniseContent(content)

      expect(tokens1).toEqual(tokens2)
    })

    it('should return different tokens for different content', () => {
      const tokens1 = tokenizer.tokeniseContent('Hello')
      const tokens2 = tokenizer.tokeniseContent('World')

      expect(tokens1).not.toEqual(tokens2)
    })
  })

  describe('Error Handling', () => {
    let tokenizer: TokeniseOpenAI

    beforeEach(() => {
      // Reset the singleton instance between tests
      // @ts-expect-error - Accessing private static property for testing
      TokeniseOpenAI.instance = undefined
      tokenizer = TokeniseOpenAI.getInstance()
    })

    it('should throw an error for non-existent files', () => {
      const nonExistentPath = path.join(FIXTURES_DIR, 'non-existent-file.txt')
      expect(() => tokenizer.tokeniseFile(nonExistentPath)).toThrow(/Failed to read file/)
    })

    it('should include the file path in the error message', () => {
      const nonExistentPath = path.join(FIXTURES_DIR, 'non-existent-file.txt')
      expect(() => tokenizer.tokeniseFile(nonExistentPath)).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('Failed to read file'),
        })
      )
      expect(() => tokenizer.tokeniseFile(nonExistentPath)).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('non-existent-file.txt'),
        })
      )
    })
  })

  describe('Integration', () => {
    it('should work with the same tokenizer instance across multiple calls', () => {
      const instance1 = TokeniseOpenAI.getInstance()
      const instance2 = TokeniseOpenAI.getInstance()

      const tokens1 = instance1.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))
      const tokens2 = instance2.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(tokens1).toEqual(tokens2)
      expect(instance1).toBe(instance2)
    })

    it('should handle multiple file tokenizations in sequence', () => {
      const tokenizer = TokeniseOpenAI.getInstance()

      const tokens1 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))
      const tokens2 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'empty.txt'))
      const tokens3 = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'special-chars.txt'))

      expect(tokens1.length).toBeGreaterThan(0)
      expect(tokens2.length).toBe(0)
      expect(tokens3.length).toBeGreaterThan(0)
    })

    it('should handle both file and content tokenization', () => {
      const tokenizer = TokeniseOpenAI.getInstance()

      const fileTokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))
      const contentTokens = tokenizer.tokeniseContent(
        'Hello, this is a test file for tokenization.'
      )

      // Both should produce the same tokens for the same content
      expect(fileTokens).toEqual(contentTokens)
    })
  })

  describe('Token Properties', () => {
    let tokenizer: TokeniseOpenAI

    beforeEach(() => {
      // Reset the singleton instance between tests
      // @ts-expect-error - Accessing private static property for testing
      TokeniseOpenAI.instance = undefined
      tokenizer = TokeniseOpenAI.getInstance()
    })

    it('should return an array of numbers', () => {
      const tokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))

      expect(Array.isArray(tokens)).toBe(true)
      tokens.forEach((token) => {
        expect(typeof token).toBe('number')
        expect(Number.isInteger(token)).toBe(true)
      })
    })

    it('should return positive token IDs', () => {
      const tokens = tokenizer.tokeniseFile(path.join(FIXTURES_DIR, 'sample.txt'))

      tokens.forEach((token) => {
        expect(token).toBeGreaterThanOrEqual(0)
      })
    })
  })
})
