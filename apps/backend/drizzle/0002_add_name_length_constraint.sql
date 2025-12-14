-- Add name length constraint to users table
ALTER TABLE "users" ADD CONSTRAINT "name_length_check" CHECK (length("name") >= 2 AND length("name") <= 100);
