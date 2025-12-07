import { BaseException } from './base.exception.js'
import { ErrorCode } from '../constants/error-codes.js'
import { HttpStatus } from '../constants/http-status.js'

export class TypeErrorException extends BaseException {
  constructor(message: string, details?: Record<string, any>) {
    super(message, ErrorCode.TYPE_ERROR, HttpStatus.BAD_REQUEST, details)
  }
}
