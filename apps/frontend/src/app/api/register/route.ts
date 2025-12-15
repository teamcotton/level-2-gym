import { obscured } from 'obscured'

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

    // Obscure sensitive data in memory to prevent exposure in logs/debugging
    const obscuredData = obscured.obscureKeys(body, ['password'])

    const response = await fetch(`${apiUrl}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Extract the actual password value for API transmission
      body: JSON.stringify({
        email: body.email,
        name: body.name,
        password: obscured.value(obscuredData.password),
      }),
    })

    const result = (await response.json()) as RegisterUserResponse

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
    if (error instanceof Error) {
      console.error('Registration API error:', error.message, error.stack)
    } else {
      console.error('Registration API error: An unexpected error occurred')
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
