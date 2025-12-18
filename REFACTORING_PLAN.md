# Next.js Architecture Refactoring Plan

## Current Architecture Analysis

### Current Flow (Duplicate Code Path)

```
Client Component (Browser)
    ↓
Client Hook (useRegistrationForm.ts)
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

---

## Proposed Architecture

### Option 1: Server Actions (Recommended for Next.js 13+)

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

**Trade-offs:**

- Server Actions must be serializable (no class instances, functions, etc.)
- Requires Next.js 13.4+ with App Router
- Different mental model from traditional REST APIs

---

### Option 2: Server Components + Data Fetching

```
Server Component (RSC)
    ↓
Direct Backend API Call (fetch in Server Component)
    ↓
Backend Fastify API
    ↓
Render on server, stream to client
```

**Benefits:**

- Zero client-side JavaScript for data fetching
- Server-side rendering with fresh data
- Direct backend communication
- No intermediate API routes

**Trade-offs:**

- Requires page-level refactor (not hook-based)
- Client interactivity needs separate client components
- Form submissions require Server Actions or API routes

---

### Option 3: Unified API Client (Infrastructure Layer)

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

---

## Recommended Refactoring Steps

### Phase 1: Migrate to Server Actions (Primary Strategy)

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

import { logger } from '@/application/services/log-layer.server.js'
import type { RegisterUserData, RegisterUserResponse } from '@/domain/auth/index.js'

export async function registerUserAction(data: RegisterUserData): Promise<RegisterUserResponse> {
  // Direct backend call - no intermediate API route
  // SSL handling logic moved here
  // Single source of error handling
}
```

**Benefits:**

- Eliminates `/app/api/register/route.ts` entirely
- Direct server-to-server communication
- Single error handling location
- Type-safe without manual JSON parsing

---

#### Step 2: Update Client Hooks to Use Server Actions

**Files to Modify:**

- `apps/frontend/src/view/hooks/useRegistrationForm.ts`
- `apps/frontend/src/view/hooks/useAdminPage.ts`

**Key Changes:**

```typescript
// apps/frontend/src/view/hooks/useRegistrationForm.ts
import { registerUserAction } from '@/application/actions/server/registerUser.server.js'

export function useRegistrationForm() {
  // ... existing state management

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (validateForm()) {
      setIsSubmitting(true)
      try {
        // Direct call to Server Action - no fetch needed
        const result = await registerUserAction(formData)

        // Server Action handles all backend communication
        // Error handling simplified - single source of truth
        if (result.success) {
          // Success handling
        } else {
          // Map server errors to UI errors
        }
      } finally {
        setIsSubmitting(false)
      }
    }
  }
}
```

**Benefits:**

- Remove `apps/frontend/src/application/actions/registerUser.ts` (fetch-based)
- Hooks directly call Server Actions
- No client-side fetch boilerplate

---

#### Step 3: Centralize Backend Communication Logic

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

#### Step 4: Implement Consistent Error Handling

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

#### Step 5: Update Tests

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

### Phase 2: Migrate Data Fetching to Server Components (Optional Enhancement)

#### Step 6: Convert Admin Page to Server Component

**Files to Modify:**

- `apps/frontend/src/app/admin/page.tsx` - Convert to Server Component

**Key Changes:**

```typescript
// apps/frontend/src/app/admin/page.tsx
// Remove 'use client' directive

import { findAllUsersAction } from '@/application/actions/server/findAllUsers.server.js'

export default async function AdminPage() {
  // Fetch data on server
  const usersResult = await findAllUsersAction({ limit: 100, offset: 0 })

  // Pass data to client component for interactivity
  return <AdminClientComponent initialData={usersResult} />
}
```

**Files to Create:**

- `apps/frontend/src/view/components/AdminClientComponent.tsx` - Client-side table interactions

**Benefits:**

- Initial data fetched on server (faster first paint)
- SEO-friendly (if needed)
- Reduced client JavaScript bundle
- Pagination/filtering via Server Actions

---

### Phase 3: Clean Up Old Code

#### Step 7: Remove Deprecated Files

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
- [ ] Create feature branch: `git checkout -b refactor/server-actions`
- [ ] Run all tests to establish baseline: `pnpm run test`

### Phase 1: Server Actions Setup

- [ ] Create `apps/frontend/src/infrastructure/backend/backendClient.server.ts`
- [ ] Create `apps/frontend/src/application/errors/apiErrors.ts`
- [ ] Create `apps/frontend/src/application/errors/errorMapper.ts`
- [ ] Create `apps/frontend/src/application/actions/server/registerUser.server.ts`
- [ ] Create `apps/frontend/src/application/actions/server/findAllUsers.server.ts`
- [ ] Write tests for new infrastructure layer
- [ ] Run tests: `pnpm test:unit`

