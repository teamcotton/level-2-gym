interface RequestUtilInterface {
  newRequest(): Request
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
type Headers = Record<PropertyKey, string | undefined>
type RequestBody = Record<PropertyKey, unknown> | undefined

/**
 * Utility class for creating standard Request objects from HTTP request components.
 *
 * @example
 * const requestClass = new RequestUtil(
 *   'https://api.example.com/data',
 *   'POST',
 *   { 'Content-Type': 'application/json' },
 *   { key: 'value' }
 * )
 * const request = requestClass.newRequest()
 */
export class RequestUtil implements RequestUtilInterface {
  private readonly url: string
  private readonly method: HttpMethod
  private readonly headers: Headers
  private readonly body: RequestBody
  constructor(url: string, method: HttpMethod, headers: Headers = {}, body?: RequestBody) {    this.url = url
    this.method = method
    this.headers = headers
    this.body = body
  }
  public newRequest(): Request {
    // Clone headers to avoid mutating the original
    const headers = { ...this.headers }
    // PATCH is intentionally included as a body-supporting method per HTTP spec.
    // TRACE and CONNECT are not supported by the current HttpMethod type.
    if (this.method !== 'GET' && this.method !== 'DELETE' && this.method !== 'OPTIONS') {
      // Check for Content-Type header (case-insensitive)
      const hasContentType = Object.keys(headers).some(
        (key) => key.toLowerCase() === 'content-type'
      )
      if (!hasContentType) {
        headers['Content-Type'] = 'application/json'
      }
      return new Request(this.url, {
        method: this.method,
        headers,
        body: JSON.stringify(this.body),
      })
    } else {
      return new Request(this.url, {
        method: this.method,
        headers,
      })
    }
  }
}
