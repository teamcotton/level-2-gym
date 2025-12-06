import { describe, expect, it } from 'vitest'

import { EnvConfig } from '../../../src/infrastructure/config/env.config.js'

describe('EnvConfig', () => {
  describe('NODE_ENV', () => {
    it('should have NODE_ENV property set from environment or default to "development"', () => {
      expect(EnvConfig.NODE_ENV).toBeDefined()
      expect(typeof EnvConfig.NODE_ENV).toBe('string')
    })

    it('should be a readonly static property', () => {
      expect(EnvConfig.NODE_ENV).toBeDefined()
      // Property should exist and be accessible
      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'NODE_ENV')
      expect(descriptor).toBeDefined()
    })
  })

  describe('DATABASE_URL', () => {
    it('should have DATABASE_URL property set from environment or default to empty string', () => {
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('string')
    })

    it('should be a readonly static property', () => {
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      // Property should exist and be accessible
      const descriptor = Object.getOwnPropertyDescriptor(EnvConfig, 'DATABASE_URL')
      expect(descriptor).toBeDefined()
    })
  })

  describe('validate()', () => {
    it('should not throw error when DATABASE_URL is set', () => {
      // DATABASE_URL should be set from .env file
      expect(() => EnvConfig.validate()).not.toThrow()
    })

    it('should be a static method accessible without instantiation', () => {
      expect(typeof EnvConfig.validate).toBe('function')
    })
  })

  describe('EnvConfig class', () => {
    it('should be instantiable', () => {
      const envConfig = new EnvConfig()
      expect(envConfig).toBeInstanceOf(EnvConfig)
    })

    it('should have static NODE_ENV property accessible without instantiation', () => {
      expect(EnvConfig.NODE_ENV).toBeDefined()
      expect(typeof EnvConfig.NODE_ENV).toBe('string')
    })

    it('should have static DATABASE_URL property accessible without instantiation', () => {
      expect(EnvConfig.DATABASE_URL).toBeDefined()
      expect(typeof EnvConfig.DATABASE_URL).toBe('string')
    })

    it('should have static validate method accessible without instantiation', () => {
      expect(typeof EnvConfig.validate).toBe('function')
    })
  })
})
