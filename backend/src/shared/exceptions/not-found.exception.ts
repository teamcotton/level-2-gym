import { BaseException } from './base.exception.js'
import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'

export class NotFoundException extends BaseException {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`

    super(message, ErrorCode.NOT_FOUND, HttpStatus.NOT_FOUND, { resource, identifier })
  }
}
