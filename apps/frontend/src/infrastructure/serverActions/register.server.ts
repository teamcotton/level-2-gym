'use server'

import { z } from 'zod'

// Schema for the registration payload.
const RegisterUserInputSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
})

export type RegisterUserInput = z.infer<typeof RegisterUserInputSchema>

// Server Action for registering a user.
// This action can be invoked from Server Components or used as a form action.
export async function registerUser(input: RegisterUserInput) {
  const validatedInput = RegisterUserInputSchema.parse(input)

  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(validatedInput),
  })

  if (!response.ok) {
    // Try to surface any error details returned by the backend.
    let errorDetail: unknown
    try {
      errorDetail = await response.json()
    } catch {
      errorDetail = await response.text().catch(() => undefined)
    }

    throw new Error(
      `Registration failed with status ${response.status}${
        errorDetail ? `: ${JSON.stringify(errorDetail)}` : ''
      }`
    )
  }

  return response.json()
}
