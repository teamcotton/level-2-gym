# PostgreSQL 18.1 Docker Setup

This project includes a Docker Compose configuration for running PostgreSQL 18.1 locally.

## Prerequisites

- Docker and Docker Compose installed
- Port 5432 available (or modify the port mapping in docker-compose.yml)

## Quick Start

### 1. Create Environment File

Copy the example environment file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` to customize your database credentials if needed:

```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=level2gym
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/level2gym
```

### 2. Start PostgreSQL

```bash
cd backend
docker compose up -d
```

This will:

- Pull the PostgreSQL 18.1 Alpine image
- Create a container named `level2gym-postgres`
- Expose PostgreSQL on port 5432
- Create a persistent volume for data storage
- Run any initialization scripts from `init-scripts/` directory

### 3. Verify Connection

Check that PostgreSQL is running:

```bash
docker compose ps
```

You should see the `level2gym-postgres` container with status "Up" and "healthy".

Test the connection:

```bash
docker compose exec postgres psql -U postgres -d level2gym
```

## Common Commands

All commands should be run from the `backend` directory:

```bash
cd backend
```

### Start the database

```bash
docker compose up -d
```

### Stop the database

```bash
docker compose down
```

### Stop and remove data (⚠️ destructive)

```bash
docker compose down -v
```

### View logs

```bash
docker compose logs postgres
```

### Follow logs in real-time

```bash
docker compose logs -f postgres
```

### Access PostgreSQL CLI

```bash
docker compose exec postgres psql -U postgres -d level2gym
```

### Restart the database

```bash
docker compose restart postgres
```

### Check database health

```bash
docker compose exec postgres pg_isready -U postgres
```

## Initialization Scripts

Place SQL scripts in the `backend/init-scripts/` directory to run them automatically when the database is first created:

```bash
mkdir -p backend/init-scripts
```

Example `backend/init-scripts/001-create-tables.sql`:

```sql
-- Create your initial tables here
-- Using UUID v7 for primary keys (PostgreSQL 17+ native function)
-- Benefits: Time-ordered for better index performance, universally unique
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**UUID v7 vs SERIAL for Primary Keys**:
- **UUID v7**: Time-ordered UUIDs improve index performance, globally unique, suitable for distributed systems
- **SERIAL**: Sequential integers, smaller storage (4/8 bytes vs 16 bytes), simpler for debugging
- PostgreSQL 17+ provides native `uuidv7()` without requiring extensions

Scripts are executed in alphabetical order. Prefix with numbers (001-, 002-, etc.) to control execution order.

**Note**: Initialization scripts only run when the database is created for the first time. To re-run them, you must remove the volume:

```bash
cd backend
docker compose down -v
docker compose up -d
```

## Database Configuration

### Custom Port

To use a different port, edit `backend/docker-compose.yml`:

```yaml
ports:
  - '5433:5432' # Change 5433 to your preferred port
```

Update your connection string accordingly:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/level2gym
```

### Persistent Data

Database data is stored in a Docker volume named `postgres_data`. This ensures data persists between container restarts.

To backup the data:

```bash
cd backend
docker compose exec postgres pg_dump -U postgres level2gym > backup.sql
```

To restore from backup:

```bash
cd backend
docker compose exec -T postgres psql -U postgres -d level2gym < backup.sql
```

## Connecting from Your Application

### Frontend (Next.js with Drizzle ORM)

Update `frontend/.env.local`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/level2gym
```

The database client in `frontend/src/infrastructure/db/index.ts` will use this connection string.

### Backend (Fastify API)

The backend can also connect to the database. Update `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/level2gym
```

### Running Migrations

With Drizzle ORM:

```bash
cd frontend
pnpm drizzle-kit generate:pg  # Generate migrations
pnpm drizzle-kit push:pg      # Apply migrations
```

## Troubleshooting

### Port already in use

If port 5432 is already in use by another PostgreSQL instance:

1. Stop the conflicting service, or
2. Change the port mapping in `backend/docker-compose.yml` to use a different port

### Container won't start

Check logs:

```bash
cd backend
docker compose logs postgres
```

Common issues:

- Port conflict (see above)
- Insufficient disk space
- Docker daemon not running

### Permission denied errors

Ensure Docker has proper permissions to create volumes:

```bash
cd backend
docker compose down -v
docker compose up -d
```

### Reset everything

To start fresh:

```bash
cd backend
docker compose down -v
docker volume rm backend_postgres_data
docker compose up -d
```

## Additional Resources

- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [PostgreSQL 18 Documentation](https://www.postgresql.org/docs/18/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
