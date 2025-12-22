import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerUser } from '@/application/actions/registerUser.js'
import { useRegisterUser } from '@/view/hooks/queries/useRegisterUser.js'

vi.mock('@/infrastructure/serverActions/registerUser.server.js', () => ({
  registerUserAction: vi.fn(),
}))

vi.mock('@/application/actions/registerUser.js', () => ({
  registerUser: vi.fn(),
}))

describe('useRegisterUser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Mutation with QueryClientProvider', () => {
    it('calls registerUser action and invalidates queries on success', async () => {
      const qc = new QueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

      const sampleData = { email: 'a@b.com', name: 'A B', password: 'secret' }

      // The runtime mutation uses the application-level `registerUser`.
      // Ensure we mock that here so the hook's onSuccess receives the
      // expected payload and can invalidate queries.
      vi.mocked(registerUser).mockResolvedValue({
        success: true,
        status: 201,
        data: { userId: '1', access_token: 'token123', token_type: 'Bearer', expires_in: 3600 },
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync(sampleData)
      })

      expect(vi.mocked(registerUser)).toHaveBeenCalledWith(sampleData)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] })
    })

    it('does not invalidate queries when registration fails', async () => {
      const qc = new QueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

      const sampleData = { email: 'fail@test.com', name: 'Fail User', password: 'secret123' }

      vi.mocked(registerUser).mockResolvedValue({
        success: false,
        status: 400,
        error: 'Registration failed',
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync(sampleData)
      })

      expect(vi.mocked(registerUser)).toHaveBeenCalledWith(sampleData)
      expect(invalidateSpy).not.toHaveBeenCalled()
    })

    it('handles duplicate email error (409 status)', async () => {
      const qc = new QueryClient()
      const sampleData = { email: 'duplicate@test.com', name: 'Dup User', password: 'secret456' }

      vi.mocked(registerUser).mockResolvedValue({
        success: false,
        status: 409,
        error: 'Email already in use',
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      const response = await act(async () => {
        return await result.current.mutateAsync(sampleData)
      })

      expect(response.status).toBe(409)
      expect(response.success).toBe(false)
      expect(response.error).toBe('Email already in use')
    })

    it('handles service unavailable error (503 status)', async () => {
      const qc = new QueryClient()
      const sampleData = { email: 'test@test.com', name: 'Test User', password: 'secret789' }

      vi.mocked(registerUser).mockResolvedValue({
        success: false,
        status: 503,
        error: 'Service unavailable',
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      const response = await act(async () => {
        return await result.current.mutateAsync(sampleData)
      })

      expect(response.status).toBe(503)
      expect(response.success).toBe(false)
    })
  })

  describe('Mutation without QueryClientProvider', () => {
    it('calls registerUser action successfully', async () => {
      const sampleData = { email: 'x@y.com', name: 'X Y', password: 'pw123456' }

      vi.mocked(registerUser).mockResolvedValue({
        success: true,
        status: 201,
        data: { userId: '2', access_token: 'token456', token_type: 'Bearer', expires_in: 3600 },
      })

      const { result } = renderHook(() => useRegisterUser())

      await act(async () => {
        const res = await result.current.mutateAsync(sampleData)
        expect(res).toEqual({
          success: true,
          status: 201,
          data: { userId: '2', access_token: 'token456', token_type: 'Bearer', expires_in: 3600 },
        })
      })

      // ensure the application action was called (tests mock this function)
      expect(vi.mocked(registerUser)).toHaveBeenCalledWith(sampleData)
      // fallback exposes isSuccess flag after successful mutate
      expect(result.current.isSuccess).toBe(true)
    })

    it('handles error without throwing', async () => {
      const sampleData = { email: 'error@test.com', name: 'Error User', password: 'error123' }

      vi.mocked(registerUser).mockResolvedValue({
        success: false,
        status: 500,
        error: 'Internal server error',
      })

      const { result } = renderHook(() => useRegisterUser())

      const response = await act(async () => {
        return await result.current.mutateAsync(sampleData)
      })

      expect(response.success).toBe(false)
      expect(response.error).toBe('Internal server error')
      expect(result.current.isError).toBe(false) // mutation doesn't throw, so isError stays false
    })
  })

  describe('Mutation states', () => {
    it('should expose correct mutation states', async () => {
      const qc = new QueryClient()
      const sampleData = { email: 'state@test.com', name: 'State User', password: 'state123' }

      vi.mocked(registerUser).mockResolvedValue({
        success: true,
        status: 201,
        data: { userId: '3', access_token: 'token789', token_type: 'Bearer', expires_in: 3600 },
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      expect(result.current.isPending).toBe(false)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.isError).toBe(false)

      const mutatePromise = act(async () => {
        result.current.mutate(sampleData)
      })

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true)
      })

      await mutatePromise

      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
    })

    it('should reset mutation state', async () => {
      const qc = new QueryClient()
      const sampleData = { email: 'reset@test.com', name: 'Reset User', password: 'reset123' }

      vi.mocked(registerUser).mockResolvedValue({
        success: true,
        status: 201,
        data: { userId: '4', access_token: 'token000', token_type: 'Bearer', expires_in: 3600 },
      })

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      await act(async () => {
        await result.current.mutateAsync(sampleData)
      })

      expect(result.current.isSuccess).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.isSuccess).toBe(false)
      expect(result.current.data).toBeUndefined()
    })
  })

  describe('Query invalidation behavior', () => {
    it('should only invalidate on result with success: true', async () => {
      const qc = new QueryClient()
      const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

      function Wrapper({ children }: { children: React.ReactNode }) {
        return React.createElement(QueryClientProvider, { client: qc }, children)
      }

      const { result } = renderHook(() => useRegisterUser(), { wrapper: Wrapper })

      // Test with success: true
      vi.mocked(registerUser).mockResolvedValue({
        success: true,
        status: 201,
        data: { userId: '5', access_token: 'tokenAAA', token_type: 'Bearer', expires_in: 3600 },
      })

      await act(async () => {
        await result.current.mutateAsync({
          email: 'valid@test.com',
          name: 'Valid User',
          password: 'valid123',
        })
      })

      expect(invalidateSpy).toHaveBeenCalledTimes(1)
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['users'] })

      // Test with success: false - should not invalidate again
      invalidateSpy.mockClear()
      vi.mocked(registerUser).mockResolvedValue({
        success: false,
        status: 400,
        error: 'Validation error',
      })

      await act(async () => {
        await result.current.mutateAsync({
          email: 'invalid@test.com',
          name: 'Invalid User',
          password: 'inv',
        })
      })

      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })
})
