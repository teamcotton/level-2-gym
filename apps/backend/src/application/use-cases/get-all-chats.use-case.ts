import type { LoggerPort } from '../ports/logger.port.js'
import type { UserRepositoryPort } from '../ports/user.repository.port.js'

export class GetAllChatsUseCase {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly logger: LoggerPort
  ) {}
}
