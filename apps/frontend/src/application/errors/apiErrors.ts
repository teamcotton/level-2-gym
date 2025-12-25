export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'UnauthorizedError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
    Error.captureStackTrace(this, this.constructor)
  }
}

export class InternalServerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InternalServerError'
    Error.captureStackTrace(this, this.constructor)
  }
}
