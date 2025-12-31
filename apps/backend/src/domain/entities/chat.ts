import { Uuid7Util } from '../../shared/utils/uuid7.util.js'

/**
 *  id UUID PRIMARY KEY,
 *     user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
 *     created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 *     updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
 */

export class Chat {
  constructor(
    private readonly user_id: string,
    public readonly id: string = Uuid7Util.createUuidv7(),
    private readonly createdAt: Date = new Date(),
    private readonly updatedAt: Date = new Date()
  ) {}

  getId(): string {
    return this.id
  }

  getUserId(): string {
    return this.user_id
  }

  getCreatedAt(): Date {
    return this.createdAt
  }

  getUpdatedAt(): Date {
    return this.updatedAt
  }
}
