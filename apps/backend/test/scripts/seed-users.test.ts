import { describe, expect, it } from 'vitest'

/**
 * Test suite for the seed-users script email generation logic
 *
 * This tests the core email generation and uniqueness validation
 * that was added to prevent duplicate emails when seeding users.
 */
describe('Email Generation Logic', () => {
  const firstNames = ['James', 'Mary', 'John']
  const lastNames = ['Smith', 'Johnson', 'Williams']
  const emailDomains = ['gmail.com', 'yahoo.com']

  function generateEmail(
    firstName: string,
    lastName: string,
    index: number,
    existingEmails: Set<string>
  ): string {
    const maxAttempts = 100
    let attempt = 0

    while (attempt < maxAttempts) {
      const domain = emailDomains[(index + attempt) % emailDomains.length]
      const baseEmail = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`
      const suffix = index + attempt > 0 ? index + attempt : ''
      const email = `${baseEmail}${suffix}@${domain}`

      if (!existingEmails.has(email)) {
        existingEmails.add(email)
        return email
      }

      attempt++
    }

    throw new Error(
      `Unable to generate unique email for ${firstName} ${lastName} after ${maxAttempts} attempts. ` +
        `Maximum recommended user count is approximately ${firstNames.length * lastNames.length * emailDomains.length} ` +
        `(${firstNames.length} firstNames × ${lastNames.length} lastNames × ${emailDomains.length} domains).`
    )
  }

  describe('generateEmail', () => {
    it('should generate unique emails for sequential indices', () => {
      const existingEmails = new Set<string>()
      const email1 = generateEmail('James', 'Smith', 0, existingEmails)
      const email2 = generateEmail('James', 'Smith', 1, existingEmails)
      const email3 = generateEmail('James', 'Smith', 2, existingEmails)

      expect(email1).toBe('james.smith@gmail.com')
      expect(email2).toBe('james.smith1@yahoo.com')
      expect(email3).toBe('james.smith2@gmail.com')
      expect(existingEmails.size).toBe(3)
    })

    it('should prevent duplicate emails', () => {
      const existingEmails = new Set<string>()
      const email1 = generateEmail('Mary', 'Johnson', 5, existingEmails)
      const email2 = generateEmail('Mary', 'Johnson', 5, existingEmails)

      expect(email1).not.toBe(email2)
      expect(existingEmails.size).toBe(2)
    })

    it('should add emails to the existing set', () => {
      const existingEmails = new Set<string>()
      generateEmail('John', 'Williams', 0, existingEmails)

      expect(existingEmails.has('john.williams@gmail.com')).toBe(true)
    })

    it('should rotate through domains', () => {
      const existingEmails = new Set<string>()
      const email1 = generateEmail('James', 'Smith', 0, existingEmails)
      const email2 = generateEmail('James', 'Smith', 1, existingEmails)

      expect(email1).toContain('gmail.com')
      expect(email2).toContain('yahoo.com')
    })

    it('should throw error after max attempts for duplicates', () => {
      const existingEmails = new Set<string>()

      // Pre-fill with all possible combinations for this name
      for (let i = 0; i < 200; i++) {
        const domain = emailDomains[i % emailDomains.length]
        const suffix = i > 0 ? i : ''
        existingEmails.add(`james.smith${suffix}@${domain}`)
      }

      expect(() => {
        generateEmail('James', 'Smith', 0, existingEmails)
      }).toThrow('Unable to generate unique email')
    })

    it('should handle index 0 correctly', () => {
      const existingEmails = new Set<string>()
      const email = generateEmail('Mary', 'Johnson', 0, existingEmails)

      expect(email).toBe('mary.johnson@gmail.com')
    })

    it('should generate many unique emails without collision', () => {
      const existingEmails = new Set<string>()
      const emailCount = 50

      for (let i = 0; i < emailCount; i++) {
        const firstName = firstNames[i % firstNames.length]!
        const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]!
        const email = generateEmail(firstName, lastName, i, existingEmails)
        expect(email).toBeTruthy()
      }

      expect(existingEmails.size).toBe(emailCount)
    })
  })
})
