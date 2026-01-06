import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import cors from '@fastify/cors'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import { OpenAPI } from '@norberts-spark/shared'
import { EnvConfig } from './infrastructure/config/env.config.js'

export function buildApp(options?: FastifyServerOptions): FastifyInstance {
  const requestTimeout = Number.parseInt(EnvConfig.REQUEST_TIMEOUT, 10)
  const connectionTimeout = Number.parseInt(EnvConfig.CONNECTION_TIMEOUT, 10)
  const keepAliveTimeout = Number.parseInt(EnvConfig.KEEP_ALIVE_TIMEOUT, 10)

  const fastify = Fastify({
    logger: true,
    bodyLimit: 10 * 1024 * 1024, // 10MB
    requestTimeout: Number.isNaN(requestTimeout) ? undefined : requestTimeout,
    connectionTimeout: Number.isNaN(connectionTimeout) ? undefined : connectionTimeout,
    keepAliveTimeout: Number.isNaN(keepAliveTimeout) ? undefined : keepAliveTimeout,
    ...options,
  })

  // Register CORS with permissive policy for development
  fastify.register(cors, {
    origin: true, // Allow all origins
    credentials: true, // Allow credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // Register Swagger
  fastify.register(swagger, {
    mode: 'static',
    specification: {
      document: OpenAPI as any,
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
