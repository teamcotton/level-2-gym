import type { FastifyInstance, FastifyServerOptions } from 'fastify'
import Fastify from 'fastify'
import { readFileSync } from 'fs'
import { join } from 'path'
import { EnvConfig } from '../config/env.config.js'
import cors from '@fastify/cors'
import { parse } from 'yaml'
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'

export function createFastifyApp(options?: FastifyServerOptions): FastifyInstance {
  /* const options: FastifyServerOptions = {
    logger: {
      level: EnvConfig.LOG_LEVEL,
    },
  }

  // Add HTTPS support in development
  if (EnvConfig.USE_HTTPS && EnvConfig.NODE_ENV === 'development') {
    options.https = {
      key: readFileSync(join(__dirname, '../../certs/key.pem')),
      cert: readFileSync(join(__dirname, '../../certs/cert.pem')),
    }
  }

  const app = Fastify(options)

  // Register CORS
  app.register(require('@fastify/cors'), {
    origin: true,
  })

  // Register error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)
    reply.status(500).send({ error: 'Internal Server Error' })
  })*/

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

  fastify.get('/health', async (_request, _reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  return fastify
}
