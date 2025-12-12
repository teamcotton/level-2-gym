import { describe, expect, it } from 'vitest'

import { FastifyUtil } from '../../../src/shared/utils/fastify.utils.js'

describe('FastifyUtil', () => {
  describe('createRequest', () => {
    describe('GET requests', () => {
      it('should create a GET request with URL only', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET')

        expect(request.method).toBe('GET')
        expect(request.url).toBe('https://api.example.com/users')
        expect(request.body).toBeNull()
      })

      it('should create a GET request with custom headers', () => {
        const headers = { Authorization: 'Bearer token123' }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', headers)

        expect(request.method).toBe('GET')
        expect(request.headers.get('Authorization')).toBe('Bearer token123')
      })

      it('should ignore body parameter for GET requests', async () => {
        const body = { name: 'test' }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', {}, body)

        expect(request.method).toBe('GET')
        expect(request.body).toBeNull()
      })

      it('should not add Content-Type header for GET requests', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET')

        expect(request.headers.get('Content-Type')).toBeNull()
      })

      it('should handle empty headers object', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', {})

        expect(request.method).toBe('GET')
        expect(request.url).toBe('https://api.example.com/users')
      })

      it('should handle multiple custom headers', () => {
        const headers = {
          Authorization: 'Bearer token',
          'X-Custom-Header': 'custom-value',
          Accept: 'application/json',
        }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', headers)

        expect(request.headers.get('Authorization')).toBe('Bearer token')
        expect(request.headers.get('X-Custom-Header')).toBe('custom-value')
        expect(request.headers.get('Accept')).toBe('application/json')
      })
    })

    describe('POST requests', () => {
      it('should create a POST request with body', async () => {
        const body = { name: 'John Doe', email: 'john@example.com' }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'POST', {}, body)

        expect(request.method).toBe('POST')
        expect(request.url).toBe('https://api.example.com/users')
        const requestBody = await request.json()
        expect(requestBody).toEqual(body)
      })

      it('should automatically add Content-Type header for POST requests', () => {
        const body = { name: 'John Doe' }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'POST', {}, body)

        expect(request.headers.get('Content-Type')).toBe('application/json')
      })

      it('should not override existing Content-Type header', () => {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
        const body = { name: 'John Doe' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'POST',
          headers,
          body
        )

        expect(request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')
      })

      it('should handle Content-Type header case-insensitively', () => {
        const headers = { 'content-type': 'text/plain' }
        const body = { name: 'John Doe' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'POST',
          headers,
          body
        )

        expect(request.headers.get('content-type')).toBe('text/plain')
      })

      it('should serialize complex nested objects', async () => {
        const body = {
          user: {
            name: 'John Doe',
            address: {
              city: 'New York',
              zip: '10001',
            },
          },
          tags: ['admin', 'user'],
        }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'POST', {}, body)

        const requestBody = await request.json()
        expect(requestBody).toEqual(body)
      })

      it('should handle empty body object', async () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'POST', {}, {})

        const requestBody = await request.json()
        expect(requestBody).toEqual({})
      })

      it('should handle undefined body', async () => {
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'POST',
          {},
          undefined
        )

        const requestBody = await request.text()
        // JSON.stringify(undefined) returns undefined, which becomes empty string when sent
        expect(requestBody).toBe('')
      })

      it('should combine custom headers with auto Content-Type', () => {
        const headers = { Authorization: 'Bearer token' }
        const body = { name: 'John Doe' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'POST',
          headers,
          body
        )

        expect(request.headers.get('Authorization')).toBe('Bearer token')
        expect(request.headers.get('Content-Type')).toBe('application/json')
      })
    })

    describe('PUT requests', () => {
      it('should create a PUT request with body', async () => {
        const body = { name: 'Updated Name' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PUT',
          {},
          body
        )

        expect(request.method).toBe('PUT')
        const requestBody = await request.json()
        expect(requestBody).toEqual(body)
      })

      it('should automatically add Content-Type header for PUT requests', () => {
        const body = { name: 'Updated Name' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PUT',
          {},
          body
        )

        expect(request.headers.get('Content-Type')).toBe('application/json')
      })

      it('should not override existing Content-Type header for PUT', () => {
        const headers = { 'Content-Type': 'application/xml' }
        const body = { name: 'Updated Name' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PUT',
          headers,
          body
        )

        expect(request.headers.get('Content-Type')).toBe('application/xml')
      })
    })

    describe('PATCH requests', () => {
      it('should create a PATCH request with body', async () => {
        const body = { email: 'newemail@example.com' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PATCH',
          {},
          body
        )

        expect(request.method).toBe('PATCH')
        const requestBody = await request.json()
        expect(requestBody).toEqual(body)
      })

      it('should automatically add Content-Type header for PATCH requests', () => {
        const body = { email: 'newemail@example.com' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PATCH',
          {},
          body
        )

        expect(request.headers.get('Content-Type')).toBe('application/json')
      })

      it('should handle partial updates with PATCH', async () => {
        const body = { status: 'active' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'PATCH',
          {},
          body
        )

        const requestBody = await request.json()
        expect(requestBody).toEqual({ status: 'active' })
      })
    })

    describe('DELETE requests', () => {
      it('should create a DELETE request', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users/1', 'DELETE')

        expect(request.method).toBe('DELETE')
        expect(request.url).toBe('https://api.example.com/users/1')
        expect(request.body).toBeNull()
      })

      it('should create a DELETE request with custom headers', () => {
        const headers = { Authorization: 'Bearer token' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'DELETE',
          headers
        )

        expect(request.headers.get('Authorization')).toBe('Bearer token')
      })

      it('should ignore body parameter for DELETE requests', async () => {
        const body = { confirm: true }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users/1',
          'DELETE',
          {},
          body
        )

        expect(request.body).toBeNull()
      })

      it('should not add Content-Type header for DELETE requests', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users/1', 'DELETE')

        expect(request.headers.get('Content-Type')).toBeNull()
      })
    })

    describe('OPTIONS requests', () => {
      it('should create an OPTIONS request', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'OPTIONS')

        expect(request.method).toBe('OPTIONS')
        expect(request.url).toBe('https://api.example.com/users')
        expect(request.body).toBeNull()
      })

      it('should create an OPTIONS request with custom headers', () => {
        const headers = { Origin: 'https://example.com' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'OPTIONS',
          headers
        )

        expect(request.headers.get('Origin')).toBe('https://example.com')
      })

      it('should ignore body parameter for OPTIONS requests', () => {
        const body = { test: 'value' }
        const request = FastifyUtil.createRequest(
          'https://api.example.com/users',
          'OPTIONS',
          {},
          body
        )

        expect(request.body).toBeNull()
      })

      it('should not add Content-Type header for OPTIONS requests', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'OPTIONS')

        expect(request.headers.get('Content-Type')).toBeNull()
      })
    })

    describe('header mutation protection', () => {
      it('should not mutate original headers object', () => {
        const headers = { Authorization: 'Bearer token' }
        const originalHeaders = { ...headers }

        FastifyUtil.createRequest('https://api.example.com/users', 'POST', headers, {})

        expect(headers).toEqual(originalHeaders)
      })

      it('should not mutate original headers when adding Content-Type', () => {
        const headers: Record<string, string> = { Authorization: 'Bearer token' }

        FastifyUtil.createRequest('https://api.example.com/users', 'POST', headers, {})

        expect(headers['Content-Type']).toBeUndefined()
        expect(Object.keys(headers)).toHaveLength(1)
      })

      it('should handle headers with undefined values', () => {
        const headers = { Authorization: 'Bearer token', 'X-Optional': undefined }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', headers)

        expect(request.headers.get('Authorization')).toBe('Bearer token')
      })
    })

    describe('URL handling', () => {
      it('should handle URLs with query parameters', () => {
        const url = 'https://api.example.com/users?page=1&limit=10'
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })

      it('should handle URLs with different protocols', () => {
        const httpUrl = 'http://api.example.com/users'
        const request = FastifyUtil.createRequest(httpUrl, 'GET')

        expect(request.url).toBe(httpUrl)
      })

      it('should handle URLs with ports', () => {
        const url = 'https://api.example.com:8080/users'
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })

      it('should handle localhost URLs', () => {
        const url = 'http://localhost:3000/api/users'
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })

      it('should handle URLs with path parameters', () => {
        const url = 'https://api.example.com/users/123/posts/456'
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })

      it('should handle URLs with hash fragments', () => {
        const url = 'https://api.example.com/users#section'
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })
    })

    describe('body serialization', () => {
      it('should serialize arrays in body', async () => {
        const body = { items: [1, 2, 3] }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { items: number[] }
        expect(requestBody.items).toEqual([1, 2, 3])
      })

      it('should serialize boolean values', async () => {
        const body = { active: true, verified: false }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { active: boolean; verified: boolean }
        expect(requestBody.active).toBe(true)
        expect(requestBody.verified).toBe(false)
      })

      it('should serialize null values', async () => {
        const body = { middleName: null }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { middleName: null }
        expect(requestBody.middleName).toBeNull()
      })

      it('should serialize number values', async () => {
        const body = { age: 25, price: 99.99, quantity: 0 }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as {
          age: number
          price: number
          quantity: number
        }
        expect(requestBody.age).toBe(25)
        expect(requestBody.price).toBe(99.99)
        expect(requestBody.quantity).toBe(0)
      })

      it('should handle special characters in body values', async () => {
        const body = { message: 'Hello "World" & <Friends>' }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { message: string }
        expect(requestBody.message).toBe('Hello "World" & <Friends>')
      })

      it('should handle Unicode characters in body', async () => {
        const body = { name: '日本語', emoji: '😀🎉' }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { name: string; emoji: string }
        expect(requestBody.name).toBe('日本語')
        expect(requestBody.emoji).toBe('😀🎉')
      })
    })

    describe('edge cases', () => {
      it('should handle very long URLs', () => {
        const longPath = 'a'.repeat(1000)
        const url = `https://api.example.com/${longPath}`
        const request = FastifyUtil.createRequest(url, 'GET')

        expect(request.url).toBe(url)
      })

      it('should handle requests with many headers', () => {
        const headers: Record<string, string> = {}
        for (let i = 0; i < 50; i++) {
          headers[`X-Header-${i}`] = `value-${i}`
        }
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET', headers)

        expect(request.headers.get('X-Header-0')).toBe('value-0')
        expect(request.headers.get('X-Header-49')).toBe('value-49')
      })

      it('should handle deeply nested body objects', async () => {
        const body = {
          level1: {
            level2: {
              level3: {
                level4: {
                  level5: {
                    value: 'deep',
                  },
                },
              },
            },
          },
        }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as typeof body
        expect(requestBody.level1.level2.level3.level4.level5.value).toBe('deep')
      })

      it('should handle body with large arrays', async () => {
        const body = { numbers: Array.from({ length: 1000 }, (_, i) => i) }
        const request = FastifyUtil.createRequest('https://api.example.com/data', 'POST', {}, body)

        const requestBody = (await request.json()) as { numbers: number[] }
        expect(requestBody.numbers).toHaveLength(1000)
        expect(requestBody.numbers[999]).toBe(999)
      })
    })

    describe('Request object properties', () => {
      it('should create Request instance', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'GET')

        expect(request).toBeInstanceOf(Request)
      })

      it('should have correct URL property', () => {
        const url = 'https://api.example.com/users/123'
        const request = FastifyUtil.createRequest(url, 'POST', {}, {})

        expect(request.url).toBe(url)
      })

      it('should have correct method property', () => {
        const request = FastifyUtil.createRequest('https://api.example.com/users', 'PATCH', {}, {})

        expect(request.method).toBe('PATCH')
      })
    })
  })
})
