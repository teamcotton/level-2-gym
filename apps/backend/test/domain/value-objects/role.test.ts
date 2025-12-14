import { describe, expect, it } from 'vitest'

import { Role, USER_ROLES } from '../../../src/domain/value-objects/role.js'

describe('Role', () => {
  describe('constructor', () => {
    it('should create a role with valid role value "user"', () => {
      const role = new Role('user')
      expect(role).toBeInstanceOf(Role)
      expect(role.getValue()).toBe('user')
    })

    it('should create a role with valid role value "admin"', () => {
      const role = new Role('admin')
      expect(role).toBeInstanceOf(Role)
      expect(role.getValue()).toBe('admin')
    })

    it('should create a role with valid role value "moderator"', () => {
      const role = new Role('moderator')
      expect(role).toBeInstanceOf(Role)
      expect(role.getValue()).toBe('moderator')
    })

    it('should throw error for invalid role', () => {
      expect(() => new Role('superuser')).toThrow(
        'Invalid role. Must be one of: user, admin, moderator'
      )
    })

    it('should throw error for empty string', () => {
      expect(() => new Role('')).toThrow('Invalid role. Must be one of: user, admin, moderator')
    })

    it('should throw error for role with incorrect case', () => {
      expect(() => new Role('USER')).toThrow('Invalid role. Must be one of: user, admin, moderator')
      expect(() => new Role('Admin')).toThrow('Invalid role. Must be one of: user, admin, moderator')
    })

    it('should throw error for numeric value', () => {
      expect(() => new Role('123' as string)).toThrow(
        'Invalid role. Must be one of: user, admin, moderator'
      )
    })
  })

  describe('getValue()', () => {
    it('should return the role value', () => {
      const role = new Role('user')
      expect(role.getValue()).toBe('user')
    })

    it('should return the correct role for admin', () => {
      const role = new Role('admin')
      expect(role.getValue()).toBe('admin')
    })

    it('should return the correct role for moderator', () => {
      const role = new Role('moderator')
      expect(role.getValue()).toBe('moderator')
    })
  })

  describe('equals()', () => {
    it('should return true for roles with same value', () => {
      const role1 = new Role('user')
      const role2 = new Role('user')
      expect(role1.equals(role2)).toBe(true)
    })

    it('should return false for roles with different values', () => {
      const role1 = new Role('user')
      const role2 = new Role('admin')
      expect(role1.equals(role2)).toBe(false)
    })

    it('should return true when comparing same instance', () => {
      const role = new Role('user')
      expect(role.equals(role)).toBe(true)
    })

    it('should work correctly for moderator role', () => {
      const role1 = new Role('moderator')
      const role2 = new Role('moderator')
      const role3 = new Role('admin')
      expect(role1.equals(role2)).toBe(true)
      expect(role1.equals(role3)).toBe(false)
    })
  })

  describe('isAdmin()', () => {
    it('should return true for admin role', () => {
      const role = new Role('admin')
      expect(role.isAdmin()).toBe(true)
    })

    it('should return false for user role', () => {
      const role = new Role('user')
      expect(role.isAdmin()).toBe(false)
    })

    it('should return false for moderator role', () => {
      const role = new Role('moderator')
      expect(role.isAdmin()).toBe(false)
    })
  })

  describe('isModerator()', () => {
    it('should return true for moderator role', () => {
      const role = new Role('moderator')
      expect(role.isModerator()).toBe(true)
    })

    it('should return true for admin role', () => {
      const role = new Role('admin')
      expect(role.isModerator()).toBe(true)
    })

    it('should return false for user role', () => {
      const role = new Role('user')
      expect(role.isModerator()).toBe(false)
    })
  })

  describe('USER_ROLES constant', () => {
    it('should export valid user roles', () => {
      expect(USER_ROLES).toEqual(['user', 'admin', 'moderator'])
    })

    it('should be a readonly tuple', () => {
      expect(Array.isArray(USER_ROLES)).toBe(true)
      expect(USER_ROLES.length).toBe(3)
    })

    it('should contain all valid role values', () => {
      expect(USER_ROLES).toContain('user')
      expect(USER_ROLES).toContain('admin')
      expect(USER_ROLES).toContain('moderator')
    })
  })

  describe('Edge Cases', () => {
    it('should maintain role value immutability', () => {
      const role = new Role('user')
      const value1 = role.getValue()
      const value2 = role.getValue()
      expect(value1).toBe(value2)
      expect(value1).toBe('user')
    })

    it('should not accept null or undefined', () => {
      expect(() => new Role(null as unknown as string)).toThrow()
      expect(() => new Role(undefined as unknown as string)).toThrow()
    })

    it('should not accept roles with whitespace', () => {
      expect(() => new Role(' user ')).toThrow(
        'Invalid role. Must be one of: user, admin, moderator'
      )
      expect(() => new Role('user ')).toThrow(
        'Invalid role. Must be one of: user, admin, moderator'
      )
    })
  })
})
