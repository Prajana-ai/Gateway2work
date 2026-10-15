# PROJECT_CONTEXT.md

## Project Overview
**ImpactBridge** is a multi-tenant workforce development platform designed for high-security environments. It uses a three-schema PostgreSQL architecture with Row-Level Security (RLS) to isolate tenant data.

## Tech Stack
- **Monorepo**: Turborepo
- **Backend**: NestJS (API)
- **Frontend**: Next.js 15 (Web)
- **Shared**: Zod, TypeScript Enums, DTOs
- **Database**: PostgreSQL (raw `pg` client, `node-pg-migrate`)
- **Infrastructure**: Azure Bicep, Key Vault
- **Package Manager**: NPM

## Directory Structure
- `apps/api/`: NestJS backend service.
- `apps/web/`: Next.js frontend application.
- `packages/shared/`: Shared types, schemas, and utilities.
- `infra/`: Azure Bicep templates for infrastructure as code.
- `docs/`: Technical specifications, PRDs, and environment documentation.
- `.githooks/`: Custom git hooks for commit validation and security.

## Active Feature Focus
- **Current Task**: BUG 427 - Securing secrets in the test environment using Azure Key Vault.
- **Status**: TBD / In-Progress

## Technical Debt & Architectural Rules
- **Schema Isolation**: Strictly adhere to the three-schema model (`public`, `protected`, `application`).
- **RLS Compliance**: Every database query MUST execute within a tenant context using `executeInTenantContext()`.
- **Secret Management**: Move away from direct environment variables toward Azure Key Vault references for all environments.
- **Auditability**: All changes to `protected` and `application` schemas must trigger audit logs (managed via DB triggers).
- **Type Safety**: Ensure Zod schemas in `packages/shared` are the single source of truth for API contracts.

### Addendum: Domain Entity Rename (May 2026)
- **Entity Rename**: The domain entity previously named "Client" has been renamed to "Participant" across the entire monorepo.
- **Impact**: This was a breaking change affecting the database schema (`protected.participants`), API endpoints (`/participants`), and frontend route groups (`(participant)`). 
- **Legacy Note**: Historical migration files (001-012) retain "Client" references; migration 013 is the point of truth for the rename.
