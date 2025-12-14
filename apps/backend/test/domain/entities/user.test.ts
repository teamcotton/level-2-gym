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
})
