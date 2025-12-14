-- Add role column to users table
-- Adding with a default value to handle existing rows
ALTER TABLE "users" ADD COLUMN "role" text NOT NULL DEFAULT 'user';
