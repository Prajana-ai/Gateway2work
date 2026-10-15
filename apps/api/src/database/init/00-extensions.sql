-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create application database role (non-superuser, RLS enforced)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'impactforge_app') THEN
    CREATE ROLE impactforge_app LOGIN PASSWORD 'localdev' NOINHERIT;
  END IF;
END
$$;
