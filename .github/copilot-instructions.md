# Level 2 Gym - AI Agent Instructions

## Architecture Overview

This is a **Turborepo monorepo** with PNPM workspaces containing:
- **frontend/**: Astro 5 SSG with React 19 islands, Material UI 7, Drizzle ORM, AI SDK v5 integration
- **backend/**: Minimal placeholder (not yet implemented)
- **supabase/**: Docker-based self-hosted PostgreSQL documentation

Key architectural decisions:
- Astro uses `output: 'static'` for static site generation
- React components are "islands" for interactive UI (use `.tsx` files in `components/`)
- Database logic lives in frontend (`frontend/src/db/`) - unusual but intentional for this SSG setup
- PostgreSQL accessed via Drizzle ORM with `postgres` driver (not Supabase client)

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

# Frontend-specific (cd frontend first)
pnpm dev          # Astro dev server on :4321
pnpm test         # Vitest unit tests
pnpm test:e2e     # Playwright E2E tests (auto-starts dev server)
pnpm check        # TypeScript + Astro check
```

### Testing Strategy
- **Unit tests (Vitest)**: Located in `frontend/src/test/`, use `@testing-library/jest-dom`
- **E2E tests (Playwright)**: Located in `frontend/e2e/`, run against dev server on port 4321
- Tests excluded from coverage: `node_modules`, `dist`, `e2e` directories
- Playwright config runs chromium/firefox/webkit with retry logic in CI

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
- **Pages**: `frontend/src/pages/*.astro` - file-based routing
- **Layouts**: `frontend/src/layouts/*.astro` - shared page templates
- **Components**: `frontend/src/components/*.tsx` - React components (note `.tsx` not `.astro`)
- **Database**: `frontend/src/db/schema.ts` for tables, `index.ts` for client export

### Code Style (Enforced via ESLint + Prettier)
- **Prettier**: 100 char line length, single quotes, 2 space tabs, trailing commas (ES5), LF endings
- **ESLint 9**: Unified flat config at root `eslint.config.js` (ESM) extended by frontend and backend
  - Frontend: TypeScript, React, Astro plugins (see `frontend/eslint.config.js`)
  - Backend: Basic ESLint rules for Node.js (see `backend/eslint.config.js`)
  - Uses new flat config format (not legacy `.eslintrc.*`)
- React imports not required (`'react/react-in-jsx-scope': 'off'`)
- Unused vars prefixed with `_` allowed (`argsIgnorePattern: '^_'`)
- Astro files have React rules disabled (`react/no-unknown-property: 'off'`)
- Console statements warn at root level, but allowed in backend

### Environment Variables
**Frontend uses Astro's `import.meta.env` pattern:**
- Public vars: `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (exposed to browser)
- Private vars: `DATABASE_URL`, `GOOGLE_API_KEY`, `DB_HOST`, etc. (server-only)
- Example file: `frontend/.env.example` - copy to `.env` before development

### AI SDK Integration
Google Gemini via `@ai-sdk/google` and `ai` packages:
```typescript
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

const { text } = await generateText({
  model: google('models/gemini-pro'),
  prompt: 'Your prompt',
});
```
Requires `GOOGLE_API_KEY` in frontend `.env`.

## Integration Points

### Database Connection
- **Driver**: `postgres` (not `@supabase/supabase-js`)
- **Connection string**: Reads from `import.meta.env.DATABASE_URL` or defaults to `postgresql://postgres:postgres@localhost:5432/postgres`
- **Self-hosted Supabase**: Optional Docker setup (see `supabase/README.md`), exposes PostgreSQL on `:5432` and API on `:8000`

### Astro + React Integration
- React added via `@astrojs/react` integration in `astro.config.mjs`
- Use `.astro` files for static pages, `.tsx` components for interactive islands
- Material UI components work in `.tsx` files (Emotion runtime included)

### Turborepo Task Pipeline
Defined in `turbo.json`:
- `build` depends on `^build` (topological order), outputs to `dist/`, `.next/`, `.astro/`
- `dev` is persistent (doesn't exit), no caching
- `lint` depends on `^lint`
- `test` depends on `^build`, outputs coverage
- `test:e2e` has no caching (always runs fresh)

## Common Pitfalls

1. **Don't use npm/yarn** - PNPM workspace required for monorepo
2. **Backend is empty** - No actual backend implementation yet, just placeholder
3. **Database in frontend** - Unusual but correct for this SSG architecture with server endpoints
4. **Astro env vars** - Use `import.meta.env`, not `process.env` (except in config files)
5. **React components** - Must be `.tsx` files, not `.astro`, to use Material UI
6. **Playwright needs dev server** - Config auto-starts it, but tests fail if port 4321 is blocked
7. **ESLint 9 flat config** - Root `eslint.config.js` (ESM) is base, frontend/backend extend it
8. **TypeScript ESLint rules** - Frontend uses TypeScript ESLint; disable base `no-unused-vars` to avoid conflicts
9. **ESM configs** - All config files use ESM exports (`export default`) since root has `"type": "module"`
10. **No .eslintignore** - ESLint 9 uses `ignores` property in config file, not `.eslintignore`

## Key Files Reference
- `turbo.json` - Build orchestration and caching config
- `pnpm-workspace.yaml` - Workspace packages definition
- `frontend/astro.config.mjs` - Astro framework config (React integration, output mode)
- `frontend/drizzle.config.ts` - Database migration settings
- `eslint.config.js` - Root ESLint 9 flat config (base rules)
- `frontend/eslint.config.js` - Frontend linting (TypeScript, React, Astro)
- `backend/eslint.config.js` - Backend linting (extends root)
- `.prettierrc` - Code formatting rules
- `DEVELOPMENT.md` - Detailed developer workflows and troubleshooting
