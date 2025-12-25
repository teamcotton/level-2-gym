# Norbert's Spark - an AI tools CRM

A modern full-stack monorepo built with PNPM and Turborepo.

## Architecture

This project is a monorepo with the following structure:

- **frontend**: Next.js framework with React 19 and Material UI
- **backend**: Fastify TypeScript API server
- **PostgreSQL**: Docker-based PostgreSQL 18.1 database

## Tech Stack

### Frontend

- **Framework**: [Next.js 16](https://nextjs.org/) with React 19
- **UI Library**: [Material UI 7](https://mui.com/) with Emotion
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

- **PostgreSQL 18.1**: Docker-based PostgreSQL instance

## Prerequisites

- Node.js >= 18
- PNPM >= 8
- Docker and Docker Compose (for PostgreSQL)

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment Variables

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

Update the values in `.env` with your configuration.

### 3. Start PostgreSQL

Start the PostgreSQL database:

```bash
cd backend
docker compose up -d
```

See `DOCKER_POSTGRES.md` for detailed database setup instructions.

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

The frontend is built with Next.js and React 19. Key features:

- **App Router**: Next.js 16's powerful routing system
- **Server & Client Components**: Optimal performance with RSC
- **Material UI**: Pre-built UI components with dark theme
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
norberts-spark/
├── frontend/           # Next.js + React frontend
│   ├── src/
│   │   ├── app/       # Next.js App Router
│   │   ├── view/      # View layer (components, hooks)
│   │   ├── domain/    # Domain layer (entities, schemas)
│   │   ├── application/ # Application layer (use cases)
│   │   ├── infrastructure/ # Infrastructure layer (DB, API)
│   │   └── test/      # Test utilities
│   ├── e2e/           # Playwright E2E tests
│   └── public/        # Static assets
├── backend/           # Fastify TypeScript API
│   ├── src/
│   ├── docker-compose.yml  # PostgreSQL Docker configuration
│   ├── init-scripts/       # PostgreSQL initialization scripts
│   └── .env.example        # Environment variables template
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

AGPLv3
