-- Initial Database Schema Setup
-- Executed after extensions are created

-- Create a schema for application tables
CREATE SCHEMA IF NOT EXISTS app;

-- Set search path to include app schema
ALTER DATABASE level2gym SET search_path TO app, public;

-- Create basic audit columns function
CREATE OR REPLACE FUNCTION app.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Example: Create a sample table with best practices
-- (Remove or modify this based on your needs)
-- Note: uuidv7() is a PostgreSQL 18+ native function providing time-ordered UUIDs
-- which improve database performance for indexed primary keys (no extension required)
CREATE TABLE IF NOT EXISTS app.sample_table (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  name TEXT NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Add trigger for automatic updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON app.sample_table
  FOR EACH ROW
  EXECUTE FUNCTION app.set_updated_at();

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sample_table_created_at ON app.sample_table(created_at DESC);

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'Database schema initialized successfully';
  RAISE NOTICE 'App schema created with audit functions';
END $$;
