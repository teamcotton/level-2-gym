Frontend UI Components Architecture (DDD)

This project uses **Domain-Driven Design (DDD)** for the frontend, organized into four layers:

1. **Domain Layer (`src/domain/`)**
   - Pure business logic, entities, value objects, Zod schemas
   - No React, Next.js, or UI code

2. **Application Layer (`src/application/`)**
   - Use cases and services orchestrating domain logic
   - No direct I/O or UI code

3. **Infrastructure Layer (`src/infrastructure/`)**
   - API clients, repositories, database access (Drizzle ORM)
   - Implements contracts for application layer

4. **View Layer (`src/view/`)**
   - Presentation/UI logic only
   - Components in `src/view/components/`
   - Custom hooks in `src/view/hooks/`
   - Uses React Query (`@tanstack/react-query`) for data fetching/state
   - Material UI (`@mui/material`) for styling and UI components
   - No Redux, no `.scss` files

### Example View Layer Structure

```
src/view/
  ├── components/
  │   ├── UserForm.tsx     # Presentational component
  │   └── UserList.tsx     # Presentational component
  └── hooks/
      ├── useUserForm.ts   # Form logic, mutations
      └── useUserList.ts   # Data fetching with React Query
```

### Guidelines for UI Components

- Components are "dumb" and presentational; all logic is in hooks
- Use `'use client'` directive for components with state/hooks
- Style components with Material UI, not `.scss` files
- Data fetching and mutations use React Query in hooks
- Organize code strictly by DDD layers; do not mix concerns

For more details, see `DEVELOPMENT.md` and the coding guidelines (CodingGuidelineID: 1000000).
