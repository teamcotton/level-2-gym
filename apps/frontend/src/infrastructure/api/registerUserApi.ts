import { obscured } from 'obscured'

export interface RegisterUserData extends Record<string, string> {
  email: string
  name: string
  password: string
}

export interface RegisterUserResponse {
  success: boolean
  data?: {
    userId: string
    email: string
    name: string
  }
  error?: string
}

/**
 * Infrastructure layer function to handle user registration API call.
 * Sends registration data to the backend API.
 *
 * @param userData - User registration data including email, name, and password
 * @returns Registration response from the backend API
 * @throws Error if the backend API URL is not configured
 */
export async function registerUserApi(userData: RegisterUserData): Promise<RegisterUserResponse> {
  const apiUrl = process.env.BACKEND_AI_CALLBACK_URL

  if (!apiUrl) {
    throw new Error('Backend API URL not configured')
  }

  // Obscure sensitive data in memory to prevent exposure in logs/debugging
  const obscuredData = obscured.obscureKeys(userData, ['password'])

  const response = await fetch(`${apiUrl}/users/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Extract the actual password value for API transmission
    body: JSON.stringify({
      email: userData.email,
      name: userData.name,
      password: obscured.value(obscuredData.password),
    }),
  })

  const result = (await response.json()) as RegisterUserResponse

  if (!response.ok) {
    return {
      success: false,
      error: result.error || 'Registration failed',
    }
  }

  return result
}
