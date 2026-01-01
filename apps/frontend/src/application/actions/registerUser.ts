import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'
import { UnifiedLogger } from '@/infrastructure/logging/logger.js'

const logger = new UnifiedLogger({ prefix: '[registerUser]' })

export async function registerUser(data: RegisterUserData): Promise<RegisterUserResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:4321'
    const response = await fetch(`${baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    const result = (await response.json()) as RegisterUserResponse

    logger.info(`Registration response: ${JSON.stringify(result)}`)

    if (response.status === 409) {
      return {
        status: response.status,
        success: false,
        error: result.error || 'Email already in use',
      }
    }

    if (!response.ok) {
      return {
        status: response.status,
        success: false,
        error: result.error || 'Registration failed',
      }
    }

    return {
      ...result,
      status: response.status,
    }
  } catch (error) {
    return {
      status: 500,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
