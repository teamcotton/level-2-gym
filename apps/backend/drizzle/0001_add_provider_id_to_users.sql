-- Migration: Add provider_id column to users table
-- This column stores the unique identifier from OAuth providers (e.g., Google, GitHub)

ALTER TABLE "users" ADD COLUMN "provider_id" text;
