import { createLogger } from '@/application/services/logger.service.js'
import type { PaginatedUsersResponse } from '@/domain/user/user.js'

const logger = createLogger({ prefix: 'UsersAPI' })

export async function GET(request: Request) {
  try {
    const apiUrl =
      process.env.NODE_ENV === 'production'
        ? process.env.BACKEND_AI_CALLBACK_URL_PROD
        : process.env.BACKEND_AI_CALLBACK_URL_DEV

    if (!apiUrl) {
      return Response.json(
        {
          success: false,
          error: 'Backend API URL not configured',
        },
        { status: 500 }
      )
    }

    // Extract pagination parameters from URL query string
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build query string for backend API
    const queryParams = new URLSearchParams()
    if (limit) queryParams.set('limit', limit)
    if (offset) queryParams.set('offset', offset)
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

    // For development with self-signed certificates, disable SSL verification
    const isLocalDevelopment = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')

    let response: Response

    if (isLocalDevelopment && apiUrl.startsWith('https')) {
      // Use dynamic import to avoid issues in production builds
      // TODO: This code uses node-fetch exclusively for local development with self-signed certificates
      const https = await import('https')
      const nodeFetch = (await import('node-fetch')).default

      const agent = new https.Agent({
        rejectUnauthorized: false,
      })

      response = (await nodeFetch(`${apiUrl}/users${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        agent,
      })) as unknown as Response
    } else {
      response = await fetch(`${apiUrl}/users${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
    }

    const result = (await response.json()) as PaginatedUsersResponse

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: 'User API request failed with status ' + response.status,
        },
        { status: response.status }
      )
    }

    return Response.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      logger.error('User API error:', error.message, error.stack)
    }
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
