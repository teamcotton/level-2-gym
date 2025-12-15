'use server'
import type { RegisterUserData, RegisterUserResponse} from '@/domain/auth/index.js'

export async function registerUser(data: RegisterUserData): Promise<RegisterUserResponse> {
  try {
    // Call the Next.js API route instead of calling backend directly
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = (await response.json()) as RegisterUserResponse

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Registration failed',
      }
    }

    return result
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
