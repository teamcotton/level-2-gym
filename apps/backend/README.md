# Backend - Fastify API Server

A TypeScript-based Fastify API server with integrated PostgreSQL database, following hexagonal architecture and API-first development principles.

## Tech Stack

- **Framework**: [Fastify](https://fastify.dev/) with OpenAPI/Swagger
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL 18.1 (via Docker)
- **Testing**: Vitest
- **API Design**: OpenAPI 3.1 + Spectral linting
- **Architecture**: Hexagonal (Ports and Adapters)

## Prerequisites

- Node.js >= 22
- PNPM >= 10
- Docker and Docker Compose

## Getting Started

### 1. Install Dependencies

From the project root:

```bash
pnpm install
```

### 2. Set Up PostgreSQL Database

Copy the environment file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` to customize your database credentials if needed.

Start the PostgreSQL database:

```bash
docker compose up -d
```

Verify the database is running:

```bash
docker compose ps
```

### 3. Development

Start the development server:

```bash
pnpm dev
```

The server will start on `http://localhost:3000` (or `https://localhost:3000` if HTTPS is enabled).

**API Documentation**: Visit `http://localhost:3000/docs` for interactive Swagger UI.

### 4. API-First Workflow

This project follows API-first development:

1. **Design API** in `openapi.json`
2. **Validate** with Spectral: `pnpm run api:lint`
3. **Review** at `http://localhost:3000/docs`
4. **Implement** following the spec

See [API_FIRST_WORKFLOW.md](API_FIRST_WORKFLOW.md) for complete guide.

#### HTTPS in Development

To enable HTTPS in development:

1. SSL certificates have already been generated in `backend/certs/`
2. Set `USE_HTTPS=true` in your `.env` file
3. Restart the dev server

The server will then run on https://localhost:3000

**Note**: Since this is a self-signed certificate, your browser will show a security warning. This is expected in development. You can safely proceed by accepting the certificate.

To regenerate certificates if needed:

```bash
cd backend/certs
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

## Available Scripts

- `pnpm dev` - Start development server with hot reloading
- `pnpm build` - Compile TypeScript to `dist/`
- `pnpm start` - Run compiled server from `dist/`
- `pnpm test` - Run unit tests with Vitest
- `pnpm typecheck` - Run TypeScript type checking
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm mermaid` - Serve Mermaid diagrams (see [MERMAID_VIEWER.md](./MERMAID_VIEWER.md))
- `pnpm mermaid:di` - View DI container diagram at http://localhost:3001

## Viewing Diagrams

The backend includes a built-in Mermaid diagram viewer for visualizing architecture and documentation:

```bash
# View the DI container diagram
pnpm mermaid:di

# View any Mermaid file
pnpm mermaid docs/architecture-flow.md
```

See [MERMAID_VIEWER.md](./MERMAID_VIEWER.md) for full documentation.

## Database Management

### Docker Commands

All Docker commands should be run from the `backend` directory:

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# View logs
docker compose logs postgres

# Access PostgreSQL CLI
docker compose exec postgres psql -U postgres -d norbertsSpark

# Restart database
docker compose restart postgres
```

### Initialization Scripts

Place SQL scripts in `backend/init-scripts/` to run them automatically when the database is first created.

Example: `init-scripts/001-create-tables.sql`

Scripts run in alphabetical order. Prefix with numbers (001-, 002-, etc.) to control execution.

**Note**: Scripts only run on first database creation. To re-run:

```bash
docker compose down -v
docker compose up -d
```

### Connection String

The database connection string is configured in `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/norbertsSpark
```

## Project Structure

```
backend/
├── src/
│   ├── index.ts          # Server entry point with HTTPS support
│   └── app.ts            # Fastify app factory
├── test/
│   └── *.test.ts         # Vitest unit tests
├── certs/                # SSL certificates (git-ignored)
│   ├── key.pem           # Private key
│   └── cert.pem          # Certificate
├── init-scripts/         # PostgreSQL initialization scripts
├── docker-compose.yml    # PostgreSQL Docker configuration
├── .env.example          # Environment variables template
├── .env                  # Your local environment (git-ignored)
├── package.json
└── tsconfig.json
```

## API Endpoints

- `GET /` - Health check endpoint
- `GET /health` - Server health status

## Testing

Run unit tests:

```bash
pnpm test
```

Tests use Fastify's built-in testing utilities (`app.inject()`) for route testing.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=norbertsSpark

# Database connection string
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/norbertsSpark

# Server Configuration
USE_HTTPS=true  # Enable HTTPS in development
# PORT=3000     # Optional: Change server port
```

### Port 3000 already in use

The backend runs on port 3000 by default. Change it by setting the `PORT` environment variable in `.env`:

```env
PORT=3001
```

### HTTPS certificate issues

If you see HTTPS-related errors:

1. Verify certificates exist: `ls -la backend/certs/`
2. Regenerate certificates if needed (see HTTPS section above)
3. Or disable HTTPS by setting `USE_HTTPS=false` in `.env`

### Browser security warnings with HTTPS

When using HTTPS in development, browsers will show a security warning because the certificate is self-signed. This is expected and safe in development:

- **Chrome/Edge**: Click "Advanced" → "Proceed to localhost (unsafe)"
- **Firefox**: Click "Advanced" → "Accept the Risk and Continue"
- **Safari**: Click "Show Details" → "visit this website"

### Database connection issues

1. Verify PostgreSQL is running: `docker compose ps`
2. Check logs: `docker compose logs postgres`
3. Verify connection string in `.env` matches your configuration

### Docker volume issues

To reset the database completely:

```bash
docker compose down -v
docker volume rm backend_postgres_data
docker compose up -d
```

## Additional Resources

- See root `DOCKER_POSTGRES.md` for detailed PostgreSQL setup instructions
- See root `DEVELOPMENT.md` for overall project development guidelines
