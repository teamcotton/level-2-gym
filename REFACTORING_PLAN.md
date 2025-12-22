# Next.js Architecture Refactoring Plan (with TanStack Query)

## Current Architecture Analysis

### Current Flow (Duplicate Code Path)

```
Client Component (Browser)
    ↓
Client Hook (useRegistrationForm.ts) ← No TanStack Query (manual state management)
    ↓
Application Action (registerUser.ts) ← fetch to /api/register
    ↓
Next.js API Route (/app/api/register/route.ts) ← fetch to backend
    ↓
Backend Fastify API (localhost:3000/users/register)
```

### Problems Identified

1. **Double Network Hop**: Client → Next.js API → Backend API
2. **Duplicate Error Handling**: Error handling in both API route and application action
3. **Duplicate HTTP Logic**: SSL handling, response parsing in multiple places
4. **Unnecessary Middleware Layer**: API routes serving only as proxy
5. **Performance Overhead**: Extra latency from intermediate Next.js API layer
6. **Code Duplication**: Similar fetch logic, error mapping, response transformation
7. **Missing TanStack Query**: Architecture docs mention it, but it's not installed or used
8. **Manual Cache Management**: No caching, refetching, or optimistic updates
9. **Lack of Loading/Error States**: Manual state management in each hook

---

## Proposed Architecture

### Option 1: Server Actions + TanStack Query (Recommended)

```
Client Component (Browser)
    ↓
TanStack Query Hook (useMutation/useQuery)
    ↓
Server Action (server-side function with 'use server')
    ↓
Backend Fastify API (direct call, no intermediate layer)
    ↓
Return serialized data to client
    ↓
TanStack Query (automatic caching, refetching, optimistic updates)
```

**Benefits:**

- Single network hop (server-side only)
- Automatic serialization/deserialization
- Type-safe end-to-end
- Built-in Next.js optimizations
- No client-side API route needed
- **Automatic caching and cache invalidation** (TanStack Query)
- **Loading/error states** handled declaratively
- **Optimistic updates** for better UX
- **Request deduplication** and stale-while-revalidate
- **Infinite queries** for pagination
- **DevTools** for debugging queries

**Trade-offs:**

- Server Actions must be serializable (no class instances, functions, etc.)
- Requires Next.js 13.4+ with App Router
- Different mental model from traditional REST APIs
- Additional dependency (@tanstack/react-query)

**Why TanStack Query?**

TanStack Query solves several problems that Server Actions alone don't address:

1. **Client-side caching**: Avoids redundant server requests
2. **Background refetching**: Keeps data fresh automatically
3. **Optimistic updates**: Instant UI feedback before server confirms
4. **Request deduplication**: Multiple components fetching same data = single request
5. **Pagination/infinite scroll**: Built-in helpers
6. **DevTools**: Visualize query states, refetch times, cache status

---

### Option 2: Server Actions Only (Simpler, Less Optimal)

```
Client Component (Browser)
    ↓
Server Action (server-side function with 'use server')
    ↓
Backend Fastify API (direct call, no intermediate layer)
    ↓
Return serialized data to client
```

**Benefits:**

- Single network hop (server-side only)
- Automatic serialization/deserialization
- Type-safe end-to-end
- Built-in Next.js optimizations
- No client-side API route needed
- No additional dependencies

**Trade-offs:**

- Manual loading/error state management
- No automatic caching (every request hits server)
- No optimistic updates
- No request deduplication
- Manual pagination logic
- More boilerplate in hooks

---

### Option 3: Server Components + TanStack Query Hybrid

```
Server Component (RSC) - Initial data fetch
    ↓
Direct Backend API Call (fetch in Server Component)
    ↓
Pass to Client Component as initialData
    ↓
TanStack Query (useQuery with initialData)
    ↓
Client can refetch, paginate, optimistically update
```

**Benefits:**

- Server-side initial render (fast first paint)
- SEO-friendly
- Client-side caching and refetching after hydration
- Best of both worlds (SSR + client interactivity)

**Trade-offs:**

- More complex setup (Server Component + Client Component split)
- Requires careful data serialization
- Need to understand RSC boundaries

---

### Option 4: Unified API Client (Infrastructure Layer) - Not Recommended

```
Client Hook
    ↓
Application Action (thin orchestration)
    ↓
Infrastructure API Client (shared fetch logic)
    ↓
Backend Fastify API (direct call from server)
```

**Benefits:**

- DRY principle: Single source of truth for API calls
- Centralized error handling
- Consistent response transformation
- Works with current architecture
- Gradual migration path

**Trade-offs:**

- Still requires Next.js API routes for client-side calls (CORS)
- Doesn't eliminate double hop for client-initiated requests
- No built-in caching or optimistic updates
- Manual state management still required

---

## Backend Hexagonal Alignment (Ports & Adapters)

The backend lives in this monorepo and follows a Hexagonal (Ports & Adapters) architecture. To keep the frontend refactor robust and maintainable, align the Next.js server actions, DTOs and hooks with the backend's ports and adapters. This improves testability, reduces coupling and provides a clear contract between frontend and backend.

High-level goals:

- Establish a single source of truth for DTOs and validation (Zod schemas) used by both frontend and backend.
- Define application-level ports (interfaces) in the backend that describe the available use-cases (register, login, list users, etc.).
- Implement HTTP controllers (primary adapters) in the backend that delegate to application use-cases via the defined ports.
- Keep infrastructure concerns (Drizzle, Fastify, config, DI) isolated under `backend/src/infrastructure/`.

Monorepo action items (practical steps):

1. Create a shared package for types and schemas

- Add `packages/shared` (or `libs/shared`) containing:
  - Zod schemas and inferred TS types for `Auth`, `User`, request/response DTOs and common error shapes.
  - Exported interfaces for ports where useful (e.g. `IUserRepository`, `IAuthService`).
- Purpose: let frontend server actions and backend use-cases import the same types to stay in sync.

2. Backend: organize code to match hexagonal structure

