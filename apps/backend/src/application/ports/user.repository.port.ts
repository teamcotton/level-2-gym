import type { User } from '../../domain/entities/user.js'

export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserRepositoryPort {
  save(user: User): Promise<void>
  findAll(pagination?: PaginationParams): Promise<PaginatedResult<User>>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  update(user: User): Promise<void>
  delete(id: string): Promise<void>
  existsByEmail(email: string): Promise<boolean>
}
