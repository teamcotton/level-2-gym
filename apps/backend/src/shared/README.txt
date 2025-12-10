SHARED LAYER (Common Utilities)

Purpose:
Contains code that is shared across multiple layers but doesn't belong to any
specific layer. These are typically generic utilities, constants, types, and
helpers that multiple parts of the application need.

Contains:
- Common Types: Shared TypeScript types and interfaces
- Utility Functions: Generic helpers (date formatting, string manipulation)
- Constants: Application-wide constants (error codes, status codes)
- Exceptions: Custom error classes used across layers
- Validators: Generic validation utilities
- Guards: Type guards and assertion functions
- Mapper: Utility for mapping objects
- Types: Custom TypeScript types

Rules:
- Should contain only generic, reusable code
- No business logic or domain-specific code
- No dependencies on other application layers
- Should be framework-agnostic when possible
- Can be used by any layer without creating circular dependencies

Example Structure:
shared/
  ├── types/
  │   ├── common.types.ts
  │   └── pagination.types.ts
  ├── utils/
  │   ├── date.util.ts
  │   ├── string.util.ts
  │   └── validation.util.ts
  ├── constants/
  │   ├── error-codes.ts
  │   └── http-status.ts
  ├── exceptions/
  │   ├── base.exception.ts
  │   ├── validation.exception.ts
  │   └── not-found.exception.ts
  └── guards/
      └── type.guards.ts

========================================
CODE EXAMPLES
========================================

1. COMMON TYPES (shared/types/common.types.ts):

export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

export type Optional<T> = T | null | undefined

export type Nullable<T> = T | null

export interface TimeStamps {
  createdAt: Date
  updatedAt: Date
}

export interface SoftDelete {
  deletedAt: Date | null
}

2. PAGINATION TYPES (shared/types/pagination.types.ts):

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export class PaginationHelper {
  static createResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / params.limit)
    
    return {
      data,
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        totalPages,
        hasNext: params.page < totalPages,
        hasPrevious: params.page > 1
      }
    }
  }
  
  static getOffset(params: PaginationParams): number {
    return (params.page - 1) * params.limit
  }
}

3. DATE UTILITIES (shared/utils/date.util.ts):

export class DateUtil {
  static formatToISO(date: Date): string {
    return date.toISOString()
  }

  static formatToReadable(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  static addHours(date: Date, hours: number): Date {
    const result = new Date(date)
    result.setHours(result.getHours() + hours)
    return result
  }

  static isExpired(date: Date): boolean {
    return date < new Date()
  }

  static daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  static isToday(date: Date): boolean {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
}

4. STRING UTILITIES (shared/utils/string.util.ts):

export class StringUtil {
  static capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
  }

  static slugify(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  static truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength - suffix.length) + suffix
  }

  /**
   * Generates a cryptographically secure random string.
   * Uses Node.js crypto.randomBytes for security.
   * Do NOT use Math.random() for security-sensitive values.
   */
  static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const bytes = require('crypto').randomBytes(length)
    let result = ''
    for (let i = 0; i < length; i++) {
      // Map each byte to a character in the allowed set
      result += chars.charAt(bytes[i] % chars.length)
    }
    return result
  }

  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@')
    const visibleChars = Math.min(3, localPart.length)
    const masked = localPart.substring(0, visibleChars) + '***'
    return `${masked}@${domain}`
  }
}

5. VALIDATION UTILITIES (shared/utils/validation.util.ts):

export class ValidationUtil {
  static isEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value)
  }

  static isUrl(value: string): boolean {
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  }

  static isUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(value)
  }

  static isStrongPassword(password: string): boolean {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return strongRegex.test(password)
  }

  static isPhoneNumber(value: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    return phoneRegex.test(value)
  }
}

6. ERROR CODES (shared/constants/error-codes.ts):

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_EMAIL = 'INVALID_EMAIL',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  
  // Business logic errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR'
}

7. HTTP STATUS CODES (shared/constants/http-status.ts):

export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

8. BASE EXCEPTION (shared/exceptions/base.exception.ts):

import { ErrorCode } from '../constants/error-codes'
import { HttpStatus } from '../constants/http-status'

export abstract class BaseException extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: HttpStatus,
    public readonly details?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details
    }
  }
}

9. VALIDATION EXCEPTION (shared/exceptions/validation.exception.ts):

import { BaseException } from './base.exception'
import { ErrorCode } from '../constants/error-codes'
import { HttpStatus } from '../constants/http-status'

export class ValidationException extends BaseException {
  constructor(
    message: string,
    details?: Record<string, any>
  ) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatus.BAD_REQUEST,
      details
    )
  }
}

10. NOT FOUND EXCEPTION (shared/exceptions/not-found.exception.ts):

import { BaseException } from './base.exception'
import { ErrorCode } from '../constants/error-codes'
import { HttpStatus } from '../constants/http-status'

export class NotFoundException extends BaseException {
  constructor(
    resource: string,
    identifier?: string
  ) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    
    super(
      message,
      ErrorCode.NOT_FOUND,
      HttpStatus.NOT_FOUND,
      { resource, identifier }
    )
  }
}

11. TYPE GUARDS (shared/guards/type.guards.ts):

export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value)
}

export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return isObject(obj) && key in obj
}