### Phase 2: Update Hooks

- [ ] Update `useRegistrationForm.ts` to use Server Action
- [ ] Update `useAdminPage.ts` to use Server Action
- [ ] Run tests: `pnpm test:unit`
- [ ] Manual testing: Registration flow
- [ ] Manual testing: Admin page

### Phase 3: Clean Up

- [ ] Delete old API routes (`apps/frontend/src/app/api/register/route.ts`, `apps/frontend/src/app/api/users/route.ts`)
- [ ] Delete old actions (`registerUser.ts`, `findAllUsers.ts`)
- [ ] Delete old tests
- [ ] Remove `NEXT_PUBLIC_BASE_URL` references
- [ ] Run full test suite: `pnpm run test`
- [ ] Run linter: `pnpm run lint`
- [ ] Run type checker: `pnpm run typecheck`

### Phase 4: E2E Validation

- [ ] Run E2E tests: `pnpm test:e2e`
- [ ] Test registration flow end-to-end
- [ ] Test admin page with pagination
- [ ] Test error scenarios (duplicate email, network errors)
- [ ] Verify SSL certificate handling in development

### Phase 5: Documentation

- [ ] Update `DEVELOPMENT.md`
- [ ] Update `.github/copilot-instructions.md`
- [ ] Update `README.md`
- [ ] Add migration notes to commit message
- [ ] Create PR with detailed description

---

## Expected Outcomes

### Performance Improvements

- **Reduced Latency**: Eliminate one network hop (Client → API Route removed)
- **Smaller Bundle**: Remove client-side fetch boilerplate (~2-3 KB)
- **Faster Execution**: Server-to-server calls are faster than server-to-client-to-server

### Code Quality Improvements

- **Lines of Code Removed**: ~200-300 lines (API routes + duplicate actions)
- **Test Files Reduced**: 4 test files consolidated to 2
- **Cyclomatic Complexity**: Lower complexity (single error handling path)
- **Type Safety**: End-to-end type safety without manual JSON parsing

### Developer Experience Improvements

- **Single Source of Truth**: Error handling in one place
- **Easier Debugging**: Fewer layers to trace through
- **Simpler Mental Model**: Direct server-to-backend calls
- **Better DRY Compliance**: No duplicate fetch/error logic

### Maintainability Improvements

- **Fewer Files**: Less code to maintain and update
- **Clearer Architecture**: Follows Next.js best practices
- **Future-Proof**: Aligned with Next.js 13+ patterns
- **Testability**: Easier to mock and test (fewer integration points)

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

### 6. Revised Migration Phases

**Phase 1: Authentication Infrastructure (Week 1)**

1. Install next-auth: `pnpm add next-auth`
2. Configure JWT provider
3. Create auth utilities (`withAuth`, `getAuthToken`)
4. Update middleware for auth checks
5. Add rate limiting middleware

**Phase 2: Server Actions with Auth (Week 2)**

1. Migrate `registerUser` (public, no auth)
2. Migrate `getAllUsers` (protected, requires auth)
3. Add proper error handling for auth failures
4. Test auth flow end-to-end

**Phase 3: Real-Time Updates (Week 3)**

1. Create SSE route `/api/stream`
2. Connect to backend WebSocket
3. Update client hooks to consume SSE
4. Test real-time data flow

**Phase 4: Cleanup & Optimization (Week 4)**

1. Remove old API routes
2. Add rate limiting analytics
3. Performance testing
4. Documentation

**Phase 5: AWS Migration Prep (Future)**

1. Test standalone build
2. Create Dockerfile
3. Document environment variables
4. Plan infrastructure (ECS, Lambda, etc.)

### 7. Required Dependencies

```bash
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

**Recommended Timeline:**

- Week 1: Auth infrastructure + rate limiting
- Week 2: Server Actions migration (with auth)
- Week 3: Real-time updates (SSE)
- Week 4: Testing + cleanup
- **Total: 4 weeks** (more thorough than initial estimate due to auth/real-time requirements)

### 9. Alternative: Keep API Routes for Real-Time

If Server Actions + SSE is too complex, consider:

**Hybrid Approach:**

- Use **Server Actions** for mutations (registerUser)
- Keep **API Routes** for real-time SSE/WebSocket
- Maintain current architecture for real-time features

This reduces migration scope but keeps some API routes.

---

## Final Recommendation

Based on your requirements:

✅ **Server Actions** for mutations (with JWT auth)  
✅ **SSE via API Route** for real-time updates  
✅ **Next.js Middleware** for rate limiting  
✅ **Standalone build mode** for AWS portability  
✅ **4-week timeline** (extended for auth/real-time work)

This approach balances modern Next.js patterns with your specific needs for auth, real-time updates, and future AWS migration.

**Estimated Effort:** 4 weeks for full migration with auth, real-time, and rate limiting
