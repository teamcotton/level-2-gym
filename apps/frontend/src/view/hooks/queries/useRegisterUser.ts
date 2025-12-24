'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { registerUser as registerUserAppAction } from '@/application/actions/registerUser.js'
import type { RegisterUserData } from '@/domain/auth/index.js'

export function useRegisterUser() {
  const queryClient = useQueryClient()

  return useMutation({
    // Use the application-level `registerUser` in the browser so the
    // client performs a fetch to `/api/register`. This preserves the
    // observable network request shape expected by existing E2E tests.
    mutationFn: (data: RegisterUserData) => registerUserAppAction(data),
    onSuccess: (result) => {
      if (result && (result as { success?: boolean }).success) {
        // Invalidate users list if needed
        queryClient.invalidateQueries({ queryKey: ['users'] })
      }
    },
  })
}
