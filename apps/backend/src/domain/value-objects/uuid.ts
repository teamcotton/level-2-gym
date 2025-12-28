import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 * Unique symbol for password branding to ensure type safety.
 * This prevents regular strings from being used where UUID types are expected.
 */
declare const UUIDBrand: unique symbol

/**
 * Branded UUIDType that wraps the Uuid class with compile-time type safety.
 * The brand ensures that only validated Uuid instances can be used where this type is expected.
 *
 * @template T - The string literal type of the uuod (defaults to string)
 */
export type UUIDType<T extends string = string> = Uuid<T> & { readonly [UUIDBrand]: T }

export class Uuid<T> {
  private readonly value: string | undefined
  declare readonly [UUIDBrand]: T

  constructor(value: string) {
    this.value = this.processUserUUID(value)
  }

  private processUserUUID(userUUID: string): string | undefined {
    if (!Uuid7Util.isValidUUID(userUUID)) {
      throw new Error('Invalid UUID format provided')
    }
    return Uuid7Util.uuidVersionValidation(userUUID)
  }

  getValue(): string | undefined {
    return this.value
  }
}
