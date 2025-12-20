# Authentication Utilities Usage Examples

This document provides examples of how to use the authentication utilities provided in `auth.ts`.

## Table of Contents

- [Basic Auth Utilities](#basic-auth-utilities)
- [Higher-Order Functions](#higher-order-functions)
- [Server Actions Examples](#server-actions-examples)

## Basic Auth Utilities

### getAuthToken()

Get the JWT access token from the current session.

```typescript
import { getAuthToken } from '@/lib/auth'

export async function fetchProtectedData() {
  'use server'

  const token = await getAuthToken()

  if (!token) {
    throw new Error('Unauthorized')
  }

  const response = await fetch(`${process.env.BACKEND_URL}/api/data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}
```

### requireAuth()

Ensure user is authenticated, throws error if not.

```typescript
import { requireAuth } from '@/lib/auth'

export async function protectedAction() {
  'use server'

  const session = await requireAuth()

  // Session is guaranteed to exist here
  console.log('User ID:', session.user.id)

  return { success: true }
}
```

### requireRole()

Ensure user has a specific role.

```typescript
import { requireRole } from '@/lib/auth'

export async function adminAction() {
  'use server'

  const session = await requireRole('admin')

  // User is guaranteed to be an admin here
  return { success: true }
}
```

## Higher-Order Functions

### withAuth()

Wrap Server Actions with automatic authentication checks.

#### Basic Usage

```typescript
import { withAuth } from '@/lib/auth'
import type { Session } from 'next-auth'

// Define your action logic
async function getUserProfileAction(session: Session, userId: string) {
  'use server'

  // Access session properties
  const currentUserId = session.user.id
  const token = session.accessToken

  // Fetch data from backend
  const response = await fetch(`${process.env.BACKEND_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

// Wrap it with authentication
export const getUserProfile = withAuth(getUserProfileAction)
```

#### Usage in Component

```typescript
'use client'

import { getUserProfile } from '@/actions/user'

export default function ProfilePage() {
  const handleClick = async () => {
    try {
      const profile = await getUserProfile('user-123')
      console.log(profile)
    } catch (error) {
      // Will catch "Unauthorized - Please sign in" if not authenticated
      console.error(error)
    }
  }

  return <button onClick={handleClick}>Get Profile</button>
}
```

### withRole()

Wrap Server Actions with role-based authentication checks.

#### Single Role

```typescript
import { withRole } from '@/lib/auth'
import type { Session } from 'next-auth'

// Define admin-only action
async function deleteUserAction(session: Session, userId: string) {
  'use server'

  const token = session.accessToken

  await fetch(`${process.env.BACKEND_URL}/users/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return { success: true }
}

// Wrap with admin role requirement
export const deleteUser = withRole('admin', deleteUserAction)
```

#### Multiple Roles

```typescript
import { withRole } from '@/lib/auth'
import type { Session } from 'next-auth'

// Define action that requires admin OR moderator role
async function moderateContentAction(session: Session, contentId: string, action: string) {
  'use server'

  const token = session.accessToken

  await fetch(`${process.env.BACKEND_URL}/content/${contentId}/moderate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action }),
  })

  return { success: true }
}

// Wrap with multiple role options (user needs ONE of these roles)
export const moderateContent = withRole(['admin', 'moderator'], moderateContentAction)
```

## Server Actions Examples

### Example 1: Protected User Update

```typescript
// app/actions/updateProfile.ts
'use server'

import { withAuth } from '@/lib/auth'
import type { Session } from 'next-auth'

interface UpdateProfileData {
  name: string
  email: string
}

async function updateProfileAction(session: Session, data: UpdateProfileData) {
  const token = session.accessToken
  const userId = session.user.id

  const response = await fetch(`${process.env.BACKEND_URL}/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Failed to update profile')
  }

  return { success: true, data: await response.json() }
}

export const updateProfile = withAuth(updateProfileAction)
```

### Example 2: Admin Dashboard Data

```typescript
// app/actions/adminActions.ts
'use server'

import { withRole } from '@/lib/auth'
import type { Session } from 'next-auth'

async function getAdminStatsAction(session: Session) {
  const token = session.accessToken

  const response = await fetch(`${process.env.BACKEND_URL}/admin/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const getAdminStats = withRole('admin', getAdminStatsAction)
```

### Example 3: Multi-Role Content Management

```typescript
// app/actions/contentActions.ts
'use server'

import { withRole } from '@/lib/auth'
import type { Session } from 'next-auth'

interface CreateContentData {
  title: string
  body: string
}

async function createContentAction(session: Session, data: CreateContentData) {
  const token = session.accessToken
  const userId = session.user.id

  const response = await fetch(`${process.env.BACKEND_URL}/content`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...data,
      authorId: userId,
    }),
  })

  return { success: true, data: await response.json() }
}

// Only admins, editors, or authors can create content
export const createContent = withRole(['admin', 'editor', 'author'], createContentAction)
```

### Example 4: Combining with TanStack Query

```typescript
// app/actions/userActions.ts
'use server'

import { withAuth } from '@/lib/auth'
import type { Session } from 'next-auth'

async function getCurrentUserAction(session: Session) {
  const token = session.accessToken
  const userId = session.user.id

  const response = await fetch(`${process.env.BACKEND_URL}/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response.json()
}

export const getCurrentUser = withAuth(getCurrentUserAction)
```

```typescript
// app/hooks/useCurrentUser.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/actions/userActions'

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

```typescript
// app/components/UserProfile.tsx
'use client'

import { useCurrentUser } from '@/hooks/useCurrentUser'

export function UserProfile() {
  const { data: user, isLoading, error } = useCurrentUser()

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  )
}
```

## Error Handling

All authentication utilities throw specific errors that can be caught and handled:

```typescript
'use client'

import { someProtectedAction } from '@/actions/protectedActions'

async function handleAction() {
  try {
    await someProtectedAction()
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        // Redirect to login
        window.location.href = '/login'
      } else if (error.message.includes('Forbidden')) {
        // Show permission error
        alert('You do not have permission to perform this action')
      } else {
        // Handle other errors
        console.error(error)
      }
    }
  }
}
```

## Best Practices

1. **Use `withAuth` for all protected Server Actions** - This ensures consistent authentication checks
2. **Use `withRole` for role-based actions** - Automatically handles both authentication and authorization
3. **Access session properties in wrapped functions** - The session is passed as the first argument
4. **Combine with TanStack Query** - Use these utilities with React Query for automatic caching and refetching
5. **Handle errors appropriately** - Catch authentication errors and redirect to login when needed

## Migration from Old Patterns

### Before (Manual Auth Check)

```typescript
export async function protectedAction(data: any) {
  'use server'

  const session = await getServerSession(authOptions)
  if (!session) {
    throw new Error('Unauthorized')
  }

  const token = session.accessToken
  // ... rest of logic
}
```

### After (Using withAuth)

```typescript
import { withAuth } from '@/lib/auth'

async function protectedActionLogic(session: Session, data: any) {
  'use server'

  const token = session.accessToken
  // ... rest of logic
}

export const protectedAction = withAuth(protectedActionLogic)
```

This approach is:

- ✅ More concise
- ✅ More type-safe
- ✅ Easier to test
- ✅ Consistent across the codebase
