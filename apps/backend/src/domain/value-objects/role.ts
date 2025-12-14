import { ValidationException } from '../../shared/exceptions/validation.exception.js'

/**
 * Unique symbol for role branding to ensure type safety.
 * This prevents regular strings from being used where Role types are expected.
 */
declare const RoleBrand: unique symbol

/**
 * Valid user roles in the system.
 */
export const USER_ROLES = ['user', 'admin', 'moderator'] as const

export type UserRole = (typeof USER_ROLES)[number]

/**
 * Branded role type that wraps the Role class with compile-time type safety.
 * The brand ensures that only validated Role instances can be used where this type is expected.
 */
export type RoleType = Role & { readonly [RoleBrand]: UserRole }

/**
 * Role value object representing a validated user role.
 *
 * Roles are validated against a predefined set of allowed roles.
 * This ensures type safety and prevents invalid roles from being assigned.
 *
 * The class uses TypeScript's branded type pattern to provide compile-time type safety,
 * preventing regular strings from being accidentally used where validated roles are required.
 *
 * @example
 * const role = new Role('user')
 * role.getValue() // 'user'
 *
 * @example
 * const role1 = new Role('admin')
 * const role2 = new Role('admin')
 * role1.equals(role2) // true
 */
export class Role {
  private readonly value: UserRole
  declare readonly [RoleBrand]: UserRole

  constructor(role: string) {
    this.validate(role)
    this.value = role as UserRole
  }

  private validate(role: string): void {
    if (!(USER_ROLES as readonly string[]).includes(role)) {
      throw new ValidationException(
        `Invalid role. Must be one of: ${USER_ROLES.join(', ')}`
      )
    }
  }

  getValue(): UserRole {
    return this.value
  }

  equals(other: Role): boolean {
    return this.value === other.value
  }

  /**
   * Checks if the role has admin privileges.
   *
   * @returns True if the role is 'admin', false otherwise
   */
  isAdmin(): boolean {
    return this.value === 'admin'
  }

  /**
   * Checks if the role has moderator or higher privileges.
   *
   * @returns True if the role is 'moderator' or 'admin', false otherwise
   */
  isModerator(): boolean {
    return this.value === 'moderator' || this.value === 'admin'
  }
}