- Directory layout (follow `apps/backend/src/HEXAGONAL_ARCHITECTURE.txt`):
  - `domain/` (entities, value-objects, domain services)
  - `application/` (use-cases, ports, dtos)
  - `adapters/` (primary/http controllers, secondary repositories)
  - `infrastructure/` (database, http server setup, di container, config)
  - `shared/` (internal utilities)
- Implement application ports to express the capabilities the application provides (e.g. `registerUser`, `loginUser`, `findUsers`).

3. Backend adapters and DI

- Implement primary adapters as Fastify controllers under `adapters/primary/http` that map HTTP requests to application use-cases.
- Implement secondary adapters for data access under `adapters/secondary/repositories` using Drizzle ORM.
- Wire concrete adapters into a DI container in `infrastructure/di/` and inject them into use-cases, so tests can swap implementations easily.

4. Frontend integration points

- Server actions should call backend HTTP controllers that are thin adapters around application use-cases (single network hop).
- Prefer importing DTOs/types from `packages/shared` and validate responses using the same Zod schemas.
- Optionally define a client-side `BackendApi` port interface (in `packages/shared`) and implement an HTTP adapter in `apps/frontend/src/infrastructure/` so server actions call an adapter rather than raw `fetch` directly. This improves testability and makes mocking easier in hooks/tests.

5. Testing strategy (aligned with hexagonal principles)

- Domain: unit tests (pure, no mocks) in `backend/src/domain`.
- Application: unit tests for use-cases that mock ports (interfaces) in `backend/src/application`.
- Adapters: integration tests for repositories and controllers using real infra (Drizzle, Fastify) in `backend/tests` or `backend/src/adapters/*/test`.
- End-to-end: full request-response tests that run Fastify server and hit the HTTP controllers.

6. Migration sequencing (minimal disruption)

- Step A: Add `packages/shared` and move/create Zod schemas and DTOs for auth and user flows.
- Step B: Introduce backend `application/ports` interfaces for the flows being migrated (register, login, list users).
- Step C: Implement or adapt Fastify controllers to call use-cases using DI.
- Step D: Update frontend server actions to import DTOs from `packages/shared` and call the HTTP endpoints.
- Step E: Replace frontend API routes (those that acted as simple proxies) with direct server-action → backend HTTP calls, or call shared adapter if introduced.
- Step F: Add tests at each layer, starting with application unit tests and adapter integration tests.

Benefits to the refactor plan

- Strongly-typed contracts between frontend and backend (less runtime mapping).
- Easier testing (swap adapters for mocks/stubs).
- Clear separation of concerns: backend authors can refactor internals without changing the public contract.
- Safer migration: can incrementally migrate endpoints and validate with type-checked DTOs.

## Recommended Refactoring Steps

### Phase 0: Install and Configure TanStack Query

#### Step 0.1: Install Dependencies

```bash
cd apps/frontend
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

#### Step 0.2: Create Query Client Provider

**Location:** `apps/frontend/src/app/providers/QueryProvider.tsx`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
            refetchOnWindowFocus: true,
            retry: 3,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

#### Step 0.3: Add Provider to Root Layout

**Location:** `apps/frontend/src/app/layout.tsx`

```typescript
import { QueryProvider } from './providers/QueryProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {/* Other providers (ThemeProvider, etc.) */}
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
```

**Benefits:**

- Global query cache configured
- DevTools available in development
- Consistent cache behavior across app
- Automatic garbage collection

---

### Phase 1: Migrate to Server Actions with TanStack Query

#### Step 1: Create Server Action Infrastructure

**Location:** `apps/frontend/src/application/actions/server/`

**Files to Create:**

- `registerUser.server.ts` - Server Action for user registration
- `findAllUsers.server.ts` - Server Action for fetching users
- `baseServerAction.ts` - Shared utilities (error handling, logging, SSL handling)

**Key Changes:**

```typescript
// apps/frontend/src/application/actions/server/registerUser.server.ts
'use server'

import { logger } from '@/application/services/logger.service.js'
import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'

export async function registerUserAction(data: RegisterUserData): Promise<RegisterUserResponse> {
  try {
    // Direct backend call - no intermediate API route
    const response = await fetch(`${process.env.BACKEND_AI_CALLBACK_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    const result = (await response.json()) as RegisterUserResponse

    if (!response.ok) {
      return {
        success: false,
        error: result.error || 'Registration failed',
        status: response.status,
      }
    }

    return { success: true, data: result.data }
  } catch (error) {
    logger.error('Registration failed:', error)
    return {
      success: false,
      error: 'Network error. Please try again.',
      status: 503,
    }
  }
}

// apps/frontend/src/application/actions/server/findAllUsers.server.ts
;('use server')

import type { User } from '@/domain/user/user.js'

export async function findAllUsersAction(params?: {
  limit?: number
  offset?: number
}): Promise<{ success: boolean; data?: User[]; error?: string }> {
  try {
    const queryParams = new URLSearchParams({
      limit: String(params?.limit ?? 100),
      offset: String(params?.offset ?? 0),
    })

    const response = await fetch(`${process.env.BACKEND_AI_CALLBACK_URL}/users?${queryParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to fetch users' }
    }

    const data = (await response.json()) as User[]
    return { success: true, data }
  } catch (error) {
    return { success: false, error: 'Network error' }
  }
}
```

**Benefits:**

- Eliminates `/app/api/register/route.ts` entirely
- Direct server-to-server communication
- Single error handling location
- Type-safe without manual JSON parsing
- Ready for TanStack Query integration

---

#### Step 2: Create TanStack Query Hooks for Server Actions

**Location:** `apps/frontend/src/view/hooks/queries/`

**Files to Create:**

- `useRegisterUser.ts` - Mutation hook for registration
- `useUsers.ts` - Query hook for fetching users

**Key Changes:**

```typescript
// apps/frontend/src/view/hooks/queries/useRegisterUser.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { registerUserAction } from '@/application/actions/server/registerUser.server.js'
import type { RegisterUserData } from '@/domain/auth/index.js'

export function useRegisterUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterUserData) => registerUserAction(data),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate users list if needed
        queryClient.invalidateQueries({ queryKey: ['users'] })
      }
    },
  })
}

