# Level 2 Gym - Monorepo

A modern full-stack monorepo built with PNPM and Turborepo.

## Architecture

This project is a monorepo with the following structure:

- **frontend**: Astro framework with React and Material UI
- **backend**: Backend services (to be implemented)
- **supabase**: Self-hosted Supabase with Docker for PostgreSQL support

## Tech Stack

### Frontend
- **Framework**: [Astro](https://astro.build/) with React
- **UI Library**: [Material UI](https://mui.com/)
- **AI Integration**: [@ai-sdk/google](https://www.npmjs.com/package/@ai-sdk/google) and [ai](https://www.npmjs.com/package/ai)
- **Database ORM**: [Drizzle](https://orm.drizzle.team/)
- **Code Quality**: ESLint, Prettier
- **Testing**:
  - Unit Tests: [Vitest](https://vitest.dev/)
  - E2E Tests: [Playwright](https://playwright.dev/)

### Monorepo Tools
- **Package Manager**: [PNPM](https://pnpm.io/)
- **Build System**: [Turborepo](https://turbo.build/)

### Database
- **PostgreSQL**: Self-hosted via [Supabase](https://supabase.com/docs/guides/self-hosting/docker)

## Prerequisites

- Node.js >= 18
- PNPM >= 8
- Docker and Docker Compose (for Supabase)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file in the frontend:

```bash
cp frontend/.env.example frontend/.env
```

Update the values in `frontend/.env` with your configuration.

### 3. Start Supabase (Optional)

Follow the instructions in `supabase/README.md` to set up the self-hosted Supabase instance.

### 4. Development

Run all workspaces in development mode:

```bash
pnpm dev
```

Or run individual workspaces:

```bash
# Frontend only
cd frontend && pnpm dev

# Backend only
cd backend && pnpm dev
```

### 5. Build

Build all workspaces:

```bash
pnpm build
```

## Available Scripts

- `pnpm dev` - Start development servers for all workspaces
- `pnpm build` - Build all workspaces
- `pnpm lint` - Run linting across all workspaces
- `pnpm test` - Run tests across all workspaces
- `pnpm format` - Format code with Prettier

## Frontend Development

The frontend is built with Astro and React. Key features:

- **Static Site Generation**: Astro provides excellent performance
- **React Components**: Use React for interactive components
- **Material UI**: Pre-built UI components
- **AI Integration**: Ready for AI-powered features
- **Database**: Drizzle ORM for type-safe database queries

### Running Tests

```bash
cd frontend

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e
```

## Project Structure

```
level-2-gym/
├── frontend/           # Astro + React frontend
│   ├── src/
│   │   ├── pages/     # Astro pages
│   │   ├── components/# React components
│   │   ├── layouts/   # Astro layouts
│   │   ├── db/        # Drizzle schema and client
│   │   └── test/      # Test utilities
│   ├── e2e/           # Playwright E2E tests
│   └── public/        # Static assets
├── backend/           # Backend services
│   └── src/
├── supabase/          # Supabase Docker setup
├── turbo.json         # Turborepo configuration
├── pnpm-workspace.yaml# PNPM workspace configuration
└── package.json       # Root package.json
```

## Contributing

1. Create a new branch
2. Make your changes
3. Run linting and tests
4. Submit a pull request

## License

MIT