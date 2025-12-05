-- PostgreSQL Extension Setup
-- Executed automatically on database initialization
-- Best Practice #9: Maximize Observability with Extensions

-- Enable pg_stat_statements for query performance tracking
-- This extension tracks execution statistics of all SQL statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- PostgreSQL 18+ has built-in UUID v7 support via gen_random_uuid() and uuidv7()
-- No extension needed for UUID v7 in PostgreSQL 18+
-- Note: uuid-ossp is legacy and only provides v1, v3, v4, v5
-- For backward compatibility with uuid_generate_v4(), you can still use uuid-ossp:
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable citext for case-insensitive text columns (useful for emails)
CREATE EXTENSION IF NOT EXISTS citext;

-- Output confirmation
DO $$
BEGIN
  RAISE NOTICE 'PostgreSQL extensions initialized successfully';
  RAISE NOTICE 'Available extensions:';
  RAISE NOTICE '  - pg_stat_statements: Query performance tracking';
  RAISE NOTICE '  - pgcrypto: Cryptographic functions';
  RAISE NOTICE '  - citext: Case-insensitive text';
  RAISE NOTICE '';
  RAISE NOTICE 'UUID v7 support:';
  RAISE NOTICE '  - PostgreSQL 18+ includes native UUID v7 via uuidv7() function';
  RAISE NOTICE '  - Use: SELECT uuidv7(); for time-ordered UUIDs';
  RAISE NOTICE '  - Use: SELECT gen_random_uuid(); for random UUIDs (v4)';
END $$;
