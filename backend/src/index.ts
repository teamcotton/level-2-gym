import 'dotenv/config'
import type { FastifyServerOptions } from 'fastify'
import { buildApp } from './app.js'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// HTTPS configuration for development
const isDevelopment = process.env.NODE_ENV !== 'production'
const useHttps = isDevelopment && process.env.USE_HTTPS === 'true'

let httpsOptions: FastifyServerOptions | undefined
if (useHttps) {
  try {
    // __dirname points to src/ or dist/ directory
    // Go up one level to backend/, then into certs/
    const certsPath = join(__dirname, '..', 'certs')

    httpsOptions = {
      https: {
        key: readFileSync(join(certsPath, 'key.pem')),
        cert: readFileSync(join(certsPath, 'cert.pem')),
      },
    } as FastifyServerOptions
    console.log('🔒 HTTPS enabled for development')
  } catch (error) {
    console.warn('⚠️  HTTPS certificates not found, falling back to HTTP')
    console.warn(`   Looked in: ${join(__dirname, '..', 'certs')}`)
    console.warn(
      '   Run: cd backend/certs && openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"'
    )
  }
}

const fastify = buildApp(httpsOptions)

// Start server
const start = async () => {
  try {
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3000
    const host = process.env.HOST || '0.0.0.0'

    await fastify.listen({ port, host })
    const protocol = useHttps ? 'https' : 'http'
    console.log(`Server listening on ${protocol}://${host}:${port}`)
    console.log(`📚 API Documentation: ${protocol}://${host}:${port}/docs`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
