import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify'
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

  return fastify
}
