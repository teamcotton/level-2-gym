'use server'

import type { LoginDTO } from '@norberts-spark/shared'

import type { LoginResponse } from '@/domain/auth/index.js'
import { createLogger } from '@/infrastructure/logging/logger.js'
import { backendRequest } from '@/infrastructure/serverActions/baseServerAction.js'

const logger = createLogger({ prefix: '[login:action]' })

type BackendError = Error & {
  status?: number
  body?: unknown
  cause?: unknown
}

/**
 * Server Action for user login
 * Calls backend /auth/login endpoint server-side (single network hop)
 *
 * @param credentials - User email and password
 * @returns Login response with JWT token or error
 */
export async function loginUserAction(credentials: LoginDTO): Promise<LoginResponse> {
  try {
    const parsed = await backendRequest<LoginResponse>({
      method: 'POST',
      endpoint: '/auth/login',
      body: {
        email: credentials.email,
        password: credentials.password,
      },
      timeoutMs: 10000,
    })

    // Ensure the result includes a numeric HTTP-like status for downstream UI code
    const result: LoginResponse = {
      ...(parsed as LoginResponse),
      status: (parsed as LoginResponse).status ?? 200,
    }

    return result
  } catch (error_) {
    const err = error_ as BackendError

    // Log the error for debugging without leaking internals to the client
    logger.error('loginUserAction error', err)

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
      error: errorMessage || 'Invalid email or password',
      status,
    }
  }
}
