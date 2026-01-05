# Level 2 Gym - AI Agent Instructions

## Architecture Overview

This is a **Turborepo monorepo** with PNPM workspaces containing:

- **frontend/**: Next.js 16 with React 19, Material UI 7, Drizzle ORM, AI SDK v5 integration, **Domain-Driven Design (DDD) architecture**
- **backend/**: Fastify TypeScript API server (port 3000)
- **PostgreSQL**: Docker-based PostgreSQL 18.1 database (port 5432)

Key architectural decisions:

- Next.js 16 App Router with Server/Client Components
- **Domain-Driven Design** with clear separation of concerns across 4 layers
- React components use `'use client'` directive for client-side interactivity
- Database logic in `frontend/src/infrastructure/` following DDD principles
- PostgreSQL accessed via Drizzle ORM with `postgres` driver

## Domain-Driven Design Architecture

The frontend follows a **4-layer DDD architecture**. Always organize code into these layers:

### 1. Domain Layer (`src/domain/`)

**Purpose**: Core business logic (pure functions, entities, value objects)

**Contains**:

- **Entities**: Objects with identity (e.g., User)
- **Value Objects**: Self-contained types with validation (e.g., Email)
- **Schemas**: Defined using Zod for typing and validation

**Example structure**:

```
src/domain/
  ├── user/
  │   ├── user.ts          # UserSchema, NewUserSchema, types
  │   └── valueObjects/
  │       └── email.ts      # EmailSchema, validateEmail()
```

**Rules**:

- Must be framework-agnostic (no React, Next.js, or UI imports)
- Use Zod schemas for validation and type inference
- Pure functions only, no side effects
- Value objects encapsulate validation logic

### 2. Application Layer (`src/application/`)

**Purpose**: Application-level use cases and orchestration

**Contains**:

- **Use Cases**: Specific operations (e.g., createUser, getAllUsers)
- **Services**: Business logic that doesn't belong to a single entity

**Example structure**:

```
src/application/
  ├── userService.ts       # prepareUser(), domain logic
  └── createUser.ts        # createUser(), getAllUsers()
```

**Rules**:

- Coordinates domain and infrastructure layers
- No knowledge of UI or HTTP details
- Orchestrates business flows
- Calls infrastructure for I/O operations

### 3. Infrastructure Layer (`src/infrastructure/`)

**Purpose**: External I/O (API, database, third-party services)

**Contains**:

- **API clients**: Axios instances, HTTP requests
- **Repositories**: Data access abstractions
- **Database**: Drizzle schema and client configuration

**Example structure**:

```
src/infrastructure/
  ├── axiosInstance.ts     # Axios config
  ├── userApi.ts           # API repository (create, getAll)
  └── db/
      ├── schema.ts        # Drizzle table definitions
      └── index.ts         # Database client export
```

**Rules**:

- No business logic, only I/O operations
- Implements interfaces expected by application layer
- Handles API calls, database queries, external services

### 4. View Layer (`src/view/`)

**Purpose**: Presentation logic and UI components

**Contains**:

- **Components** (`components/`): "Dumb" presentational components
- **Hooks** (`hooks/`): Custom React hooks for UI logic
- **Pages** (`app/`): Next.js App Router pages (orchestration only)

**Example structure**:

```
src/view/
  ├── components/
  │   ├── UserForm.tsx     # Renders form, uses hook
  │   └── UserList.tsx     # Renders list, uses hook
  └── hooks/
      ├── useUserForm.ts   # Form logic, mutations
      └── useUserList.ts   # Data fetching with React Query
```

**Rules**:

- Components are presentation-only (no logic)
- All behavior comes from hooks
- Hooks use `@tanstack/react-query` for data fetching
- Components must have `'use client'` directive if using hooks/state
- Next.js pages in `src/app/` are minimal and declarative

### DDD Layer Dependencies

```
Domain ← Application ← Infrastructure
   ↑         ↑
   └─────────┴──── View
```

- **Domain** has no dependencies (pure business logic)
- **Application** depends on Domain only
- **Infrastructure** implements contracts from Application
- **View** can use Application and Domain (via hooks)

## Development Workflows

### Package Manager

**Always use `pnpm`**, never npm/yarn. This is enforced by `"packageManager": "pnpm@8.15.0"`.

**Root package.json uses `"type": "module"`** - All `.js` files are treated as ESM, including config files.

### Running Commands

```bash
# From root - runs across all workspaces via Turborepo
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm lint         # Lint all workspaces
pnpm test         # Run all tests
pnpm typecheck    # TypeScript type checking (no emit)
pnpm format       # Format code with Prettier

# Frontend-specific (cd frontend first)
pnpm dev          # Next.js dev server on :4321
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests (auto-starts dev server)
pnpm build        # Next.js production build
pnpm start        # Start production server on :4321
pnpm typecheck    # TypeScript type checking (no emit)

# Backend-specific (cd backend first)
pnpm dev          # Fastify server with tsx watch on :3000
pnpm build        # Compile TypeScript to dist/
pnpm start        # Run compiled server from dist/
pnpm test         # Vitest unit tests
pnpm typecheck    # TypeScript type checking (no emit)
```

### Git Hooks (Husky)

**Commit-msg hook** (validates commit message format):

- Enforces Conventional Commits specification (https://www.conventionalcommits.org/)
- Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Format: `type(scope): subject` or `type: subject`
- Example: `feat(auth): add login functionality` or `fix: resolve navigation bug`

**Pre-commit hook** (runs before each commit):

- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint all workspaces
- `pnpm run typecheck` - TypeScript type checking

**Pre-push hook** (runs before pushing to remote):

- `pnpm run format` - Format code with Prettier
- `pnpm run lint` - Lint all workspaces
- `pnpm run typecheck` - TypeScript type checking
- `pnpm run test` - Run all unit tests
- `pnpm run test:e2e` - Run E2E tests (skipped if `SKIP_E2E=1` is set)

To skip E2E tests during pre-push (useful for CI or automated environments), set `SKIP_E2E=1`:

```bash
SKIP_E2E=1 git push
```

Hooks are managed by Husky and located in `.husky/` directory.

### Testing Strategy

- **Frontend Unit tests (Vitest)**: Located in `frontend/src/test/`, use `@testing-library/jest-dom`
- **Frontend E2E tests (Playwright)**: Located in `frontend/e2e/`, run against dev server on port 4321
- **Backend Unit tests (Vitest)**: Located in `backend/test/`, test Fastify routes using `app.inject()`
- \*\*Backend AI evals testing(evalite): Located in `backend/evals/`, use Vitest for evaluation scripts
- Tests excluded from coverage: `node_modules`, `dist`, `e2e` directories
- Playwright config runs chromium/firefox/webkit with retry logic in CI
- Backend uses Fastify's built-in testing utilities for route testing

### Database Workflows

Drizzle ORM uses environment variables from `frontend/.env`:

```bash
# Generate migration from schema changes
cd frontend && pnpm drizzle-kit generate:pg

# Apply migrations
cd frontend && pnpm drizzle-kit push:pg

# Open Drizzle Studio GUI
cd frontend && pnpm drizzle-kit studio
```

Schema defined in `frontend/src/db/schema.ts` using `drizzle-orm/pg-core`.  
Client configured in `frontend/src/db/index.ts` using `import.meta.env.DATABASE_URL`.

## Project-Specific Conventions

### File Organization

**Frontend (DDD Architecture):**

- **Domain**: `frontend/src/domain/` - Entities, value objects, Zod schemas
- **Application**: `frontend/src/application/` - Use cases, services
- **Infrastructure**: `frontend/src/infrastructure/` - API clients, database
  - Database: `frontend/src/infrastructure/db/schema.ts` for tables, `index.ts` for client
- **View**:
  - Components: `frontend/src/view/components/*.tsx` - Presentational React components
  - Hooks: `frontend/src/view/hooks/*.ts` - Custom React hooks with UI logic
  - Pages: `frontend/src/app/` - Next.js App Router pages (minimal orchestration)
- **Database**: `frontend/src/infrastructure/db/schema.ts` for tables, `index.ts` for client export

**Backend:**

- **Server**: `backend/src/index.ts` - Fastify server entry point
- **App**: `backend/src/app.ts` - Fastify app factory (exported for testing)
- **Tests**: `backend/test/*.test.ts` - Vitest unit tests
- **Prettier**: 100 char line length, single quotes, 2 space tabs, trailing commas (ES5), LF endings, **no semicolons**
- **ESLint 9**: Unified flat config at root `eslint.config.ts` (TypeScript) extended by frontend and backend
  - Frontend: TypeScript, React, Next.js, accessibility plugins (see `frontend/eslint.config.ts`)
  - Backend: Basic ESLint rules for Node.js (see `backend/eslint.config.ts`)
  - Uses new flat config format (not legacy `.eslintrc.*`)
- React imports not required (`'react/react-in-jsx-scope': 'off'`)
- Unused vars prefixed with `_` allowed (`argsIgnorePattern: '^_'`)
- Next.js-specific rules enabled via `@next/eslint-plugin-next`
- Console statements warn at root level, but allowed in backendt.config.js`)
  - Uses new flat config format (not legacy `.eslintrc.*`)
- React imports not required (`'react/react-in-jsx-scope': 'off'`)

### Environment Variables

**Frontend uses Next.js `process.env` pattern:**

- Public vars: `NEXT_PUBLIC_*` (exposed to browser)
- Private vars: `DATABASE_URL`, `GOOGLE_API_KEY`, `DB_HOST`, etc. (server-only)
- Example file: `frontend/.env.example` - copy to `.env.local` before development

### AI SDK Integration

Google Gemini via `@ai-sdk/google` and `ai` packages:

```typescript
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

const { text } = await generateText({
  model: google('models/gemini-pro'),
  prompt: 'Your prompt',
})
```

### Database Connection

- **Driver**: `postgres` driver via Drizzle ORM
- **Connection string**: Reads from `process.env.DATABASE_URL` or defaults to `postgresql://postgres:postgres@localhost:5432/norbertsSpark`
- **Docker setup**: PostgreSQL 18.1 runs in Docker (see `DOCKER_POSTGRES.md`), exposed on port 5432
- **Location**: Database client in `frontend/src/infrastructure/db/index.ts` following DDD architecture

### Next.js + React Integration

- Next.js 16 App Router with TypeScript
- Use `'use client'` directive for components with state, hooks, or event handlers
- Server Components are default (no directive needed)
- Material UI components require `'use client'` (use in view layer only)
- React Query (`@tanstack/react-query`) for data fetching in hooks
- Material UI theme configured in `src/app/ThemeRegistry.tsx`

### Turborepo Task Pipeline

Defined in `turbo.json`:

- `build` depends on `^build` (topological order), outputs to `dist/`, `.next/`
- `dev` is persistent (doesn't exit), no caching

## Common Pitfalls

1. **Don't use npm/yarn** - PNPM workspace required for monorepo
2. **Backend uses tsx for dev** - Backend runs TypeScript directly via `tsx watch` in development, compiles to `dist/` for production
3. **Follow DDD layers strictly** - Don't mix concerns across domain/application/infrastructure/view
4. **Next.js env vars** - Use `process.env`, not `import.meta.env`
5. **Client components** - Must add `'use client'` directive for hooks, state, or event handlers
6. **Playwright needs dev server** - Config auto-starts it, but tests fail if port 4321 is blocked
7. **ESLint 9 flat config** - Root `eslint.config.ts` (TypeScript) is base, frontend/backend extend it
8. **TypeScript ESLint rules** - Frontend uses TypeScript ESLint; disable base `no-unused-vars` to avoid conflicts
9. **ESM configs** - All config files use ESM exports (`export default`) since root has `"type": "module"`
10. **No .eslintignore** - ESLint 9 uses `ignores` property in config file, not `.eslintignore`
11. **Zod for validation** - Always use Zod schemas in domain layer, infer types with `z.infer<>`

## Key Files Reference

- `turbo.json` - Build orchestration and caching config
- `pnpm-workspace.yaml` - Workspace packages definition
- `frontend/next.config.ts` - Next.js framework configuration
- `frontend/drizzle.config.ts` - Database migration settings
- `eslint.config.ts` - Root ESLint 9 flat config (base rules)
- `frontend/eslint.config.ts` - Frontend linting (TypeScript, React, Next.js, accessibility)
- `backend/eslint.config.ts` - Backend linting (extends root)
- `backend/tsconfig.json` - TypeScript config (ESNext, bundler resolution)
- `backend/src/index.ts` - Fastify server with routes (/, /health)
- `.prettierrc` - Code formatting rules (no semicolons)
- `DEVELOPMENT.md` - Detailed developer workflows and troubleshooting
- `frontend/src/domain/*/readme.txt` - DDD layer documentation
- `frontend/src/app/ThemeRegistry.tsx` - Material UI theme provider
