import {
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from './apiErrors.js'

export function mapBackendError(status: number, message: string) {
  switch (status) {
    case 409:
      return new ConflictError(message)
    case 400:
      return new ValidationError(message)
    case 404:
      return new NotFoundError(message)
    case 401:
      return new UnauthorizedError(message)
    case 403:
      return new ForbiddenError(message)
    case 500:
      return new InternalServerError(message)
    default:
      return new Error(message)
  }
}