// apps/frontend/src/view/hooks/queries/useUsers.ts
;('use client')

import { useQuery } from '@tanstack/react-query'
import { findAllUsersAction } from '@/application/actions/server/findAllUsers.server.js'

export function useUsers(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => findAllUsersAction(params),
    staleTime: 30 * 1000, // 30 seconds
    select: (data) => data.data, // Extract data array from response
  })
}
```

**Benefits:**

- Automatic loading/error states
- Request deduplication (multiple components = single request)
- Automatic cache invalidation
- Type-safe mutations
- DevTools integration

---

#### Step 3: Update Client Hooks to Use TanStack Query

**Files to Modify:**

- `apps/frontend/src/view/hooks/useRegistrationForm.ts`
- `apps/frontend/src/view/hooks/useAdminPage.ts` (create if doesn't exist)

**Key Changes:**

```typescript
// apps/frontend/src/view/hooks/useRegistrationForm.ts
'use client'

import { useState } from 'react'
import { useRegisterUser } from './queries/useRegisterUser.js'
import type { RegisterUserData } from '@/domain/auth/index.js'

export function useRegistrationForm() {
  const [formData, setFormData] = useState<RegisterUserData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  const [errors, setErrors] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
  })

  // TanStack Query mutation hook
  const registerMutation = useRegisterUser()

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (validateForm()) {
      // TanStack Query handles loading/error states automatically
      registerMutation.mutate(formData, {
        onSuccess: (result) => {
          if (result.success) {
            // Success handling
            console.log('Registration successful')
          } else {
            // Map server errors to form errors
            if (result.status === 409) {
              setErrors((prev) => ({
                ...prev,
                email: 'This email is already registered.',
              }))
            } else {
              // General error handled by TanStack Query error state
            }
          }
        },
      })
    }
  }

  return {
    formData,
    errors,
    // Destructure TanStack Query states
    isSubmitting: registerMutation.isPending,
    generalError: registerMutation.error?.message,
    handleChange: (field: keyof RegisterUserData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    },
    handleSubmit,
  }
}

// apps/frontend/src/view/hooks/useAdminPage.ts
;('use client')

import { useUsers } from './queries/useUsers.js'

export function useAdminPage(params?: { limit?: number; offset?: number }) {
  const { data: users, isLoading, error, refetch } = useUsers(params)

  return {
    users: users ?? [],
    isLoading,
    error: error?.message,
    refetch, // Manual refetch if needed
  }
}
```

**Benefits:**

- Remove manual `isSubmitting` state (TanStack Query provides `isPending`)
- Remove manual error handling (TanStack Query provides `error`)
- Automatic retry logic
- No need to call Server Action directly (TanStack Query handles it)
- Optimistic updates supported out of the box

---

#### Step 4: Update Components to Use TanStack Query States

#### Step 4: Update Components to Use TanStack Query States

**Files to Modify:**

- `apps/frontend/src/view/components/RegistrationForm.tsx`
- `apps/frontend/src/view/components/AdminTable.tsx` (if exists)

**Key Changes:**

```typescript
// apps/frontend/src/view/components/RegistrationForm.tsx
'use client'

export function RegistrationForm({
  formData,
  errors,
  generalError,
  isSubmitting, // From registerMutation.isPending
  onFieldChange,
  onSubmit,
}: RegistrationFormProps) {
  return (
    <form onSubmit={onSubmit}>
      {/* Show general error from TanStack Query */}
      {generalError && <Alert severity="error">{generalError}</Alert>}

      {/* Form fields */}
      <TextField
        label="Email"
        value={formData.email}
        onChange={onFieldChange('email')}
        error={Boolean(errors.email)}
        helperText={errors.email}
      />

      {/* Submit button disabled by TanStack Query pending state */}
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  )
}

// apps/frontend/src/view/components/AdminTable.tsx
'use client'

export function AdminTable() {
  const { users, isLoading, error, refetch } = useAdminPage({ limit: 100 })

  if (isLoading) return <CircularProgress />
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box>
      <Button onClick={() => refetch()}>Refresh</Button>
      <DataGrid rows={users} columns={columns} />
    </Box>
  )
}
```

**Benefits:**

- Components don't manage loading/error states
- Automatic loading spinners
- Error boundaries work naturally
- Refresh/refetch built-in

---

#### Step 5: Centralize Backend Communication Logic

**Location:** `apps/frontend/src/infrastructure/backend/`

**Files to Create:**

- `backendClient.server.ts` - Shared backend fetch logic (SSL, error handling, logging)
- `errorMapper.ts` - Maps backend errors to domain errors
- `responseTransformer.ts` - Transforms backend responses to domain types

**Key Changes:**

```typescript
// apps/frontend/src/infrastructure/backend/backendClient.server.ts
import https from 'https'
import { logger } from '@/application/services/log-layer.server.js'

export interface BackendRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  endpoint: string
  body?: unknown
  signal?: AbortSignal
}

