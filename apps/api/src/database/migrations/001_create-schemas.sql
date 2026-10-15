-- Migration 001: Create schemas and enable extensions
-- Protected Data Zone: PII, PHI, 42 CFR Part 2 data
-- Application Data Zone: De-identified operational data

CREATE SCHEMA IF NOT EXISTS protected;
CREATE SCHEMA IF NOT EXISTS application;

-- Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Encryption helper functions for PHI fields
CREATE OR REPLACE FUNCTION protected.encrypt_phi(plaintext TEXT, key TEXT)
RETURNS BYTEA AS $$
  SELECT pgp_sym_encrypt(plaintext, key, 'compress-algo=1, cipher-algo=aes256');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION protected.decrypt_phi(ciphertext BYTEA, key TEXT)
RETURNS TEXT AS $$
  SELECT pgp_sym_decrypt(ciphertext, key);
$$ LANGUAGE sql IMMUTABLE;
