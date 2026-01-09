# Norbert's Spark - an AI tools CRM

Norbert's Spark ( named after Norbert Wiener, the father of cybernetics) is a cutting-edge AI tools CRM designed to help users manage and leverage AI technologies effectively. Built with modern web technologies, it offers a seamless experience for integrating AI capabilities into everyday workflows.

It is hihgly optimized for Next.js 16 and React 19, utilizing the latest features of these frameworks to deliver a fast and responsive user interface. The application employs Material UI 7 with Emotion for styling, functional and cohesive look and feel..

The API is documented in the backend folder using Fastify and TypeScript, providing a robust and scalable backend solution. The database layer is powered by PostgreSQL 18.1, managed through Docker for easy setup and deployment.

The OpenAPI docs are found in packages/shared/src/openapi.json, meaning that the backend could, if so desired, be separated from the frontend and the a separate UI implemented.

## Table of Contents

- [Architecture](#architecture)

The architecture in both the backend and frontend follows the principles of Clean Architecture, ensuring a clear separation of concerns and maintainability. The layers are organized as follows: - **Domain Layer**: Contains the core business logic and entities. - **Application Layer**: Manages use cases and application-specific logic. - **Infrastructure Layer**: Handles data access, external APIs, and other infrastructure concerns. - **View Layer** (Frontend only): Manages UI components and user interactions.

The pattern promotes testability, scalability, and ease of understanding, making it easier to adapt to changing requirements over time. The architecture follows the Hexagonal Architecture (Ports and Adapters) principles, allowing for flexibility in integrating different technologies and services. It also aligns with Domain-Driven Design (DDD) concepts, focusing on the core domain and its complexities.

For ease of working with AI tools, there are three parts to the codebase"

- The architecture is written in text fields throughout the codebase
- There are extensive JSDocs comments. Previously, it was best practice to write JSDocs comments only for JavaScript code, but with the rise of TypeScript, they have become equally important for TypeScript codebases. They provide valuable context and explanations for complex logic, making it easier for AI to understand and maintain the code.
- There is a highly opinionated code quality pipeline including ESLint, Prettier, and TypeScript configurations to ensure consistent code style and quality across the project.
- There is a strong emphasis on testing, with unit tests using Vitest and end-to-end tests using Playwright to ensure the reliability and stability of the application.

- [Tech Stack](#tech-stack)

The tech stack choices are listed as below.

### ESLint and Prettier

#### The choice of ESlint plugins is as follows:

##### @eslint/js

Core ESLint JavaScript rules providing foundational linting for JavaScript code. Uses the recommended configuration as the base for all ESLint setups.

##### @typescript-eslint/eslint-plugin

TypeScript-specific linting rules that understand TypeScript syntax and semantics. Provides rules for type checking, async best practices, and TypeScript idioms. Used across all workspaces.

**Rules**:

- `@typescript-eslint/no-unused-vars`: Warn - Allows unused variables prefixed with `_`
- `@typescript-eslint/triple-slash-reference`: Off (frontend only) - Allows triple-slash references for Next.js types

##### @typescript-eslint/parser

Parser that allows ESLint to understand TypeScript syntax. Required for all TypeScript linting rules to function properly.

##### eslint-plugin-codegen

Manages code generation tasks and ensures generated code follows project conventions. Used in root configuration.

##### eslint-plugin-import

Manages import/export syntax and prevents issues like duplicate imports, missing imports, and incorrect import ordering.

**Rules**:

- `import/first`: Error - Ensures imports come first
- `import/newline-after-import`: Error - Enforces blank line after imports
- `import/no-duplicates`: Error - Prevents duplicate imports

##### eslint-plugin-simple-import-sort

Automatically sorts import statements in a consistent order. Enforces alphabetical ordering of imports and exports.

**Rules**:

- `simple-import-sort/imports`: Error - Enforces sorted imports
- `simple-import-sort/exports`: Error - Enforces sorted exports

Used in: Root, Shared package

##### eslint-plugin-sort-destructure-keys

Sorts destructured object keys alphabetically for consistency.

**Rules**:

- `sort-destructure-keys/sort-destructure-keys`: Warn - Suggests sorting destructured keys

Used in: Root, Shared package

##### eslint-plugin-jsdoc

Enforces proper JSDoc comment format and completeness. Ensures documentation is clear and consistent.

**Rules**:

- `jsdoc/check-alignment`: Warn - Checks JSDoc alignment
- `jsdoc/check-param-names`: Warn - Validates parameter names
- `jsdoc/check-tag-names`: Warn - Ensures valid JSDoc tags
- `jsdoc/check-types`: Warn - Validates type annotations
- `jsdoc/require-param-description`: Warn - Requires parameter descriptions
- `jsdoc/require-returns-description`: Warn - Requires return descriptions

Used in: Root, Frontend

##### eslint-plugin-security

Identifies potential security vulnerabilities in the code including unsafe regular expressions, eval usage, and timing attacks.

**Rules**:

- `security/detect-object-injection`: Warn - Detects potential object injection vulnerabilities
- `security/detect-non-literal-regexp`: Warn - Warns about non-literal RegExp constructors
- `security/detect-unsafe-regex`: Error - Detects regex vulnerabilities
- `security/detect-buffer-noassert`: Error - Prevents buffer vulnerabilities
- `security/detect-eval-with-expression`: Error - Prevents eval usage
- `security/detect-no-csrf-before-method-override`: Error - CSRF protection
- `security/detect-possible-timing-attacks`: Warn - Detects timing attack vulnerabilities

Used in: Root, Frontend

##### @vitest/eslint-plugin

Provides linting rules for Vitest test files. Enforces best practices for test writing, proper test structure, avoiding duplicate test names, and ensuring proper assertions.

**Configuration**: Applied to `**/*.test.ts`, `**/*.test.tsx`, `**/*.spec.ts`, `**/*.spec.tsx` files

**Rules**:

- Uses recommended Vitest rules
- `vitest/no-conditional-expect`: Off (shared package) - Allows conditional expects for type narrowing

Used in: Backend, Frontend, Shared package

##### @next/eslint-plugin-next

Next.js-specific linting rules that catch common mistakes and enforce best practices for Next.js applications.

**Rules**:

- `@next/next/no-html-link-for-pages`: Error - Use Next.js `<Link>` component instead of `<a>` tags
- `@next/next/no-img-element`: Warn - Use Next.js `<Image>` component for optimized images
- `@next/next/no-sync-scripts`: Error - Prevents synchronous scripts that block rendering
- `@next/next/no-duplicate-head`: Error - Avoids duplicate `<Head>` components

Used in: Frontend only

##### @tanstack/eslint-plugin-query

React Query (TanStack Query) specific rules for proper query usage and cache management. Ensures best practices with React Query hooks.

**Configuration**: Uses `flat/recommended` preset

Used in: Frontend only

##### eslint-plugin-react

Core React linting rules for JSX syntax, component patterns, and React best practices.

**Configuration**:

- Uses `flat.recommended` preset
- Uses `flat.jsx-runtime` preset (no need to import React in JSX files)

Used in: Frontend only

##### eslint-plugin-react-hooks

Enforces the Rules of Hooks and proper dependency arrays in React hooks. Catches common mistakes with hooks like `useEffect`, `useCallback`, `useMemo`, etc.

**Configuration**: Uses recommended rules

Used in: Frontend only

##### eslint-plugin-jsx-a11y

Accessibility (a11y) rules for JSX elements. Catches accessibility violations like missing alt text, improper ARIA attributes, and keyboard navigation issues.

**Configuration**: Uses `flatConfigs.recommended` for comprehensive accessibility checking

Used in: Frontend only

##### eslint-plugin-drizzle

Drizzle ORM-specific rules to prevent unsafe database operations.

**Applied to**: `src/db/**/*.{ts,tsx}` files only

**Rules**:

- `drizzle/enforce-delete-with-where`: Error - Requires WHERE clause in DELETE statements to prevent accidental mass deletions
- `drizzle/enforce-update-with-where`: Error - Requires WHERE clause in UPDATE statements to prevent accidental mass updates

Used in: Frontend only

##### eslint-plugin-playwright

Playwright-specific rules for E2E test files. Enforces best practices for Playwright tests.

**Applied to**: `e2e/**/*.{ts,js}` files only

**Configuration**: Uses `flat/recommended` preset

Used in: Frontend only

##### typescript-eslint (package)

Unified TypeScript ESLint tooling package that provides both the plugin and parser. Used for TypeScript-specific configurations.

**Configuration**: Uses recommended preset from `typescript-eslint` package

Used in: Frontend only

#### Common Custom Rules Across Workspaces

- `no-console`: Varies by workspace - Warn in root (with exceptions), warn in shared, off in backend, off in frontend
- `no-restricted-syntax`: Error - Disallows TypeScript enums across all workspaces, enforcing const objects with "as const" instead for better type safety and runtime behavior
- `no-unused-vars`: Off - Disabled in favor of TypeScript-specific rule
- `semi`: Error - Never use semicolons (root config only)

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Frontend Development](#frontend-development)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## Architecture

This project is a monorepo with the following structure:

- **frontend**: Next.js framework with React 19 and Material UI
- **backend**: Fastify TypeScript API server
- **PostgreSQL**: Docker-based PostgreSQL 18.1 database

### Security

#### OAuth Sync Endpoint Authentication

The backend provides an OAuth sync endpoint (`/auth/oauth-sync`) that allows the frontend to synchronize OAuth-authenticated users (Google, GitHub, etc.) with the backend database. To prevent unauthorized access, this endpoint is protected by a shared secret authentication mechanism.

**Setup:**

1. Generate a secure random secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   ```

2. Add the secret to both backend and frontend environment variables:
   - Backend: `OAUTH_SYNC_SECRET=your-secret-here` in `apps/backend/.env`
   - Frontend: `OAUTH_SYNC_SECRET=your-secret-here` in `apps/frontend/.env.local`

3. The frontend automatically sends this secret in the `X-OAuth-Sync-Secret` header when calling the OAuth sync endpoint.

**Security Features:**
- Constant-time string comparison to prevent timing attacks
- Shared secret validation before processing any OAuth sync requests
- Generic error messages to prevent information disclosure
- Comprehensive logging for security monitoring

**Note:** The `OAUTH_SYNC_SECRET` must match exactly between frontend and backend configurations.

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

### AGPLv3

GPLv3 (GNU General Public License version 3) is a strong copyleft open-source license ensuring software freedom by requiring that any modified versions or derivative works are also released under GPLv3, keeping the code perpetually open and free for everyone to use, modify, and share. Key features include protections against patent abuses (anti-Tivoization), compatibility with other licenses, and explicit patent grants, making it more robust than GPLv2 for modern software.
Key Permissions & Obligations:

**You can**: Copy, modify, use (privately or commercially), and distribute the software.
You must:

- Include the license and copyright notices with any distribution.
- Release any modified versions under GPLv3 (the "copyleft" principle).
- Provide the complete source code (Corresponding Source) for any distributed work.
- Indicate changes made to the code.
- Display appropriate legal notices on interactive interfaces.