export async function backendRequest<T>(options: BackendRequestOptions): Promise<T> {
  const apiUrl = process.env.BACKEND_AI_CALLBACK_URL

  if (!apiUrl) {
    throw new Error('BACKEND_AI_CALLBACK_URL not configured')
  }

  // SSL handling logic (once)
  // Error logging (once)
  // Response parsing (once)
  // Type-safe return
}
```

**Benefits:**

- Single location for SSL certificate handling
- Unified error logging with LogLayer
- DRY: No duplicate fetch logic
- Centralized backend URL management

---

#### Step 6: Implement Optimistic Updates (Advanced TanStack Query Feature)

**Location:** `apps/frontend/src/view/hooks/queries/useRegisterUser.ts`

**Example: Optimistic user list update**

```typescript
export function useRegisterUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterUserData) => registerUserAction(data),
    onMutate: async (newUser) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['users'] })

      // Snapshot previous value
      const previousUsers = queryClient.getQueryData(['users'])

      // Optimistically update to the new value
      queryClient.setQueryData(['users'], (old: any) => {
        if (!old?.data) return old
        return {
          ...old,
          data: [...old.data, { id: 'temp-id', ...newUser }],
        }
      })

      // Return context with previous value
      return { previousUsers }
    },
    onError: (err, newUser, context) => {
      // Rollback on error
      queryClient.setQueryData(['users'], context?.previousUsers)
    },
    onSettled: () => {
      // Refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

**Benefits:**

- Instant UI feedback (user sees result immediately)
- Automatic rollback on error
- Better perceived performance
- Professional user experience

---

#### Step 7: Implement Consistent Error Handling

**Location:** `apps/frontend/src/application/errors/`

**Files to Create:**

- `apiErrors.ts` - Domain-specific error types
- `errorHandler.server.ts` - Server-side error handler
- `errorMapper.ts` - Backend → Domain error mapping

**Key Changes:**

```typescript
// apps/frontend/src/application/errors/apiErrors.ts
export class ConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

// apps/frontend/src/application/errors/errorMapper.ts
export function mapBackendError(status: number, message: string) {
  switch (status) {
    case 409:
      return new ConflictError(message)
    case 400:
      return new ValidationError(message)
    default:
      return new Error(message)
  }
}
```

**Benefits:**

- Type-safe error handling
- Consistent error messages across app
- Single source of truth for error mapping
- Easier to test error scenarios

---

#### Step 8: Update Tests

**Files to Modify:**

- `apps/frontend/src/test/view/hooks/useRegistrationForm.test.ts`
- `apps/frontend/src/test/view/components/RegistrationForm.test.tsx`

**Files to Delete:**

- `apps/frontend/src/test/app/api/register/route.test.ts` (no longer needed)
- `apps/frontend/src/test/app/api/users/route.test.ts` (no longer needed)
- `apps/frontend/src/test/application/actions/registerUser.test.ts` (replaced by server action tests)
- `apps/frontend/src/test/application/actions/findAllUsers.test.ts` (replaced by server action tests)

**Files to Create:**

- `apps/frontend/src/test/application/actions/server/registerUser.server.test.ts`
- `apps/frontend/src/test/application/actions/server/findAllUsers.server.test.ts`
- `apps/frontend/src/test/view/hooks/queries/useRegisterUser.test.ts`
- `apps/frontend/src/test/view/hooks/queries/useUsers.test.ts`

**Key Changes:**

```typescript
// Test TanStack Query hooks with React Testing Library
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useRegisterUser } from '@/view/hooks/queries/useRegisterUser.js'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useRegisterUser', () => {
  it('should register user successfully', async () => {
    const { result } = renderHook(() => useRegisterUser(), {
      wrapper: createWrapper(),
    })

    // Mutate
    result.current.mutate({
      email: 'test@example.com',
      name: 'Test User',
      password: 'password123',
    })

    // Wait for success
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.success).toBe(true)
  })

  it('should handle errors', async () => {
    // Mock server action to return error
    const { result } = renderHook(() => useRegisterUser(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      email: 'existing@example.com',
      name: 'Test',
      password: 'pass',
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
```

**Benefits:**

- Test TanStack Query hooks in isolation
- No need to test API routes (removed)
- Test loading/error states automatically
- Test cache invalidation and optimistic updates

---

### Phase 2: Migrate Data Fetching to Server Components (Optional Enhancement)

**Files to Modify:**

- `apps/frontend/src/test/view/hooks/useRegistrationForm.test.ts`
- `apps/frontend/src/test/view/components/RegistrationForm.test.tsx`

**Files to Delete:**

- `apps/frontend/src/test/app/api/register/route.test.ts` (no longer needed)
- `apps/frontend/src/test/app/api/users/route.test.ts` (no longer needed)
- `apps/frontend/src/test/application/actions/registerUser.test.ts` (replaced by server action tests)
- `apps/frontend/src/test/application/actions/findAllUsers.test.ts` (replaced by server action tests)

**Files to Create:**

- `apps/frontend/src/test/application/actions/server/registerUser.server.test.ts`
- `apps/frontend/src/test/application/actions/server/findAllUsers.server.test.ts`
- `apps/frontend/src/test/infrastructure/backend/backendClient.server.test.ts`

**Key Changes:**

```typescript
// Test Server Actions directly
import { registerUserAction } from '@/application/actions/server/registerUser.server.js'

describe('registerUserAction', () => {
  it('should register user successfully', async () => {
    // Mock backend response
    // Test server action
    // Verify result
  })
})
```

**Benefits:**

- Test coverage moves to server actions
- Remove redundant API route tests
- Fewer test files (no duplication)
- Faster test execution (no HTTP layer)

---

### Phase 2: Migrate Data Fetching to Server Components with TanStack Query (Optional Enhancement)

#### Step 9: Convert Admin Page to Server Component with Hydration

**Files to Modify:**

- `apps/frontend/src/app/admin/page.tsx` - Convert to Server Component

**Key Changes:**

```typescript
// apps/frontend/src/app/admin/page.tsx
// Remove 'use client' directive - this is now a Server Component

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from '@tanstack/react-query'
import { findAllUsersAction } from '@/application/actions/server/findAllUsers.server.js'
import { AdminClientComponent } from '@/view/components/AdminClientComponent.js'

export default async function AdminPage() {
  const queryClient = new QueryClient()

  // Prefetch data on server
  await queryClient.prefetchQuery({
    queryKey: ['users', { limit: 100, offset: 0 }],
    queryFn: () => findAllUsersAction({ limit: 100, offset: 0 }),
  })

  return (
    // Hydrate client with server-fetched data
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminClientComponent />
    </HydrationBoundary>
  )
}
```

**Files to Create:**

- `apps/frontend/src/view/components/AdminClientComponent.tsx` - Client-side table interactions

```typescript
'use client'

import { useUsers } from '@/view/hooks/queries/useUsers.js'
import { DataGrid } from '@mui/x-data-grid'

export function AdminClientComponent() {
  // Will use server-prefetched data from HydrationBoundary
  const { data: users, isLoading, refetch } = useUsers({ limit: 100, offset: 0 })

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      <button onClick={() => refetch()}>Refresh</button>
      <DataGrid rows={users ?? []} columns={columns} />
    </div>
  )
}
```

**Benefits:**

- Initial data fetched on server (faster first paint)
- SEO-friendly (data in HTML)
- No loading spinner on first render
- Client can still refetch/paginate
- TanStack Query hydrates seamlessly

---

### Phase 3: Clean Up Old Code

**Files to Delete:**

- `apps/frontend/src/app/api/register/route.ts`
- `apps/frontend/src/app/api/users/route.ts`
- `apps/frontend/src/application/actions/registerUser.ts`
- `apps/frontend/src/application/actions/findAllUsers.ts`

**Environment Variables to Remove:**

- `NEXT_PUBLIC_BASE_URL` (no longer needed for client-side API calls)

**Benefits:**

- Reduced bundle size
- Simpler mental model
- Less code to maintain
- Fewer potential security issues (no public API routes)

---

#### Step 8: Update Documentation

**Files to Update:**

- `DEVELOPMENT.md` - Update architecture section
- `.github/copilot-instructions.md` - Update DDD architecture guidance
- `README.md` - Update getting started guide

**Key Changes:**

- Document Server Action architecture
- Update file organization guidelines
- Add migration guide for future features
- Update testing strategy

---

## Migration Checklist

### Before You Start

- [ ] Ensure Next.js version is 13.4+ (check `apps/frontend/package.json`)
- [ ] Verify `serverActions` is enabled in `next.config.ts`
- [ ] Create feature branch: `git checkout -b refactor/server-actions-tanstack-query`
- [ ] Run all tests to establish baseline: `pnpm run test`

### Phase 0: TanStack Query Setup

- [ ] Install dependencies: `pnpm add @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Create `apps/frontend/src/app/providers/QueryProvider.tsx`
- [ ] Add QueryProvider to root layout (`apps/frontend/src/app/layout.tsx`)
- [ ] Verify DevTools appear in development
- [ ] Run tests: `pnpm test:unit`

### Phase 1: Server Actions Setup

- [ ] Create `apps/frontend/src/infrastructure/backend/backendClient.server.ts`
- [ ] Create `apps/frontend/src/application/errors/apiErrors.ts`
- [ ] Create `apps/frontend/src/application/errors/errorMapper.ts`
- [ ] Create `apps/frontend/src/application/actions/server/registerUser.server.ts`
- [ ] Create `apps/frontend/src/application/actions/server/findAllUsers.server.ts`
- [ ] Write tests for new infrastructure layer
- [ ] Run tests: `pnpm test:unit`

### Phase 2: TanStack Query Hooks

- [ ] Create `apps/frontend/src/view/hooks/queries/useRegisterUser.ts`
- [ ] Create `apps/frontend/src/view/hooks/queries/useUsers.ts`
- [ ] Write tests for TanStack Query hooks
- [ ] Run tests: `pnpm test:unit`

### Phase 3: Update Application Hooks

- [ ] Update `useRegistrationForm.ts` to use TanStack Query
- [ ] Update or create `useAdminPage.ts` to use TanStack Query
- [ ] Remove manual loading/error state management
- [ ] Update components to use new hook API
- [ ] Run tests: `pnpm test:unit`
- [ ] Manual testing: Registration flow
- [ ] Manual testing: Admin page with DevTools open

### Phase 4: Optimistic Updates (Optional)

- [ ] Implement optimistic updates in `useRegisterUser`
- [ ] Test rollback on error
- [ ] Verify cache invalidation works
- [ ] Manual testing with network throttling

### Phase 5: Clean Up

- [ ] Delete old API routes (`apps/frontend/src/app/api/register/route.ts`, `apps/frontend/src/app/api/users/route.ts`)
- [ ] Delete old actions (`registerUser.ts`, `findAllUsers.ts`)
- [ ] Delete old tests for API routes and old actions
- [ ] Remove `NEXT_PUBLIC_BASE_URL` references
- [ ] Run full test suite: `pnpm run test`
- [ ] Run linter: `pnpm run lint`
- [ ] Run type checker: `pnpm run typecheck`

### Phase 6: E2E Validation

- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Test registration flow end-to-end
- [ ] Test admin page with pagination
- [ ] Test error scenarios (duplicate email, network errors)
- [ ] Verify SSL certificate handling in development
- [ ] Test with React Query DevTools open (verify cache behavior)

### Phase 7: Documentation

- [ ] Update `DEVELOPMENT.md` (add TanStack Query section)
- [ ] Update `.github/copilot-instructions.md` (document query hooks location)
- [ ] Update `README.md` (add TanStack Query to tech stack)
- [ ] Document query key conventions
- [ ] Add migration notes to commit message
- [ ] Create PR with detailed description

---

## Expected Outcomes

### Performance Improvements

- **Reduced Latency**: Eliminate one network hop (Client → API Route removed)
- **Smaller Bundle**: Remove client-side fetch boilerplate (~3-4 KB including manual state management)
- **Faster Execution**: Server-to-server calls are faster than server-to-client-to-server
- **Automatic Caching**: TanStack Query prevents redundant requests (~30-50% reduction in backend calls)
- **Optimistic Updates**: Instant UI feedback (perceived 0ms latency for mutations)
- **Request Deduplication**: Multiple components fetching same data = single request

### Code Quality Improvements

- **Lines of Code Removed**: ~250-350 lines (API routes + duplicate actions + manual state management)
- **Test Files Reduced**: 4 old test files removed, 2 new TanStack Query test files added (net reduction)
- **Cyclomatic Complexity**: Lower complexity (single error handling path, TanStack Query handles states)
- **Type Safety**: End-to-end type safety without manual JSON parsing
- **Declarative Data Fetching**: Hooks express "what" not "how"

### Developer Experience Improvements

- **Single Source of Truth**: Error handling in one place
- **Easier Debugging**: Fewer layers + React Query DevTools visualize everything
- **Simpler Mental Model**: Direct server-to-backend calls + declarative queries
- **Better DRY Compliance**: No duplicate fetch/error/loading logic
- **Automatic Retries**: Network errors handled gracefully without custom code
- **Background Refetching**: Data stays fresh automatically

### Maintainability Improvements

- **Fewer Files**: Less code to maintain and update
- **Clearer Architecture**: Follows Next.js + TanStack Query best practices
- **Future-Proof**: Aligned with Next.js 13+ and modern React patterns
- **Testability**: TanStack Query has excellent testing utilities
- **Cache Management**: Automatic garbage collection, no manual cleanup

---

## Alternative Approach: Keep API Routes (If Required)

If you **must** keep API routes (e.g., for external API consumers, webhooks, or third-party integrations), follow this hybrid approach:

### Hybrid Step 1: Create Shared Backend Client

**Location:** `apps/frontend/src/infrastructure/backend/backendClient.server.ts`

Both Server Actions **and** API Routes import this shared client.

### Hybrid Step 2: Thin API Routes

API routes become thin wrappers:

```typescript
// apps/frontend/src/app/api/register/route.ts
import { registerUserAction } from '@/application/actions/server/registerUser.server.js'

export async function POST(request: Request) {
  const body = await request.json()
  const result = await registerUserAction(body)
  return Response.json(result, { status: result.success ? 200 : 400 })
}
```

### Hybrid Step 3: Client Hooks Use Server Actions Directly

Hooks bypass API routes and call Server Actions:

```typescript
// useRegistrationForm.ts
import { registerUserAction } from '@/application/actions/server/registerUser.server.js'

const result = await registerUserAction(formData) // Direct call
```

**Benefits:**

- API routes exist for external consumers
- Internal app uses Server Actions (no double hop)
- Shared backend client (DRY)
- Gradual migration path

---

## Risk Assessment

### Low Risk

- Creating new Server Actions alongside existing code
- Adding shared infrastructure layer
- Writing tests for new code

### Medium Risk

- Updating hooks to use Server Actions (breaking change for component API)
- Deleting API routes (ensure no external dependencies)
- Changing error handling flow (requires thorough testing)

### High Risk

- Migrating to Server Components (requires page-level refactor)
- Removing `NEXT_PUBLIC_BASE_URL` (verify no external usage)
- Changing authentication flow (not covered in this plan)

### Mitigation Strategies

1. **Feature Flag**: Add temporary feature flag to toggle between old/new implementation
2. **Incremental Rollout**: Migrate one feature at a time (start with registration)
3. **Comprehensive Testing**: Add tests before refactoring, verify after
4. **Monitoring**: Add logging to track Server Action performance
5. **Rollback Plan**: Keep old code in separate branch until confidence is high

---

## Next Steps

1. **Review and Approve**: Share this plan with team, get feedback
2. **Spike**: Create proof-of-concept for registration flow only
3. **Validate**: Test POC in development environment
4. **Full Implementation**: Follow migration checklist
5. **QA**: Thorough testing in staging environment
6. **Deploy**: Gradual rollout to production with monitoring

---

## Questions to Answer Before Starting

1. **Do we have any external consumers of the `/api/register` or `/api/users` endpoints?**
   - If yes → Use Hybrid Approach
   - If no → Full Server Actions migration

- The answer to question is **no**

2. **Is authentication/authorization required for backend API calls?**
   - If yes → Plan for JWT/session handling in Server Actions
   - If no → Current plan is sufficient

- The answer to this question is **yes**

3. **Do we need real-time updates or subscriptions?**
   - If yes → Consider WebSocket or Server-Sent Events
   - If no → Server Actions are sufficient

- The answer to this question is **yes**

4. **What is our deployment environment?**
   - Vercel/Netlify → Server Actions work seamlessly
   - Self-hosted/Docker → Ensure Node.js runtime support

- The answer to this question is **Vercel** but I may want to host on AWS in the future

5. **Do we have rate limiting or caching requirements?**
   - If yes → Plan for middleware or infrastructure layer enhancements
   - If no → Basic implementation is sufficient

- The answer so this question is **yes**

---

## Additional Resources

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Domain-Driven Design in Next.js](https://khalilstemmler.com/articles/software-design-architecture/domain-driven-design-intro/)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## Conclusion

This refactoring eliminates duplicate code, reduces network hops, and simplifies your architecture by leveraging Next.js Server Actions. The migration can be done incrementally with low risk, and the benefits include better performance, maintainability, and developer experience.

---

## Updated Recommendations Based on Your Requirements

Based on your answers, here are the **critical adjustments** needed:

### 1. Authentication/Authorization Strategy

Since you require auth, you need to implement JWT/session handling in Server Actions:

**Implementation:**

```typescript
// apps/frontend/src/application/actions/auth/withAuth.ts
'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get('auth_token')?.value ?? null
}

