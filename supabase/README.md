# Supabase Self-Hosting with Docker

This directory contains the Docker configuration for self-hosting Supabase locally.

## Prerequisites

- Docker and Docker Compose installed
- At least 4GB of RAM available for Docker

## Quick Start

1. Clone the Supabase repository:

```bash
git clone --depth 1 https://github.com/supabase/supabase
```

2. Navigate to the docker directory:

```bash
cd supabase/docker
```

3. Copy the example env file:

```bash
cp .env.example .env
```

4. Start the services:

```bash
docker compose up -d
```

5. Access services:

- Supabase Studio: http://localhost:3000
- PostgreSQL: localhost:5432
- API Gateway: http://localhost:8000

## Configuration

Update the `.env` file with your configuration:

- Database credentials
- JWT secret
- API keys
- SMTP settings (optional)

## Connecting from Frontend

Update your frontend `.env` file:

```
PUBLIC_SUPABASE_URL=http://localhost:8000
PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

## Stopping Services

```bash
docker compose down
```

## Documentation

For more information, visit: https://supabase.com/docs/guides/self-hosting/docker
