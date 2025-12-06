import type { EmailType } from '../value-objects/email.js'
import type { PasswordType } from '../value-objects/password.js'
import { ValidationException } from '../../shared/exceptions/validation.exception.js'

export class User {
  constructor(
    public readonly id: string,
    private email: EmailType,
    private password: PasswordType,
    private name: string,
    private createdAt: Date = new Date()
  ) {}

  updateEmail(newEmail: EmailType): void {
    // Business rule: Email can only be updated if verified
    if (!this.isEmailVerified()) {
      throw new ValidationException('Cannot update unverified email')
    }
    this.email = newEmail
  }

  async updatePassword(oldPassword: string, newPassword: PasswordType): Promise<void> {
    // Business rule: Must verify old password before updating
    if (!(await this.password.matches(oldPassword))) {
      throw new ValidationException('Old password is incorrect')
    }
    this.password = newPassword
  }

  private isEmailVerified(): boolean {
    // Business logic for email verification
    return true // Simplified
  }

  getEmail(): string {
    return this.email.getValue()
  }

  getName(): string {
    return this.name
  }
}