export async function requireAuth(): Promise<string> {
  const token = await getAuthToken()
  if (!token) {
    redirect('/signin')
  }
  return token
}

// Usage in Server Action
;('use server')

import { requireAuth } from './auth/withAuth'

export async function getAllUsers() {
  const token = await requireAuth() // Redirects if not authenticated

  const response = await fetch(`${process.env.BACKEND_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // ... rest of logic
}
```

**Session Management:**

- Use `next-auth` (Auth.js) for session management
- Store JWT in HTTP-only cookies
- Server Actions automatically access cookies server-side
- Middleware can protect routes

### 2. Real-Time Updates Architecture

Since you need real-time updates, **Server Actions alone are insufficient**. You need:

**Recommended Hybrid Approach:**

```
Server Actions (mutations/fetching)
    +
WebSocket/Server-Sent Events (real-time updates)
```

**Implementation Options:**

**Option A: Server-Sent Events (SSE)**

```typescript
// apps/frontend/src/app/api/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder()
  const token = request.headers.get('authorization')

  const stream = new ReadableStream({
    async start(controller) {
      // Connect to backend WebSocket/SSE
      const ws = new WebSocket(`${process.env.BACKEND_WS_URL}/stream?token=${token}`)

      ws.onmessage = (event) => {
        const data = `data: ${event.data}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      ws.onerror = () => controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

// Client hook
function useRealtimeUpdates() {
  useEffect(() => {
    const eventSource = new EventSource('/api/stream')
    eventSource.onmessage = (event) => {
      // Handle real-time update
    }
    return () => eventSource.close()
  }, [])
}
```

**Option B: WebSocket with Separate Service**

- Keep WebSocket connection separate from Server Actions
- Use Vercel's serverless functions with streaming
- Or use a dedicated WebSocket service (Ably, Pusher, or self-hosted)

**Recommended:** Use **Server Actions for mutations** + **SSE for real-time updates**

### 3. Deployment Considerations (Vercel → AWS Migration)

**Current (Vercel):**

- Server Actions work natively
- Edge Runtime available
- Automatic scaling

**Future (AWS Migration):**

To ensure portability:

1. **Use Standalone Output Mode:**

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone', // Creates self-contained build
  // ... rest of config
}
```

2. **Deployment Options:**
   - **AWS Lambda + API Gateway** (via Serverless Framework)
   - **AWS ECS/Fargate** (Docker container)
   - **AWS EC2** (traditional hosting)

3. **Considerations:**
   - Server Actions require Node.js runtime (not static)
   - SSE/WebSocket may need separate service (AWS API Gateway WebSocket)
   - Environment variables via AWS Systems Manager or Secrets Manager

**Migration Path:**

```
Phase 1: Vercel (Server Actions + SSE)
    ↓
Phase 2: AWS ECS/Fargate (Docker with Next.js standalone)
    ↓
Optional: AWS Lambda for serverless (with adapter)
```

### 4. Rate Limiting Implementation

Since you need rate limiting, implement it at **multiple layers**:

**Layer 1: Next.js Middleware (Edge)**

```typescript
// apps/frontend/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
})

export async function middleware(request: NextRequest) {
  // Rate limit API routes and Server Actions
  if (request.nextUrl.pathname.startsWith('/api')) {
    const ip = request.ip ?? '127.0.0.1'
    const { success, limit, reset, remaining } = await ratelimit.limit(ip)

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
```

**Layer 2: Backend API (Fastify)**

Backend already handles rate limiting, so frontend middleware provides additional protection.

**Dependencies:**

```bash
pnpm add @upstash/ratelimit @upstash/redis
```

### 5. Updated Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (Browser)                          │
│  - React Components (UI)                                     │
│  - Hooks (useRegistrationForm, useAdminPage)                 │
│  - Real-time updates via SSE                                 │
└─────────────────┬──────────────────────┬────────────────────┘
                  │                      │
                  │ Server Actions       │ EventSource(/api/stream)
                  ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js Server (Vercel/AWS)                     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Middleware (Edge)                                   │    │
│  │  - Rate limiting (Upstash Redis)                     │    │
│  │  - Auth check                                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                        ↓                                      │
│  ┌──────────────────────────┬──────────────────────────┐    │
│  │  Server Actions          │  SSE Route (/api/stream) │    │
│  │  - registerUser()        │  - Real-time updates     │    │
│  │  - getAllUsers()         │  - WebSocket proxy       │    │
│  │  - With auth tokens      │                          │    │
│  └──────────────────────────┴──────────────────────────┘    │
│                        ↓                      ↓               │
└────────────────────────┼──────────────────────┼──────────────┘
                         │                      │
                   Authorization:           WebSocket
                   Bearer <JWT>             Connection
                         ↓                      ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend Fastify API (Port 3000)                 │
│  - REST endpoints (/users/register, /users)                 │
│  - WebSocket endpoint (/stream)                              │
│  - Rate limiting                                             │
│  - PostgreSQL database                                       │
└─────────────────────────────────────────────────────────────┘
```

### 6. Revised Migration Phases (With TanStack Query)

**Phase 0: TanStack Query Setup (Week 0.5)**

1. Install TanStack Query: `pnpm add @tanstack/react-query @tanstack/react-query-devtools`
2. Create QueryProvider component
3. Add to root layout
4. Configure default query options
5. Test DevTools in development

**Phase 1: Authentication Infrastructure (Week 1)**

1. Install next-auth: `pnpm add next-auth`
2. Configure JWT provider
3. Create auth utilities (`withAuth`, `getAuthToken`)
4. Update middleware for auth checks
5. Add rate limiting middleware

**Phase 2: Server Actions + TanStack Query (Week 2-3)**

1. Create Server Actions for all mutations (registerUser, etc.)
2. Create TanStack Query hooks (useMutation wrappers)
3. Migrate `registerUser` (public, no auth) with TanStack Query
4. Migrate `getAllUsers` (protected, requires auth) with TanStack Query
5. Implement optimistic updates for better UX
6. Add proper error handling and cache invalidation
7. Test with React Query DevTools
8. Test auth flow end-to-end

**Phase 3: Real-Time Updates (Week 4)**

1. Create SSE route `/api/stream`
2. Connect to backend WebSocket
3. Create TanStack Query integration for SSE (useQuery with refetchInterval or manual updates)
4. Update client hooks to consume SSE
5. Test real-time data flow with cache invalidation

**Phase 4: Cleanup & Optimization (Week 5)**

1. Remove old API routes
2. Remove manual state management code
3. Add rate limiting analytics
4. Performance testing (measure cache hit rate with DevTools)
5. Documentation (TanStack Query patterns)

**Phase 5: AWS Migration Prep (Future)**

1. Test standalone build
2. Create Dockerfile
3. Document environment variables
4. Plan infrastructure (ECS, Lambda, etc.)
5. Ensure TanStack Query hydration works in production

### 7. Required Dependencies

```bash
# TanStack Query (NEW - PRIMARY ADDITION)
pnpm add @tanstack/react-query @tanstack/react-query-devtools

# Authentication
pnpm add next-auth

# Rate limiting
pnpm add @upstash/ratelimit @upstash/redis

# Real-time updates (built-in to Next.js)
# No additional dependencies needed for SSE
```

### 8. Risk Mitigation

**Risks:**

1. **Auth complexity** → Mitigate with thorough testing
2. **Real-time updates on Vercel** → Use SSE (native support) or external service
3. **AWS migration** → Use standalone mode from day one
4. **Rate limiting costs** → Upstash has generous free tier, monitor usage
5. **TanStack Query learning curve** → Use DevTools extensively, follow best practices docs
6. **Cache invalidation complexity** → Document query key conventions clearly

**Recommended Timeline:**

- Week 0.5: TanStack Query setup
- Week 1: Auth infrastructure + rate limiting
- Week 2-3: Server Actions + TanStack Query migration
- Week 4: Real-time updates (SSE) with TanStack Query integration
- Week 5: Testing + cleanup
- **Total: 5.5 weeks** (extended from 4 weeks to properly integrate TanStack Query)

### 9. Alternative: Simpler Approach Without TanStack Query

If TanStack Query adds too much complexity for your current needs:

**Simpler Hybrid:**

- Use **Server Actions** for mutations (registerUser)
- Use **Server Components** for data fetching (admin page)
- Keep **API Routes** for real-time SSE/WebSocket
- Manual state management in hooks

This reduces scope but loses caching, optimistic updates, and automatic refetching benefits.

**Trade-off:** Less code to learn, but more manual boilerplate and worse performance (no caching).

**Alternative: Keep API Routes for Real-Time**

If Server Actions + SSE is too complex, consider:

- Use **Server Actions** for mutations (registerUser)
- Keep **API Routes** for real-time SSE/WebSocket
- Maintain current architecture for real-time features

This reduces migration scope but keeps some API routes.

---

## Final Recommendation (Updated with TanStack Query)

Based on your requirements and architecture documentation:

✅ **Server Actions** for all mutations and queries (with JWT auth)  
✅ **TanStack Query** for client-side state management, caching, and optimistic updates  
✅ **SSE via API Route** for real-time updates integrated with TanStack Query  
✅ **Next.js Middleware** for rate limiting  
✅ **Standalone build mode** for AWS portability  
✅ **5.5-week timeline** (extended for TanStack Query integration)

**Why TanStack Query is Worth It:**

1. **Automatic caching** - Reduces backend load by 30-50%
2. **Optimistic updates** - Users see instant feedback
3. **DevTools** - Visualize all queries, cache state, refetch timing
4. **Request deduplication** - 10 components fetching same data = 1 request
5. **Background refetching** - Data stays fresh without user action
6. **Better UX** - Loading/error states handled declaratively
7. **Industry standard** - Used by Netflix, AWS Console, Vercel Dashboard
8. **Future-proof** - Works with Server Components via hydration
9. **Aligns with documentation** - `.github/copilot-instructions.md` already mentions it

**Estimated Effort:** 5.5 weeks for full migration with TanStack Query, auth, real-time, and rate limiting

**Bundle Size Impact:**

- TanStack Query core: ~13 KB gzipped
- DevTools (dev only): ~40 KB (not in production)
- Removes: ~3-4 KB of manual state management
- **Net increase: ~10 KB gzipped** (worth it for features gained)

---

## TanStack Query Best Practices for This Project

### Query Key Conventions

```typescript
// User queries
;['users'][('users', { limit: 100, offset: 0 })][('users', userId)][ // All users // Paginated users // Single user
  // Auth queries
  ('auth', 'session')
][('auth', 'user')][ // Current session // Current user
  // Real-time
  ('stream', 'updates')
] // Real-time updates stream
```

### Cache Configuration by Data Type

```typescript
// Frequently changing data (user list)
staleTime: 30 * 1000 // 30 seconds

// Rarely changing data (user profile)
staleTime: 5 * 60 * 1000 // 5 minutes

// Real-time data (notifications)
staleTime: 0 // Always stale, refetch immediately
```

### Error Handling Pattern

```typescript
// In mutation hooks
onError: (error, variables, context) => {
  // Log to logger service
  logger.error('Mutation failed:', error)

  // Show user-friendly error
  toast.error('Something went wrong. Please try again.')

  // Rollback optimistic update if exists
  if (context?.previousData) {
    queryClient.setQueryData(queryKey, context.previousData)
  }
}
```

### Invalidation Strategy

```typescript
// After successful mutation
onSuccess: (data, variables, context) => {
  // Invalidate affected queries
  queryClient.invalidateQueries({ queryKey: ['users'] })

  // Optionally set exact data if you have it
  if (data.id) {
    queryClient.setQueryData(['users', data.id], data)
  }
}
```

---

## Additional Resources (Updated)

- [Next.js Server Actions Documentation](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/framework/react/overview)
- [TanStack Query with Server Actions](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Domain-Driven Design in Next.js](https://khalilstemmler.com/articles/software-design-architecture/domain-driven-design-intro/)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Next.js App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

---

## Conclusion

This refactoring eliminates duplicate code, reduces network hops, adds powerful client-side caching with TanStack Query, and simplifies your architecture by leveraging Next.js Server Actions. The migration can be done incrementally with moderate risk, and the benefits include better performance, maintainability, developer experience, and **significantly improved user experience** through caching and optimistic updates.

The addition of TanStack Query brings your architecture in line with the documented recommendations in `.github/copilot-instructions.md` and provides a modern, scalable foundation for future features.

**Key Insight:** Your architecture documentation already mentions TanStack Query, but it's not currently installed or used. This refactoring will implement what's documented and unlock significant performance and UX improvements.
