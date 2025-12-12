import type { FastifyRequest } from 'fastify'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
type Headers = Record<PropertyKey, string | undefined>
type RequestBody = Record<PropertyKey, unknown> | undefined

/**
 * Utility class for creating standard Request objects from HTTP request components.
 * All methods are static and can be used without instantiation.
 *
 * @example
 * ```typescript
 * // Create a POST request
 * const request = RequestUtil.createRequest(
 *   'https://api.example.com/data',
 *   'POST',
 *   { 'Content-Type': 'application/json' },
 *   { key: 'value' }
 * )
 *
 * // Create a GET request
 * const getRequest = RequestUtil.createRequest(
 *   'https://api.example.com/users',
 *   'GET'
 * )
 * ```fastify
 */
export class FastifyUtil {
  /**
   * Creates a standard Request object from HTTP request components.
   *
   * This method:
   * - Automatically adds 'Content-Type: application/json' for methods that support bodies (POST, PUT, PATCH)
   *   if no Content-Type header is provided
   * - Serializes request body to JSON for methods that support bodies
   * - Handles header cloning to avoid mutations
   *
   * @param url - The URL for the request
   * @param method - The HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS)
   * @param headers - Optional headers object (defaults to empty object)
   * @param body - Optional request body (only used for POST, PUT, PATCH methods)
   * @returns A standard Request object
   *
   * @example
   * ```typescript
   * // POST request with body
   * RequestUtil.createRequest(
   *   'https://api.example.com/users',
   *   'POST',
   *   { 'Authorization': 'Bearer token' },
   *   { name: 'John Doe', email: 'john@example.com' }
   * )
   *
   * // GET request without body
   * RequestUtil.createRequest('https://api.example.com/users', 'GET')
   *
   * // PUT request with custom Content-Type
   * RequestUtil.createRequest(
   *   'https://api.example.com/users/1',
   *   'PUT',
   *   { 'Content-Type': 'application/x-www-form-urlencoded' },
   *   { name: 'Jane Doe' }
   * )
   * ```
   */
  static createRequest(
    url: string,
    method: HttpMethod,
    headers: Headers = {},
    body?: RequestBody
  ): Request {
    // Clone headers to avoid mutating the original
    const clonedHeaders = { ...headers }
    // PATCH is intentionally included as a body-supporting method per HTTP spec.
    // TRACE and CONNECT are not supported by the current HttpMethod type.
    if (method !== 'GET' && method !== 'DELETE' && method !== 'OPTIONS') {
      // Check for Content-Type header (case-insensitive)
      const hasContentType = Object.keys(clonedHeaders).some(
        (key) => key.toLowerCase() === 'content-type'
      )
      if (!hasContentType) {
        clonedHeaders['Content-Type'] = 'application/json'
      }
      return new Request(url, {
        method,
        headers: clonedHeaders,
        body: JSON.stringify(body),
      })
    } else {
      return new Request(url, {
        method,
        headers: clonedHeaders,
      })
    }
  }
  static createResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  static convertFastifyRequest(request: FastifyRequest): { headers: Record<string, string> } {
    const headers: Record<string, string> = {}
    Object.entries(request.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ')
      }
    })
    return { headers }
  }
}
