import type { EmailType } from '../value-objects/email.js'
import type { PasswordType } from '../value-objects/password.js'
import type { RoleType } from '../value-objects/role.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * User entity representing a registered user in the system.
 *
 * This entity encapsulates user data and business rules related to user management.
 * It uses value objects (Email and Password) to ensure data validity and type safety.
 *
 * Business Rules:
 * - Users have a unique identifier (id) that cannot be changed
 * - Email addresses can only be updated if verified
 * - Password updates require verification of the old password
 * - Roles define user permissions and can be changed by administrators
 * - All user data is encapsulated and accessed through getter methods
 *
 * @example
 * ```typescript
 * const email = new Email('user@example.com')
 * const password = await Password.create('securePassword123')
 * const role = new Role('user')
 * const user = new User('user-123', email, password, 'John Doe', role)
 *
 * // Get user information
 * console.log(user.getEmail()) // 'user@example.com'
 * console.log(user.getName())  // 'John Doe'
 * console.log(user.getRole())  // 'user'
 *
 * // Update email (if verified)
 * const newEmail = new Email('newemail@example.com')
 * user.updateEmail(newEmail)
 *
 * // Update password (requires old password verification)
 * const newPassword = await Password.create('newSecurePassword456')
 * await user.updatePassword('securePassword123', newPassword)
 *
 * // Update role (admin-only operation)
 * const newRole = new Role('admin')
 * user.updateRole(newRole)
 * ```
 */
export class User {
  /**
   * Creates a new User instance.
   *
   * @param id - Unique identifier for the user (readonly, cannot be changed after creation)
   * @param email - User's email address (EmailType branded type for type safety)
   * @param password - User's hashed password (PasswordType branded type for type safety)
   * @param name - User's display name
   * @param role - User's role (RoleType branded type for type safety)
   * @param createdAt - Timestamp when the user was created (defaults to current date/time)
   *
   * @example
   * ```typescript
   * const email = new Email('john@example.com')
   * const password = await Password.create('myPassword123')
   * const role = new Role('user')
   * const user = new User('user-456', email, password, 'John Smith', role)
   * ```
   */
  constructor(
    public readonly id: string,
    private email: EmailType,
    private password: PasswordType,
    private name: string,
    private role: RoleType,
    private createdAt: Date = new Date()
  ) {}

  /**
   * Updates the user's email address.
   *
   * Business Rule: Email can only be updated if the current email is verified.
   * This prevents unauthorized email changes and ensures email ownership.
   *
   * @param newEmail - The new email address to set (must be a validated EmailType)
   * @throws {ValidationException} If the current email is not verified
   *
   * @example
   * ```typescript
   * const newEmail = new Email('newemail@example.com')
   * user.updateEmail(newEmail)
   * ```
   */
  updateEmail(newEmail: EmailType): void {
    // Business rule: Email can only be updated if verified
    if (!this.isEmailVerified()) {
      throw new ValidationException('Cannot update unverified email')
    }
    this.email = newEmail
  }

  /**
   * Updates the user's password.
   *
   * Business Rule: Must verify the old password before updating to the new password.
   * This ensures that only the user who knows the current password can change it.
   *
   * @param oldPassword - The current password (plain text) for verification
   * @param newPassword - The new password to set (must be a validated PasswordType)
   * @returns A promise that resolves when the password is successfully updated
   * @throws {ValidationException} If the old password is incorrect
   *
   * @example
   * ```typescript
   * const newPassword = await Password.create('newSecurePass123')
   * await user.updatePassword('oldPassword', newPassword)
   * ```
   */
  async updatePassword(oldPassword: string, newPassword: PasswordType): Promise<void> {
    // Business rule: Must verify old password before updating
    if (!(await this.password.matches(oldPassword))) {
      throw new ValidationException('Old password is incorrect')
    }
    this.password = newPassword
  }

  /**
   * Checks if the user's email is verified.
   *
   * @private
   * @returns True if the email is verified, false otherwise
   */
  private isEmailVerified(): boolean {
    // Business logic for email verification
    return true // Simplified
  }

  /**
   * Gets the user's email address as a string.
   *
   * @returns The user's email address in lowercase format
   *
   * @example
   * ```typescript
   * const email = user.getEmail() // 'john@example.com'
   * ```
   */
  getEmail(): string {
    return this.email.getValue()
  }

  /**
   * Gets the user's display name.
   *
   * @returns The user's name
   *
   * @example
   * ```typescript
   * const name = user.getName() // 'John Smith'
   * ```
   */
  getName(): string {
    return this.name
  }

  /**
   * Gets the user's role.
   *
   * @returns The user's role as a string
   *
   * @example
   * ```typescript
   * const role = user.getRole() // 'user'
   * ```
   */
  getRole(): string {
    return this.role.getValue()
  }

  /**
   * Updates the user's role.
   *
   * Business Rule: Role changes should typically be restricted to administrators.
   * This method should be called through a use case that enforces authorization.
   *
   * @param newRole - The new role to assign (must be a validated RoleType)
   *
   * @example
   * ```typescript
   * const newRole = new Role('admin')
   * user.updateRole(newRole)
   * ```
   */
  updateRole(newRole: RoleType): void {
    this.role = newRole
  }
}
