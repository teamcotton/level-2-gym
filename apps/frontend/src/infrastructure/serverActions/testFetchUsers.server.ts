'use server'

import { backendRequest } from './baseServerAction.js'

/**
 * Test server action for E2E testing of JWT expiration handling.
 * This action makes a backend request that requires authentication,
 * allowing us to test the 401 redirect behavior when JWT expires.
 *
 * @returns {Promise<{ success: boolean; users?: unknown[] }>} Object indicating success and optional users data
 */
export async function testFetchUsers(): Promise<{ success: boolean; users?: unknown[] }> {
  try {
    // Make a request to the backend that requires authentication
    // This will trigger a 401 if the JWT is invalid/expired
    const response = await backendRequest<{ data: unknown[] }>({
      method: 'GET',
      endpoint: '/users',
      // redirectOn401 defaults to true, so 401 will trigger redirect
    })

    return {
      success: true,
      users: response.data,
    }
  } catch {
    // If we get here, it means the error wasn't a 401 (which would have redirected)
    return {
      success: false,
    }
  }
}
