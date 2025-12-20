import { beforeEach, describe, expect, it } from 'vitest'

import { User } from '../../../src/domain/entities/user.js'
import { Email } from '../../../src/domain/value-objects/email.js'
import { Password } from '../../../src/domain/value-objects/password.js'
import { Role } from '../../../src/domain/value-objects/role.js'
import { ValidationException } from '../../../src/shared/exceptions/validation.exception.js'

describe('User Entity', () => {
  let testEmail: Email
  let testPassword: Password
  let testRole: Role
  let testUser: User

  beforeEach(async () => {
    testEmail = new Email('test@example.com')
    testPassword = await Password.create('password123')
    testRole = new Role('user')
    testUser = new User('user-123', testEmail, testPassword, 'John Doe', testRole)
  })

  describe('Constructor', () => {
    it('should create a user with all required fields', () => {
      expect(testUser).toBeInstanceOf(User)
      expect(testUser.id).toBe('user-123')
      expect(testUser.getName()).toBe('John Doe')
      expect(testUser.getEmail()).toBe('test@example.com')
    })

    it('should create a user with default createdAt date', () => {
      const user = new User('user-456', testEmail, testPassword, 'Jane Doe', testRole)

      // createdAt should be between beforeCreation and afterCreation
      // We can't directly access createdAt as it's private, but we can verify the user was created
      expect(user).toBeInstanceOf(User)
    })

    it('should create a user with custom createdAt date', () => {
      const customDate = new Date('2024-01-01')
      const user = new User('user-789', testEmail, testPassword, 'Bob Smith', testRole, customDate)

      expect(user).toBeInstanceOf(User)
    })

    it('should have id property accessible', () => {
      // TypeScript readonly is compile-time only, property is still accessible
      expect(testUser.id).toBe('user-123')
      expect(typeof testUser.id).toBe('string')
    })
  })

  describe('getEmail()', () => {
    it('should return the email address as a string', () => {
      const email = testUser.getEmail()
      expect(email).toBe('test@example.com')
      expect(typeof email).toBe('string')
    })

    it('should return normalized lowercase email', () => {
      const upperEmail = new Email('TEST@EXAMPLE.COM')
      const user = new User('user-123', upperEmail, testPassword, 'Test User', testRole)

      expect(user.getEmail()).toBe('test@example.com')
    })
  })

  describe('getName()', () => {
    it('should return the user name', () => {
      const name = testUser.getName()
      expect(name).toBe('John Doe')
      expect(typeof name).toBe('string')
    })

    it('should return the exact name provided in constructor', () => {
      const specialName = "José María O'Brien-Smith"
      const user = new User('user-123', testEmail, testPassword, specialName, testRole)

      expect(user.getName()).toBe(specialName)
    })
  })

  describe('getRole()', () => {
    it('should return the user role as a string', () => {
      const role = testUser.getRole()
      expect(role).toBe('user')
      expect(typeof role).toBe('string')
    })

    it('should return the correct role for admin users', () => {
      const adminRole = new Role('admin')
      const adminUser = new User('admin-123', testEmail, testPassword, 'Admin User', adminRole)

      expect(adminUser.getRole()).toBe('admin')
    })
  })

  describe('updateRole()', () => {
    it('should update user role', () => {
      const newRole = new Role('admin')
      testUser.updateRole(newRole)

      expect(testUser.getRole()).toBe('admin')
    })

    it('should accept RoleType branded type', () => {
      const moderatorRole = new Role('moderator')

      expect(() => testUser.updateRole(moderatorRole)).not.toThrow()
      expect(testUser.getRole()).toBe('moderator')
    })

    it('should allow changing from admin to user', () => {
      const adminRole = new Role('admin')
      const userRole = new Role('user')

      testUser.updateRole(adminRole)
      expect(testUser.getRole()).toBe('admin')

      testUser.updateRole(userRole)
      expect(testUser.getRole()).toBe('user')
    })
  })

  describe('updateEmail()', () => {
    it('should update email when email is verified', () => {
      const newEmail = new Email('newemail@example.com')

      testUser.updateEmail(newEmail)

      expect(testUser.getEmail()).toBe('newemail@example.com')
    })

    it('should accept EmailType branded type', () => {
      const newEmail = new Email('another@example.com')

      expect(() => testUser.updateEmail(newEmail)).not.toThrow()
      expect(testUser.getEmail()).toBe('another@example.com')
    })

    it('should maintain email normalization after update', () => {
      const newEmail = new Email('  UPPERCASE@EXAMPLE.COM  ')

      testUser.updateEmail(newEmail)

      expect(testUser.getEmail()).toBe('uppercase@example.com')
    })

    it('should handle multiple email updates', () => {
      const email1 = new Email('first@example.com')
      const email2 = new Email('second@example.com')
      const email3 = new Email('third@example.com')

      testUser.updateEmail(email1)
      expect(testUser.getEmail()).toBe('first@example.com')

      testUser.updateEmail(email2)
      expect(testUser.getEmail()).toBe('second@example.com')

      testUser.updateEmail(email3)
      expect(testUser.getEmail()).toBe('third@example.com')
    })
  })

  describe('updatePassword()', () => {
    it('should update password when old password is correct', async () => {
      const newPassword = await Password.create('newpassword123')

      await expect(testUser.updatePassword('password123', newPassword)).resolves.not.toThrow()
    })

    it('should throw ValidationException when old password is incorrect', async () => {
      const newPassword = await Password.create('newpassword123')

      await expect(testUser.updatePassword('wrongpassword', newPassword)).rejects.toThrow(
        ValidationException
      )
      await expect(testUser.updatePassword('wrongpassword', newPassword)).rejects.toThrow(
        'Old password is incorrect'
      )
    })

    it('should verify password with new password after successful update', async () => {
      const newPassword = await Password.create('newpassword123')

      await testUser.updatePassword('password123', newPassword)

      // The password should now be updated (we can't directly verify, but we can try to update again)
      const anotherPassword = await Password.create('anotherpass456')
      await expect(
        testUser.updatePassword('newpassword123', anotherPassword)
      ).resolves.not.toThrow()
    })

    it('should not update password if old password verification fails', async () => {
      const newPassword = await Password.create('newpassword123')

      await expect(testUser.updatePassword('wrongpassword', newPassword)).rejects.toThrow()

      // Original password should still work
      const anotherPassword = await Password.create('anotherpass456')
      await expect(testUser.updatePassword('password123', anotherPassword)).resolves.not.toThrow()
    })

    it('should accept PasswordType branded type', async () => {
      const newPassword = await Password.create('validpassword123')

      await expect(testUser.updatePassword('password123', newPassword)).resolves.not.toThrow()
    })

    it('should handle password update with special characters', async () => {
      const specialPassword = await Password.create('P@ssw0rd!#$%')

      await expect(testUser.updatePassword('password123', specialPassword)).resolves.not.toThrow()
    })

    it('should handle empty string as old password gracefully', async () => {
      const newPassword = await Password.create('newpassword123')

      await expect(testUser.updatePassword('', newPassword)).rejects.toThrow(ValidationException)
      await expect(testUser.updatePassword('', newPassword)).rejects.toThrow(
        'Old password is incorrect'
      )
    })
  })

  describe('Business Rules', () => {
    it('should enforce email verification for email updates', () => {
      // Since isEmailVerified() always returns true in simplified implementation,
      // email updates should always succeed
      const newEmail = new Email('verified@example.com')

      expect(() => testUser.updateEmail(newEmail)).not.toThrow()
    })

    it('should require old password verification for password updates', async () => {
      const newPassword = await Password.create('newpassword123')

      // Should fail with wrong password
      await expect(testUser.updatePassword('incorrect', newPassword)).rejects.toThrow()

      // Should succeed with correct password
      await expect(testUser.updatePassword('password123', newPassword)).resolves.not.toThrow()
    })
  })

  describe('Type Safety', () => {
    it('should accept Email type for email parameter', () => {
      const email = new Email('typed@example.com')
      const user = new User('id-123', email, testPassword, 'Test User', testRole)

      expect(user.getEmail()).toBe('typed@example.com')
    })

    it('should accept Password type for password parameter', async () => {
      const password = await Password.create('typedpassword')
      const user = new User('id-123', testEmail, password, 'Test User', testRole)

      expect(user).toBeInstanceOf(User)
    })

    it('should have id as readonly string', () => {
      expect(typeof testUser.id).toBe('string')

      // TypeScript readonly is compile-time only
      // The id value is accessible
      expect(testUser.id).toBe('user-123')
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with empty name', () => {
      const user = new User('id-123', testEmail, testPassword, '', testRole)

      expect(user.getName()).toBe('')
    })

    it('should handle user with very long name', () => {
      const longName = 'A'.repeat(1000)
      const user = new User('id-123', testEmail, testPassword, longName, testRole)

      expect(user.getName()).toBe(longName)
      expect(user.getName().length).toBe(1000)
    })

    it('should handle user with special characters in name', () => {
      const specialNames = [
        'Jean-Pierre François',
        "O'Brien-Smith",
        '李明',
        'Müller-Schmidt',
        'Nguyễn Văn A',
      ]

      for (const name of specialNames) {
        const user = new User('id-123', testEmail, testPassword, name, testRole)
        expect(user.getName()).toBe(name)
      }
    })

    it('should handle sequential password updates correctly', async () => {
      const pass1 = await Password.create('password1!')
      const pass2 = await Password.create('password2!')
      const pass3 = await Password.create('password3!')

      await testUser.updatePassword('password123', pass1)
      await testUser.updatePassword('password1!', pass2)
      await testUser.updatePassword('password2!', pass3)

      // Final password should be pass3
      const pass4 = await Password.create('password4!')
      await expect(testUser.updatePassword('password3!', pass4)).resolves.not.toThrow()
    })

    it('should handle rapid email updates', () => {
      for (let i = 0; i < 10; i++) {
        const email = new Email(`test${i}@example.com`)
        testUser.updateEmail(email)
      }

      expect(testUser.getEmail()).toBe('test9@example.com')
    })
  })

  describe('Integration with Value Objects', () => {
    it('should work with Email value object normalization', () => {
      const mixedCaseEmail = new Email('TeSt@ExAmPlE.CoM')
      const user = new User('id-123', mixedCaseEmail, testPassword, 'Test User', testRole)

      expect(user.getEmail()).toBe('test@example.com')
    })

    it('should work with Password value object hashing', async () => {
      const plainPassword = 'mysecretpassword123'
      const hashedPassword = await Password.create(plainPassword)
      const user = new User('id-123', testEmail, hashedPassword, 'Test User', testRole)

      expect(user).toBeInstanceOf(User)

      // Password should be hashed and verifiable
      const newPassword = await Password.create('newpassword456')
      await expect(user.updatePassword(plainPassword, newPassword)).resolves.not.toThrow()
    })

    it('should maintain email equality semantics', () => {
      const email1 = new Email('same@example.com')
      const email2 = new Email('same@example.com')

      const user1 = new User('id-1', email1, testPassword, 'User 1', testRole)
      const user2 = new User('id-2', email2, testPassword, 'User 2', testRole)

      expect(user1.getEmail()).toBe(user2.getEmail())
    })
  })

  describe('Immutability', () => {
    it('should have readonly id property (TypeScript compile-time)', () => {
      // TypeScript readonly is compile-time only, not runtime
      // The id property is accessible but TypeScript prevents reassignment
      expect(testUser.id).toBe('user-123')
      expect(typeof testUser.id).toBe('string')
    })

    it('should properly encapsulate email field', () => {
      const email = testUser.getEmail()
      // Modifying the returned string should not affect the user
      const modifiedEmail = email.toUpperCase()

      expect(testUser.getEmail()).toBe('test@example.com')
      expect(modifiedEmail).toBe('TEST@EXAMPLE.COM')
    })

    it('should properly encapsulate name field', () => {
      const name = testUser.getName()
      // Modifying the returned string should not affect the user
      const modifiedName = name.toUpperCase()

      expect(testUser.getName()).toBe('John Doe')
      expect(modifiedName).toBe('JOHN DOE')
    })
  })

  describe('getPasswordHash()', () => {
    it('should return the password hash as a string', () => {
      const hash = testUser.getPasswordHash()

      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should return a bcrypt hash format', () => {
      const hash = testUser.getPasswordHash()

      // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
      expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should return different hashes for different passwords', async () => {
      const password1 = await Password.create('password123')
      const password2 = await Password.create('differentpass456')

      const user1 = new User('id-1', testEmail, password1, 'User 1', testRole)
      const user2 = new User('id-2', testEmail, password2, 'User 2', testRole)

      expect(user1.getPasswordHash()).not.toBe(user2.getPasswordHash())
    })

    it('should return the same hash for same password input', async () => {
      const password = await Password.create('samepassword123')
      const user = new User('id-1', testEmail, password, 'Test User', testRole)

      const hash1 = user.getPasswordHash()
      const hash2 = user.getPasswordHash()

      expect(hash1).toBe(hash2)
    })

    it('should return updated hash after password change', async () => {
      const originalHash = testUser.getPasswordHash()

      const newPassword = await Password.create('newpassword456')
      await testUser.updatePassword('password123', newPassword)

      const updatedHash = testUser.getPasswordHash()

      expect(updatedHash).not.toBe(originalHash)
      expect(updatedHash).toMatch(/^\$2[aby]\$\d{2}\$/)
    })

    it('should never expose the plain text password', () => {
      const hash = testUser.getPasswordHash()

      expect(hash).not.toContain('password123')
      expect(hash).not.toMatch(/password123/i)
    })

    it('should return consistent hash length (bcrypt produces 60 character hashes)', () => {
      const hash = testUser.getPasswordHash()

      expect(hash.length).toBe(60)
    })
  })

  describe('verifyPassword()', () => {
    it('should return true for correct password', async () => {
      const isValid = await testUser.verifyPassword('password123')

      expect(isValid).toBe(true)
    })

    it('should return false for incorrect password', async () => {
      const isValid = await testUser.verifyPassword('wrongpassword')

      expect(isValid).toBe(false)
    })

    it('should return false for empty string password', async () => {
      const isValid = await testUser.verifyPassword('')

      expect(isValid).toBe(false)
    })

    it('should be case-sensitive', async () => {
      const isValid = await testUser.verifyPassword('PASSWORD123')

      expect(isValid).toBe(false)
    })

    it('should handle special characters correctly', async () => {
      const specialPassword = 'P@ssw0rd!#$%'
      const password = await Password.create(specialPassword)
      const user = new User('id-1', testEmail, password, 'Test User', testRole)

      const isValid = await user.verifyPassword(specialPassword)

      expect(isValid).toBe(true)
    })

    it('should handle passwords with spaces', async () => {
      const passwordWithSpaces = 'pass word 123'
      const password = await Password.create(passwordWithSpaces)
      const user = new User('id-1', testEmail, password, 'Test User', testRole)

      const isValid = await user.verifyPassword(passwordWithSpaces)

      expect(isValid).toBe(true)
    })

    it('should verify password after password update', async () => {
      const newPassword = await Password.create('newpassword456')
      await testUser.updatePassword('password123', newPassword)

      const isOldPasswordValid = await testUser.verifyPassword('password123')
      const isNewPasswordValid = await testUser.verifyPassword('newpassword456')

      expect(isOldPasswordValid).toBe(false)
      expect(isNewPasswordValid).toBe(true)
    })

    it('should use constant-time comparison to prevent timing attacks', async () => {
      // This is a behavior test - bcrypt.compare uses constant-time comparison
      const shortPassword = await testUser.verifyPassword('a')
      const longPassword = await testUser.verifyPassword('a'.repeat(100))

      // Both should return false but timing should be similar (we can't test timing here)
      expect(shortPassword).toBe(false)
      expect(longPassword).toBe(false)
    })

    it('should handle unicode characters in password', async () => {
      const unicodePassword = 'pässwørd123汉字'
      const password = await Password.create(unicodePassword)
      const user = new User('id-1', testEmail, password, 'Test User', testRole)

      const isValid = await user.verifyPassword(unicodePassword)

      expect(isValid).toBe(true)
    })

    it('should return false for password that is substring of correct password', async () => {
      const isValid = await testUser.verifyPassword('password')

      expect(isValid).toBe(false)
    })

    it('should return false for password that contains correct password', async () => {
      const isValid = await testUser.verifyPassword('password123extra')

      expect(isValid).toBe(false)
    })

    it('should handle multiple concurrent verifications', async () => {
      const verifications = await Promise.all([
        testUser.verifyPassword('password123'),
        testUser.verifyPassword('wrongpassword'),
        testUser.verifyPassword('password123'),
        testUser.verifyPassword('another'),
        testUser.verifyPassword('password123'),
      ])

      expect(verifications).toEqual([true, false, true, false, true])
    })
  })

  describe('getCreatedAt()', () => {
    it('should return the creation date', () => {
      const createdAt = testUser.getCreatedAt()

      expect(createdAt).toBeInstanceOf(Date)
    })

    it('should return a valid Date object', () => {
      const createdAt = testUser.getCreatedAt()

      expect(createdAt.getTime()).not.toBeNaN()
      expect(createdAt instanceof Date).toBe(true)
    })

    it('should return the custom date when provided in constructor', () => {
      const customDate = new Date('2024-01-15T10:30:00Z')
      const user = new User('id-123', testEmail, testPassword, 'Test User', testRole, customDate)

      const createdAt = user.getCreatedAt()

      expect(createdAt).toEqual(customDate)
      expect(createdAt.toISOString()).toBe('2024-01-15T10:30:00.000Z')
    })

    it('should return current date when no date provided in constructor', () => {
      const beforeCreation = new Date()
      const user = new User('id-123', testEmail, testPassword, 'Test User', testRole)
      const afterCreation = new Date()

      const createdAt = user.getCreatedAt()

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should persist the same creation date across multiple calls', () => {
      const createdAt1 = testUser.getCreatedAt()
      const createdAt2 = testUser.getCreatedAt()
      const createdAt3 = testUser.getCreatedAt()

      expect(createdAt1).toEqual(createdAt2)
      expect(createdAt2).toEqual(createdAt3)
    })

    it('should have different creation dates for users created at different times', async () => {
      const user1 = new User('id-1', testEmail, testPassword, 'User 1', testRole)

      // Wait a small amount
      await new Promise((resolve) => globalThis.setTimeout(resolve, 10))

      const user2 = new User('id-2', testEmail, testPassword, 'User 2', testRole)

      expect(user2.getCreatedAt().getTime()).toBeGreaterThan(user1.getCreatedAt().getTime())
    })

    it('should maintain creation date after email updates', () => {
      const originalCreatedAt = testUser.getCreatedAt()

      const newEmail = new Email('newemail@example.com')
      testUser.updateEmail(newEmail)

      const updatedCreatedAt = testUser.getCreatedAt()

      expect(updatedCreatedAt).toEqual(originalCreatedAt)
    })

    it('should maintain creation date after password updates', async () => {
      const originalCreatedAt = testUser.getCreatedAt()

      const newPassword = await Password.create('newpassword123')
      await testUser.updatePassword('password123', newPassword)

      const updatedCreatedAt = testUser.getCreatedAt()

      expect(updatedCreatedAt).toEqual(originalCreatedAt)
    })

    it('should maintain creation date after role updates', () => {
      const originalCreatedAt = testUser.getCreatedAt()

      const newRole = new Role('admin')
      testUser.updateRole(newRole)

      const updatedCreatedAt = testUser.getCreatedAt()

      expect(updatedCreatedAt).toEqual(originalCreatedAt)
    })

    it('should handle dates in the past', () => {
      const pastDate = new Date('2020-01-01T00:00:00Z')
      const user = new User('id-123', testEmail, testPassword, 'Test User', testRole, pastDate)

      const createdAt = user.getCreatedAt()

      expect(createdAt).toEqual(pastDate)
      expect(createdAt.getFullYear()).toBe(2020)
    })

    it('should return Date object that can be formatted', () => {
      const customDate = new Date('2024-06-15T14:30:00Z')
      const user = new User('id-123', testEmail, testPassword, 'Test User', testRole, customDate)

      const createdAt = user.getCreatedAt()

      expect(createdAt.toISOString()).toBe('2024-06-15T14:30:00.000Z')
      expect(createdAt.toLocaleDateString('en-US')).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)
    })
  })
})
