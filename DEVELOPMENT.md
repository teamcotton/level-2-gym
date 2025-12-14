# Development Guide

## Quick Start

### Installation

It is recommended to use Corepack to manage pnpm versions:

## Using Corepack

Due to an issue with outdated signatures in Corepack, Corepack should be updated to its latest version first.

```bash
npm install --global corepack@latest
```

Since v16.13, Node.js is shipping Corepack for managing package managers. This is an experimental feature, so you need to enable it by running:

```bash
corepack enable pnpm
```

This will automatically install pnpm on your system.

You can pin the version of pnpm used on your project using the following command:

```bash
corepack use pnpm@latest-10
```

```bash
# Install dependencies
pnpm install
```

### Running the Development Server

```bash
# Run all workspaces
pnpm dev

# Run frontend only
cd frontend && pnpm dev

# Run backend only
cd backend && pnpm dev
```

The frontend will be available at http://localhost:4321

### Building for Production

```bash
# Build all workspaces
pnpm build

# Build frontend only
cd frontend && pnpm build

# Preview production build
cd frontend && pnpm preview
```

## Testing

### Unit Tests (Vitest)

```bash
# Run unit tests
cd frontend && pnpm test

# Run tests in watch mode
cd frontend && pnpm test

# Run tests with coverage
pnpm test:unit:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
cd frontend && npx playwright install

# Run E2E tests
cd frontend && pnpm test:e2e

# Run E2E tests in UI mode
cd frontend && npx playwright test --ui
```

## Code Quality

### Linting

```bash
# Lint all workspaces
pnpm lint

# Lint frontend only
cd frontend && pnpm lint

# Fix linting issues
cd frontend && pnpm lint --fix
```

### Formatting

```bash
# Format all files
pnpm format

# Check formatting without fixing
pnpm prettier --check "**/*.{js,jsx,ts,tsx,json,md}"
```

### Type Checking

```bash
# Check types in frontend
cd frontend && pnpm check
```

## Database (Drizzle ORM)

The project uses Drizzle ORM with PostgreSQL for database management. The schema is defined in `apps/backend/src/infrastructure/database/schema.ts` and migrations are version-controlled in `apps/backend/drizzle/`.

### Development Workflow

For rapid development and prototyping:

```bash
cd apps/backend

# Generate migration from schema changes
pnpm db:generate

# Push schema directly to database (development only)
pnpm db:push

# Drop all tables and recreate (development only)
pnpm db:reset

# Open Drizzle Studio GUI to view/edit data
pnpm db:studio
```

### Production Workflow

For production deployments, use versioned migrations:

```bash
cd apps/backend

# 1. Generate migration from schema changes
pnpm db:generate

# 2. Review generated SQL in drizzle/ folder

# 3. Commit migration files to version control
git add drizzle/
git commit -m "feat: add new schema migration"

# 4. Apply migrations to production database
pnpm db:migrate
```

### Migration Files

Migration files are stored in `apps/backend/drizzle/` and **are version-controlled** to ensure:

- Consistent schema across all environments
- Traceable database evolution history
- Safe production deployments
- Team synchronization

**Important:** Never modify migration files after they've been applied. Always generate new migrations for schema changes.

### Database Reset (Development Only)

To completely reset your development database:

```bash
cd apps/backend

# Drop all tables
pnpm db:drop

# Or drop and recreate in one command
pnpm db:reset
```

**Warning:** `db:drop` and `db:reset` are destructive operations. Never use in production!

### Drizzle Studio (Database GUI)

View and edit your database using Drizzle Studio:

```bash
cd apps/backend
pnpm db:studio
```

This opens a web interface to browse tables, run queries, and modify data.

## AI SDK (@ai-sdk/google)

The frontend includes the AI SDK with Google provider support. To use it:

1. Get a Google AI API key from https://makersuite.google.com/app/apikey
2. Add it to `frontend/.env`:

```
GOOGLE_API_KEY=your-api-key-here
```

3. Use it in your code:

```typescript
import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

const { text } = await generateText({
  model: google('models/gemini-pro'),
  prompt: 'Your prompt here',
})
```

## PostgreSQL Setup

### Local Development with Docker

1. Create your environment file:

```bash
cd backend
cp .env.example .env
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Access the database:

- PostgreSQL: localhost:5432
- Database name: level2gym
- User/Password: postgres/postgres (or as configured in .env)

See `DOCKER_POSTGRES.md` for detailed instructions.

## Project Structure

```
level-2-gym/
├── frontend/              # Next.js + React frontend
│   ├── src/
│   │   ├── app/          # Next.js App Router pages
│   │   ├── view/         # View layer (components, hooks)
│   │   ├── domain/       # Domain layer (entities, value objects)
│   │   ├── application/  # Application layer (use cases, services)
│   │   ├── infrastructure/ # Infrastructure layer (API, DB)
│   │   └── test/         # Test utilities and unit tests
│   ├── e2e/              # Playwright E2E tests
│   └── public/           # Static assets
├── backend/              # Fastify backend server
│   ├── src/
│   ├── docker-compose.yml  # PostgreSQL Docker configuration
│   ├── init-scripts/       # PostgreSQL initialization scripts
│   └── .env.example        # Environment variables template
├── turbo.json            # Turborepo configuration
├── pnpm-workspace.yaml   # PNPM workspace configuration
└── package.json          # Root package.json
```

## Tips and Tricks

### Turborepo Caching

Turborepo caches build outputs for faster builds. To clear the cache:

```bash
rm -rf .turbo
```

### Debugging

For debugging React components, you can use React DevTools browser extension.

For debugging Next.js pages, check the terminal output where you ran `pnpm dev`.

### Hot Reload

The development server supports hot module replacement (HMR). Changes to files will automatically reload in the browser.

## Common Issues

### Port Already in Use

If port 4321 is already in use, you can change it in `frontend/next.config.ts` or set the PORT environment variable:

```bash
PORT=4322 pnpm dev
```

### TypeScript Errors

If you see TypeScript errors, try:

1. Restart your editor's TypeScript server
2. Delete `node_modules` and reinstall: `pnpm install`
3. Clear Turborepo cache: `rm -rf .turbo`

### Playwright Browser Issues

If Playwright tests fail with browser errors:

```bash
cd frontend
npx playwright install
```

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Material UI Documentation](https://mui.com/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [PNPM Documentation](https://pnpm.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
