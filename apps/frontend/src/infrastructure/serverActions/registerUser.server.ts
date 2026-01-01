'use server'
import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'

const logger = createLogger({ prefix: '[register:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

export async function registerUserAction(data: RegisterUserData): Promise<RegisterUserResponse> {
  try {
    const parsed = await backendRequest<RegisterUserResponse>({
      method: 'POST',
      endpoint: '/users/register',
      body: {
        email: data.email,
        name: data.name,
        password: data.password,
      },
      timeoutMs: 10000,
    })

    // Ensure the result includes a numeric HTTP-like status for downstream UI code
    const result: RegisterUserResponse = {
      ...(parsed as RegisterUserResponse),
      status: (parsed as RegisterUserResponse).status ?? 200,
    }

    return result
  } catch (errUnknown) {
    const err = errUnknown as BackendError

    // Log the error for debugging without leaking internals to the client
    logger.error('registerUserAction error', err)

    // Connection / network errors -> 503 (Service Unavailable)
    const msg = err?.message ?? ''
    const cause = err?.cause as unknown as { code?: string } | undefined

    if (
      msg.includes('fetch failed') ||
      msg.includes('ECONNREFUSED') ||
      (cause && cause.code === 'ECONNREFUSED')
    ) {
      return {
        success: false,
        error: 'Unable to connect to backend service. Please ensure the backend server is running.',
        status: 503,
      }
    }

    // If backendRequest attached a status/body, surface a helpful message
    const status = err?.status ?? 500
    const body = err?.body as { error?: string } | undefined
    const errorMessage = body?.error ?? (err instanceof Error ? err.message : undefined)

    return {
      success: false,
      error: errorMessage || 'An unexpected error occurred',
      status,
    }
  }
}
