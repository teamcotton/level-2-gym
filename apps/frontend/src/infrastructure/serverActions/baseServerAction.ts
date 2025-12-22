'use server'
// Shared utilities (error handling, logging, SSL handling)
import { createLogger } from '@/adapters/secondary/services/logger.service.js'

const logger = createLogger({ prefix: 'backendRequest' })

export interface BackendRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string // e.g. '/users/register' or 'users/register'
  body?: unknown
  signal?: AbortSignal
  headers?: Record<string, string>
  timeoutMs?: number
}

function normalizeUrl(apiUrl: string, endpoint: string) {
  // Remove trailing slashes safely without ReDoS vulnerability
  let base = apiUrl
  while (base.endsWith('/')) {
    base = base.slice(0, -1)
  }
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${path}`
}

/**
 * Parse and handle response from fetch or node-fetch
 * Extracts JSON, handles errors, and throws with proper context
 */
async function handleResponse<T>(
  res: Response | Awaited<ReturnType<typeof import('node-fetch').default>>,
  url: string
): Promise<T> {
  const text = await res.text()
  let parsed: unknown
  try {
    parsed = text ? JSON.parse(text) : undefined
  } catch {
    parsed = text
  }

  if (!res.ok) {
    logger.error('[backendRequest] non-ok response', { url, status: res.status, body: parsed })
    const extractedError = (() => {
      if (!parsed || typeof parsed !== 'object') return undefined
      if ('error' in parsed) {
        const e = (parsed as { error?: unknown }).error
        return typeof e === 'string' ? e : undefined
      }
      return undefined
    })()

    const message = extractedError ?? res.statusText ?? 'Backend error'
    const err = new Error(message) as Error & { status?: number; body?: unknown }
    err.status = res.status
    err.body = parsed
    throw err
  }

  return parsed as T
}

export async function backendRequest<T>(options: BackendRequestOptions): Promise<T> {
  const apiUrl = process.env.BACKEND_AI_CALLBACK_URL
  if (!apiUrl)
    throw new Error(
      'Backend API URL not configured (NEXT_PUBLIC_BACKEND_URL / BACKEND_URL / BACKEND_AI_CALLBACK_URL)'
    )

  const url = normalizeUrl(apiUrl, options.endpoint)
  const headers = { 'Content-Type': 'application/json', ...(options.headers ?? {}) }

  const DEFAULT_TIMEOUT_MS = 15000

  function getTimeoutMs(timeoutMs?: number) {
    // Only allow known-safe values to prevent resource exhaustion
    const allowed = new Set([5000, 10000, 15000, 30000])
    const v = Number(timeoutMs ?? DEFAULT_TIMEOUT_MS)
    return allowed.has(v) ? v : DEFAULT_TIMEOUT_MS
  }

  // Validate and clamp timeout to acceptable range
  const effectiveTimeoutMs = getTimeoutMs(options.timeoutMs)

  // Check for local https with a self-signed cert (localhost / 127.0.0.1 / ::1)
  const isLocalHttps = (() => {
    try {
      const u = new URL(apiUrl)
      return (
        (['localhost', '127.0.0.1', '::1'].includes(u.hostname) ||
          u.hostname.endsWith('.localhost')) &&
        u.protocol === 'https:'
      )
    } catch {
      return false
    }
  })()

  if (isLocalHttps) {
    // use node-fetch + https.Agent to disable cert checks locally
    const https = await import('https')
    const nodeFetch = (await import('node-fetch')).default
    const agent = new https.Agent({ rejectUnauthorized: false })

    const controller = new AbortController()
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal
    const timeout = setTimeout(() => controller.abort(), effectiveTimeoutMs)

    try {
      const res = await nodeFetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        agent,
        signal: combinedSignal,
      })

      return await handleResponse<T>(res, url)
    } finally {
      clearTimeout(timeout)
    }
  } else {
    const controller = new AbortController()
    const combinedSignal = options.signal
      ? AbortSignal.any([options.signal, controller.signal])
      : controller.signal
    const timeout = setTimeout(() => controller.abort(), effectiveTimeoutMs)

    try {
      const res = await fetch(url, {
        method: options.method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: combinedSignal,
      })

      return await handleResponse<T>(res, url)
    } finally {
      clearTimeout(timeout)
    }
  }
}
