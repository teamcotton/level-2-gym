import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'

export async function registerUser(data: RegisterUserData): Promise<RegisterUserResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4321'
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = (await response.json()) as RegisterUserResponse

    if (response.status === 409) {
      return {
        success: false,
        error: 'Email already in use',
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: 'Registration failed',
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
