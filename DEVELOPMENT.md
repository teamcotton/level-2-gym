# Development Guide

## Quick Start

### Installation

```bash
# Install pnpm if not already installed
npm install -g pnpm

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
cd frontend && pnpm test -- --coverage
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
pnpm prettier --check "**/*.{js,jsx,ts,tsx,json,md,astro}"
```

### Type Checking

```bash
# Check types in frontend
cd frontend && pnpm check
```

## Database (Drizzle)

### Generate Migrations

```bash
cd frontend
pnpm drizzle-kit generate:pg
```

### Run Migrations

```bash
cd frontend
pnpm drizzle-kit push:pg
```

### Drizzle Studio (Database GUI)

```bash
cd frontend
pnpm drizzle-kit studio
```

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

## Supabase Setup

### Local Development with Docker

1. Clone the Supabase repository:

```bash
git clone --depth 1 https://github.com/supabase/supabase
```

2. Navigate to the docker directory:

```bash
cd supabase/docker
```

3. Copy the example environment file:

```bash
cp .env.example .env
```

4. Start Supabase:

```bash
docker compose up -d
```

5. Access the services:

- Supabase Studio: http://localhost:3000
- PostgreSQL: localhost:5432
- API Gateway: http://localhost:8000

See `supabase/README.md` for more details.

## Project Structure

```
level-2-gym/
├── frontend/              # Astro + React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Astro pages
│   │   ├── layouts/      # Astro layouts
│   │   ├── db/           # Drizzle schema and client
│   │   └── test/         # Test utilities and unit tests
│   ├── e2e/              # Playwright E2E tests
│   └── public/           # Static assets
├── backend/              # Backend services
│   └── src/
├── supabase/             # Supabase documentation
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

For debugging Astro pages, check the terminal output where you ran `pnpm dev`.

### Hot Reload

The development server supports hot module replacement (HMR). Changes to files will automatically reload in the browser.

## Common Issues

### Port Already in Use

If port 4321 is already in use, you can change it in `frontend/astro.config.mjs`:

```javascript
export default defineConfig({
  server: {
    port: 3000,
  },
  // ... rest of config
})
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

- [Astro Documentation](https://docs.astro.build/)
- [React Documentation](https://react.dev/)
- [Material UI Documentation](https://mui.com/)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [PNPM Documentation](https://pnpm.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [AI SDK Documentation](https://sdk.vercel.ai/docs)
