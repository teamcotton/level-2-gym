import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'yaml'

export function buildApp(options?: FastifyServerOptions): FastifyInstance {
  const fastify = Fastify({
    logger: true,
    ...options,
  })

  // Register CORS with permissive policy for development
  fastify.register(cors, {
    origin: true, // Allow all origins
    credentials: true, // Allow credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Load OpenAPI specification
  const openapiPath = join(import.meta.dirname, '..', 'openapi.yaml')
  const openapiSpec = parse(readFileSync(openapiPath, 'utf8'))

  // Register Swagger
  fastify.register(swagger, {
    mode: 'static',
    specification: {
      document: openapiSpec,
    },
  })

  // Register Swagger UI
  fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  })

  // Declare routes
  fastify.get('/', async (_request, _reply) => {
    return { message: 'Level 2 Gym API' }
  })

  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  fastify.get('/ai', async (request, reply) => {
    const { GET } = await import('./ai-persistance.js')
    const response = await GET(request)

    // Set the response headers (includes Content-Type: application/json)
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    // Get the response body (already JSON-stringified) and send it
    // Using text() instead of json() to avoid double-serialization
    const body = await response.text()
    return reply.status(response.status).send(body)
  })

  fastify.post('/ai', async (request, reply) => {
    const { POST } = await import('./ai-persistance.js')

    // Convert Fastify request to standard Request
    const headers: Record<string, string> = {}
    Object.entries(request.headers).forEach(([key, value]) => {
      if (typeof value === 'string') {
        headers[key] = value
      } else if (Array.isArray(value)) {
        headers[key] = value.join(', ')
      }
    })

    console.log(request.url)

    const req = new Request(`https://localhost${request.url}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(request.body),
    })

    console.log(req)

    // Get the streaming response from the AI handler
    const response = await POST(req)

    // Set the response headers
    response.headers.forEach((value, key) => {
      reply.header(key, value)
    })

    // Return the stream
    return reply.send(response.body)
  })

  return fastify
}
