import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 *  id UUID PRIMARY KEY,
 *     user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 */

export class Chat {
  constructor(
    private readonly userId: string,
    public readonly id: string = Uuid7Util.createUuidv7(),
    private readonly createdAt: Date = new Date(),
    private readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Gets the chat's unique identifier.
   *
   * @returns The chat's UUID
   *
   * @example
   * ```typescript
   * const chat = new Chat('user-123')
   * const id = chat.getId() // '01234567-89ab-cdef-0123-456789abcdef'
   * ```
   */
  getId(): string {
    return this.id
  }

  /**
   * Gets the user ID associated with this chat.
   *
   * @returns The user's UUID who owns this chat
   *
   * @example
   * ```typescript
   * const chat = new Chat('user-123')
   * const userId = chat.getUserId() // 'user-123'
   * ```
   */
  getUserId(): string {
    return this.userId
  }

  /**
   * Gets the chat's creation timestamp.
   *
   * @returns The date when the chat was created
   *
   * @example
   * ```typescript
   * const chat = new Chat('user-123')
   * const createdAt = chat.getCreatedAt() // Date object
   * ```
   */
  getCreatedAt(): Date {
    return new Date(this.createdAt.getTime())
  }

  /**
   * Gets the chat's last update timestamp.
   *
   * @returns The date when the chat was last updated
   *
   * @example
   * ```typescript
   * const chat = new Chat('user-123')
   * const updatedAt = chat.getUpdatedAt() // Date object
   * ```
   */
  getUpdatedAt(): Date {
    return new Date(this.updatedAt.getTime())
  }
}
