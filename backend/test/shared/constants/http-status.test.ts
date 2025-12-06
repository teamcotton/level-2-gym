import { describe, expect, it } from 'vitest'

import { HttpStatus } from '../../../src/shared/constants/http-status.js'

describe('HttpStatus', () => {
  describe('success status codes', () => {
    it('should have OK status', () => {
      expect(HttpStatus.OK).toBe(200)
    })

    it('should have CREATED status', () => {
      expect(HttpStatus.CREATED).toBe(201)
    })

    it('should have NO_CONTENT status', () => {
      expect(HttpStatus.NO_CONTENT).toBe(204)
    })
  })

  describe('client error status codes', () => {
    it('should have BAD_REQUEST status', () => {
      expect(HttpStatus.BAD_REQUEST).toBe(400)
    })

    it('should have UNAUTHORIZED status', () => {
      expect(HttpStatus.UNAUTHORIZED).toBe(401)
    })

    it('should have FORBIDDEN status', () => {
      expect(HttpStatus.FORBIDDEN).toBe(403)
    })

    it('should have NOT_FOUND status', () => {
      expect(HttpStatus.NOT_FOUND).toBe(404)
    })

    it('should have CONFLICT status', () => {
      expect(HttpStatus.CONFLICT).toBe(409)
    })

    it('should have UNPROCESSABLE_ENTITY status', () => {
      expect(HttpStatus.UNPROCESSABLE_ENTITY).toBe(422)
    })
  })

  describe('server error status codes', () => {
    it('should have INTERNAL_SERVER_ERROR status', () => {
      expect(HttpStatus.INTERNAL_SERVER_ERROR).toBe(500)
    })

    it('should have SERVICE_UNAVAILABLE status', () => {
      expect(HttpStatus.SERVICE_UNAVAILABLE).toBe(503)
    })
  })

  describe('enum completeness', () => {
    it('should have all expected status codes', () => {
      const expectedStatuses = [200, 201, 204, 400, 401, 403, 404, 409, 422, 500, 503]

      const actualStatuses = Object.values(HttpStatus).filter((value) => typeof value === 'number')
      expect(actualStatuses).toHaveLength(expectedStatuses.length)
      expectedStatuses.forEach((status) => {
        expect(actualStatuses).toContain(status)
      })
    })
  })

  describe('enum usage', () => {
    it('should be usable in switch statements', () => {
      const getStatusMessage = (status: HttpStatus): string => {
        switch (status) {
          case HttpStatus.OK:
            return 'Success'
          case HttpStatus.NOT_FOUND:
            return 'Not Found'
          case HttpStatus.INTERNAL_SERVER_ERROR:
            return 'Server Error'
          default:
            return 'Unknown Status'
        }
      }

      expect(getStatusMessage(HttpStatus.OK)).toBe('Success')
      expect(getStatusMessage(HttpStatus.NOT_FOUND)).toBe('Not Found')
      expect(getStatusMessage(HttpStatus.INTERNAL_SERVER_ERROR)).toBe('Server Error')
    })

    it('should be comparable with numeric values', () => {
      expect(HttpStatus.OK === 200).toBe(true)
      expect(HttpStatus.NOT_FOUND === 404).toBe(true)
      expect(HttpStatus.INTERNAL_SERVER_ERROR === 500).toBe(true)
    })

    it('should be usable in numeric comparisons', () => {
      expect(HttpStatus.OK >= 200 && HttpStatus.OK < 300).toBe(true)
      expect(HttpStatus.BAD_REQUEST >= 400 && HttpStatus.BAD_REQUEST < 500).toBe(true)
      expect(HttpStatus.INTERNAL_SERVER_ERROR >= 500).toBe(true)
    })
  })

  describe('status code categories', () => {
    it('should identify success codes (2xx)', () => {
      const isSuccess = (status: HttpStatus): boolean => status >= 200 && status < 300

      expect(isSuccess(HttpStatus.OK)).toBe(true)
      expect(isSuccess(HttpStatus.CREATED)).toBe(true)
      expect(isSuccess(HttpStatus.NO_CONTENT)).toBe(true)
      expect(isSuccess(HttpStatus.BAD_REQUEST)).toBe(false)
    })

    it('should identify client error codes (4xx)', () => {
      const isClientError = (status: HttpStatus): boolean => status >= 400 && status < 500

      expect(isClientError(HttpStatus.BAD_REQUEST)).toBe(true)
      expect(isClientError(HttpStatus.UNAUTHORIZED)).toBe(true)
      expect(isClientError(HttpStatus.NOT_FOUND)).toBe(true)
      expect(isClientError(HttpStatus.OK)).toBe(false)
      expect(isClientError(HttpStatus.INTERNAL_SERVER_ERROR)).toBe(false)
    })

    it('should identify server error codes (5xx)', () => {
      const isServerError = (status: HttpStatus): boolean => status >= 500

      expect(isServerError(HttpStatus.INTERNAL_SERVER_ERROR)).toBe(true)
      expect(isServerError(HttpStatus.SERVICE_UNAVAILABLE)).toBe(true)
      expect(isServerError(HttpStatus.BAD_REQUEST)).toBe(false)
      expect(isServerError(HttpStatus.OK)).toBe(false)
    })
  })

  describe('type safety', () => {
    it('should only accept valid HttpStatus values', () => {
      const validStatus: HttpStatus = HttpStatus.OK
      expect(validStatus).toBe(200)
    })

    it('should work with type guards', () => {
      const isValidHttpStatus = (status: number): status is HttpStatus => {
        return Object.values(HttpStatus).includes(status as HttpStatus)
      }

      expect(isValidHttpStatus(200)).toBe(true)
      expect(isValidHttpStatus(404)).toBe(true)
      expect(isValidHttpStatus(999)).toBe(false)
    })
  })

  describe('response type helpers', () => {
    it('should distinguish successful responses', () => {
      const successStatuses = [HttpStatus.OK, HttpStatus.CREATED, HttpStatus.NO_CONTENT]

      successStatuses.forEach((status) => {
        expect(status).toBeGreaterThanOrEqual(200)
        expect(status).toBeLessThan(300)
      })
    })

    it('should distinguish error responses', () => {
      const errorStatuses = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.NOT_FOUND,
        HttpStatus.INTERNAL_SERVER_ERROR,
      ]

      errorStatuses.forEach((status) => {
        expect(status).toBeGreaterThanOrEqual(400)
      })
    })

    it('should map status to appropriate response handling', () => {
      const shouldRetry = (status: HttpStatus): boolean => {
        return status === HttpStatus.SERVICE_UNAVAILABLE || status >= 500
      }

      expect(shouldRetry(HttpStatus.SERVICE_UNAVAILABLE)).toBe(true)
      expect(shouldRetry(HttpStatus.INTERNAL_SERVER_ERROR)).toBe(true)
      expect(shouldRetry(HttpStatus.NOT_FOUND)).toBe(false)
      expect(shouldRetry(HttpStatus.OK)).toBe(false)
    })
  })
})
