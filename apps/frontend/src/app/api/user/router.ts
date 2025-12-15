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

    const response = await fetch(`${apiUrl}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Don't cache, always fetch fresh data
    })

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
