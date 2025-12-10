type methodType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS'
type headersType = Record<PropertyKey, string | undefined>
type bodyType = Record<PropertyKey, unknown>

class NewRequestClass {
  private readonly url: string
  private readonly method: methodType
  private readonly headers: headersType
  private readonly body: bodyType
  constructor(url: string, method: methodType, headers: headersType, body: bodyType) {
    this.url = url
    this.method = method
    this.headers = headers
    this.body = body
  }
  newRequest() {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: JSON.stringify(this.body),
    })
  }
}
