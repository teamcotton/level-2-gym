/**
 * Unique symbol for name branding to ensure type safety.
 * This prevents regular strings from being used where Name types are expected.
 */
declare const NameBrand: unique symbol

/**
 * Branded name type that wraps the Password class with compile-time type safety.
 * The brand ensures that only validated Name instances can be used where this type is expected.
 *
 * @template T - The string literal type of the name (defaults to string)
 */
export type NameType<T extends string = string> = Name<T> & { readonly [NameBrand]: T }

export class Name<T extends string = string> {
  private readonly value: string
  declare readonly [NameBrand]: T

  /**
   * Private constructor to enforce creation through factory methods.
   *
   * @param value - The bcrypt hashed name value
   * @private
   */
  private constructor(hashedValue: T) {
    this.value = hashedValue
  }
}
