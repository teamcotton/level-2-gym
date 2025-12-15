import type { User } from '@/domain/user/user.js'

export async function GET() {
  try {
    const apiUrl = process.env.BACKEND_AI_CALLBACK_URL

    if (!apiUrl) {
      return Response.json(
        {
          success: false,
          error: 'Backend API URL not configured',
        },
        { status: 500 }
      )
    }

    // For development with self-signed certificates, disable SSL verification
    const isLocalDevelopment = apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')

    let response: Response

    if (isLocalDevelopment && apiUrl.startsWith('https')) {
      // Use dynamic import to avoid issues in production builds
      const https = await import('https')
      const nodeFetch = (await import('node-fetch')).default

      const agent = new https.Agent({
        rejectUnauthorized: false,
      })

      response = (await nodeFetch(`${apiUrl}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        agent,
      })) as unknown as Response
    } else {
      response = await fetch(`${apiUrl}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })
    }

    const result = (await response.json()) as User

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: 'User API request failed with status ' + response.status + ':',
        },
        { status: response.status }
      )
    }

    return Response.json(result, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      console.error('User API error:', error.message, error.stack)
    } else {
      console.error('User API error: An unexpected error occurred')
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
