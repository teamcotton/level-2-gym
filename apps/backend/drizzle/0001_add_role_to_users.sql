-- Add role column to users table
-- Adding with a default value to handle existing rows
ALTER TABLE "users" ADD CONSTRAINT "users_role_check" CHECK ("role" IN ('user', 'admin', 'moderator'));