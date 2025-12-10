import type { FastifyRequest } from 'fastify'

export class FastifyUtil {
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
