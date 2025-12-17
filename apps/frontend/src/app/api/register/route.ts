import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterUserData

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

    // Parse URL to check hostname precisely
    let url: URL
    try {
      url = new URL(apiUrl)
    } catch (parseError) {
      console.error('[registration-route] Failed to parse Backend API URL:', parseError)
      return Response.json(
        {
          success: false,
          error: 'Invalid Backend API URL configuration',
        },
        { status: 500 }
      )
    }
    const isLocalDevelopment =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1'

    let response: Response
    let result: RegisterUserResponse

    if (isLocalDevelopment && apiUrl.startsWith('https')) {
      // Use dynamic import to avoid issues in production builds
      // TODO: This code uses node-fetch exclusively for local development with self-signed certificates
      const https = await import('https')
      const nodeFetch = (await import('node-fetch')).default

      const agent = new https.Agent({
        rejectUnauthorized: false,
      })

      const nodeFetchResponse = await nodeFetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email,
          name: body.name,
          password: body.password,
        }),
        agent,
      })

      // Parse the response from node-fetch
      result = (await nodeFetchResponse.json()) as RegisterUserResponse

      // Convert node-fetch response to native Response for consistent handling
      response = new Response(JSON.stringify(result), {
        status: nodeFetchResponse.status,
        statusText: nodeFetchResponse.statusText,
        headers: nodeFetchResponse.headers as unknown as HeadersInit,
      })
    } else {
      response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Extract the actual password value for API transmission
        body: JSON.stringify({
          email: body.email,
          name: body.name,
          password: body.password,
        }),
      })

      result = (await response.json()) as RegisterUserResponse
    }

    if (response.status === 409) {
      return Response.json(
        {
          success: false,
          error: result.error || 'Email already in use',
        },
        { status: response.status }
      )
    }

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: result.error || 'Registration failed',
        },
        { status: response.status }
      )
    }

    return Response.json(result, { status: 200 })
  } catch (error) {
    console.error('[registration-route] Registration error:', error)
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
