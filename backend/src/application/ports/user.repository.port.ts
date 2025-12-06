import type { User } from '../../domain/entities/user.js'

export interface UserRepositoryPort {
  save(user: User): Promise<void>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
  existsByEmail(email: User): Promise<boolean>
}
