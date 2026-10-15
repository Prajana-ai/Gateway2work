# Gateway2Work — Environment Setup, Deployment & Operations Guide

This guide covers everything a developer needs to set up, deploy, clean, and operate each environment.

---

## Table of Contents

1. [Environment Overview](#environment-overview)
2. [Local Development](#local-development)
3. [Azure Environments](#azure-environments)
4. [Infrastructure Setup (setup.sh)](#infrastructure-setup)
5. [Database Operations](#database-operations)
6. [Docker Builds](#docker-builds)
7. [CI/CD Pipeline](#cicd-pipeline)
8. [Environment Variables Reference](#environment-variables-reference)
9. [Troubleshooting](#troubleshooting)
10. [Runbooks](#runbooks)

---

## Environment Overview

| Environment | Purpose | Trigger | Azure Resources | Approvals | Est. Cost |
|-------------|---------|---------|-----------------|-----------|-----------|
| **Local** | Development | `npm run dev` | Docker (PostgreSQL + Redis) | None | $0 |
| **Test** | Integration testing | Merge to `develop` | Free App Service, Burstable PG, no Redis | None | ~$18/mo |
| **Staging** | QA / UAT | Push to `release/*` | Standard App Service, GP PG, Basic Redis | 1 approver | ~$150/mo |
| **Production** | Live | Merge to `main` | Premium App Service, GP PG (HA), Standard Redis | 2 approvers | ~$400/mo |

### Resource Naming Convention

```
Resource Group:     rg-impactforge-{env}
PostgreSQL Server:  impactforge-db-{env}
App Service Plan:   asp-impactforge-{env}
API App Service:    impactforge-api-{env}
Web App Service:    impactforge-web-{env}
Redis Cache:        impactforge-redis-{env}
Key Vault:          kv-impactforge-{env}
Container Registry: impactforgeacr              (shared across all envs)
```

---

## Local Development

### Prerequisites

- Node.js >= 20.0.0
- Docker Desktop (for PostgreSQL and Redis)
- Git with hooks configured (auto-installed via `npm install`)

### First-Time Setup

```bash
# 1. Clone the repository
git clone https://dev.azure.com/SpringTransits/TSRGImpactForge/_git/TSRGImpactForge
cd TSRGImpactForge

# 2. Install dependencies (also configures git hooks)
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if needed (defaults work for local dev)

# 4. Start PostgreSQL and Redis
docker compose up -d

# 5. Wait for containers to be healthy
docker compose ps   # Both should show "healthy"

# 6. Run database migrations
npm run db:migrate

# 7. Seed test data (tenant, roles, permissions, assessment templates, admin user)
npm run db:seed

# 8. Start all dev servers
npm run dev
# API: http://localhost:3001  (health: http://localhost:3001/health)
# Web: http://localhost:3000  (login:  http://localhost:3000/login)
```

### Default Login Credentials

| Field | Value |
|-------|-------|
| Email | `admin@tsrg.org` |
| Password | `changeme123` |
| Role | `org_admin` (full access) |

### Common Local Commands

```bash
# Start/stop infrastructure
docker compose up -d          # Start PostgreSQL + Redis
docker compose down           # Stop (keep data)
docker compose down -v        # Stop and DELETE all data

# Run only API or Web
npx turbo dev --filter=@impactforge/api     # API only (:3001)
npx turbo dev --filter=@impactforge/web     # Web only (:3000)

# Build specific packages
npx turbo build --filter=@impactforge/shared  # Shared package (build first)
npx turbo build --filter=@impactforge/api     # API
npx turbo build --filter=@impactforge/web     # Web

# Reset database completely
docker compose down -v && docker compose up -d
# Wait for healthy, then:
npm run db:migrate && npm run db:seed
```

### Running Tests

```bash
# All tests
npm run test

# API unit tests (48 specs)
cd apps/api && npx jest --passWithNoTests

# Specific test file
cd apps/api && npx jest --testPathPattern=scoring

# E2E tests
cd apps/api && npx jest --config ./test/jest-e2e.json

# Watch mode
cd apps/api && npx jest --watch
```

---

## Azure Environments

### Prerequisites

Before setting up any Azure environment, you need:

1. **Azure CLI** installed and logged in:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

2. **Azure DevOps CLI extension**:
   ```bash
   az extension add --name azure-devops
   ```

3. **Azure DevOps organization access** with permissions to:
   - Create pipelines
   - Create service connections
   - Create variable groups
   - Create environments

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Resource Group                        │
│                     rg-impactforge-{env}                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  App Service  │  │  App Service  │  │  PostgreSQL Flexible  │ │
│  │  (API)        │  │  (Web)        │  │  Server               │ │
│  │  :3001        │  │  :3000        │  │  :5432                │ │
│  │  + staging    │  │  + staging    │  │  + pgcrypto           │ │
│  │    slot       │  │    slot       │  │  + pg_trgm            │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬───────────┘ │
│         │                 │                       │             │
│         └────────┬────────┘                       │             │
│                  │                                │             │
│  ┌───────────────┴──────┐  ┌──────────────────────┴──────────┐ │
│  │  Azure Container     │  │  Azure Cache for Redis           │ │
│  │  Registry (shared)   │  │  (staging + prod only)           │ │
│  │  impactforgeacr      │  │  impactforge-redis-{env}         │ │
│  └──────────────────────┘  └─────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────┐                                      │
│  │  Key Vault            │                                      │
│  │  (staging + prod)     │                                      │
│  │  kv-impactforge-{env} │                                      │
│  └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

### SKU Matrix

| Resource | Test | Staging | Production |
|----------|------|---------|------------|
| App Service Plan | F1 (Free) | S1 (Standard) | P1v3 (Premium) |
| PostgreSQL | Standard_B1ms (Burstable) | Standard_B1ms (Burstable) | Standard_D2s_v3 (GP) |
| PostgreSQL Storage | 32 GB | 64 GB | 128 GB |
| PostgreSQL Backup | 7 days | 14 days | 35 days + geo-redundant |
| PostgreSQL HA | Disabled | Disabled | ZoneRedundant |
| Redis | Not provisioned | Basic C0 | Standard C1 |
| ACR | Basic (shared) | Basic (shared) | Standard (shared) |
| Key Vault | Not provisioned | Standard | Standard |
| AlwaysOn | Disabled (Free tier) | Enabled | Enabled |
| Staging Slot | No | Yes (blue-green) | Yes (blue-green) |

---

## Infrastructure Setup

### Create a New Environment

```bash
# Test environment
./infra/setup.sh test

# Staging environment
./infra/setup.sh staging

# Production environment
./infra/setup.sh prod
```

### What `setup.sh` Does (Step by Step)

1. **Validates prerequisites** — Azure CLI, subscription, logged-in state
2. **Creates resource group** — `rg-impactforge-{env}` in `westus2` with HIPAA tags
3. **Creates/verifies ACR** — `impactforgeacr` (idempotent, shared across envs)
4. **Generates secrets** — DB password, JWT secret, encryption key (via `openssl rand`)
5. **Deploys Bicep template** — `infra/main.bicep` with environment-specific parameters
6. **Configures PostgreSQL** — Enables `pgcrypto` and `pg_trgm` extensions
7. **Creates ADO variable groups** — `impactforge-{env}` with connection strings and secrets
8. **Creates ADO environments** — For pipeline approval gates
9. **Outputs summary** — URLs, credentials, next steps

### Clean and Rebuild an Environment

```bash
# Tear down and rebuild from scratch
./infra/setup.sh test --clean
```

The `--clean` flag will:
1. Prompt for confirmation (type `yes`)
2. Delete the resource group and ALL resources inside it
3. Poll every 10 seconds until deletion completes (up to 10 minutes)
4. Recreate everything from scratch

**Warning**: `--clean` destroys ALL data in that environment. Database, files, everything.

### Providing Your Own Secrets

Instead of auto-generating, you can set environment variables before running:

```bash
export DB_ADMIN_PASSWORD="your-secure-password"
export JWT_SECRET="your-jwt-secret"
export ENCRYPTION_KEY="your-encryption-key"
./infra/setup.sh staging
```

### Post-Setup Manual Steps

After `setup.sh` completes, you must:

1. **Create Azure DevOps service connections** (Project Settings → Service Connections):

   | Connection | Type | Name |
   |-----------|------|------|
   | Azure subscription | Azure Resource Manager | `ImpactForge-Azure-{env}` |
   | Container registry | Docker Registry (ACR) | `ImpactForge-ACR` |

2. **Configure approval gates** (Pipelines → Environments):

   | Environment | Required Approvers |
   |-------------|-------------------|
   | test | None |
   | staging | 1 approver |
   | production | 2 approvers |

3. **Run database migrations**:
   ```bash
   DATABASE_URL="postgresql://impactforge_admin:<password>@impactforge-db-{env}.postgres.database.azure.com:5432/impactforge_{env}?sslmode=require" \
     npx node-pg-migrate up \
     --migrations-dir apps/api/src/database/migrations \
     --database-url-var DATABASE_URL
   ```

4. **Run seed data** (test environment only):
   ```bash
   DATABASE_URL="<same-as-above>" npm run db:seed
   ```

5. **Verify deployment**:
   ```bash
   curl -sf https://impactforge-api-{env}.azurewebsites.net/health
   curl -sf https://impactforge-api-{env}.azurewebsites.net/health/db
   ```

---

## Database Operations

### Migrations

Migrations are SQL files in `apps/api/src/database/migrations/` executed in order:

| # | File | Purpose |
|---|------|---------|
| 001 | `create-schemas.sql` | Create `protected` + `application` schemas, enable pgcrypto/pg_trgm |
| 002 | `public-tables.sql` | tenants, roles, users, permissions, role_permissions |
| 003 | `protected-tables.sql` | clients, referrals, assessments, encounters, audit_logs |
| 004 | `application-tables.sql` | workforce_plans, plan_tasks, RFEs, matches, form_templates |
| 005 | `rls-policies.sql` | Row-Level Security for tenant isolation on all tables |
| 006 | `audit-triggers.sql` | Audit triggers on all protected tables (append-only log) |
| 007 | `indexes.sql` | GIN indexes for JSONB, composite indexes for common queries |
| 008 | `seed-tsrg-template.sql` | TSRG assessment form templates |
| 009 | `workflows.sql` | Workflow state machines |
| 010 | `scheduling-ehr.sql` | Events and EHR integration tables |

### Commands

```bash
# Run all pending migrations (forward)
DATABASE_URL="postgresql://..." npm run db:migrate

# Rollback last migration
DATABASE_URL="postgresql://..." npm run db:migrate:down

# Run on Azure (requires SSL)
DATABASE_URL="postgresql://impactforge_admin:PASSWORD@impactforge-db-test.postgres.database.azure.com:5432/impactforge_test?sslmode=require" \
  npm run db:migrate
```

### Seed Data

The seed script (`npm run db:seed`) creates:

1. **TSRG Pilot tenant** — Default tenant for the TSRG vertical
2. **5 system roles** — org_admin, compliance_admin, workforce_specialist, provider_case_manager, client
3. **85+ permission assignments** — Mapped to roles across data zones
4. **3 assessment templates** — TSRG Skills, Barriers, and Readiness assessments (JSON Schema)
5. **Admin user** — `admin@tsrg.org` / `changeme123` with org_admin role

**Important**: Change the admin password immediately after first login in non-local environments.

### Database Connection

| Environment | Host | SSL | Pool Size |
|-------------|------|-----|-----------|
| Local | `localhost` | No | 20 |
| Test | `impactforge-db-test.postgres.database.azure.com` | Required | 20 |
| Staging | `impactforge-db-staging.postgres.database.azure.com` | Required | 20 |
| Production | `impactforge-db-prod.postgres.database.azure.com` | Required | 20 |

SSL is automatically enabled when `NODE_ENV=production` (see `apps/api/src/config/database.config.ts`).

---

## Docker Builds

### API Container (`Dockerfile.api`)

Multi-stage build:

```
Stage 1 (builder): node:20-alpine
  → npm ci
  → npx turbo build --filter=@impactforge/api

Stage 2 (runner): node:20-alpine
  → Non-root user: nodejs (UID 1001)
  → Copies: dist/, package.json, node_modules/, migrations/, seeds/
  → Port: 3001
  → CMD: node dist/main.js
```

### Web Container (`Dockerfile.web`)

Multi-stage build:

```
Stage 1 (builder): node:20-alpine
  → npm ci
  → npx turbo build --filter=@impactforge/web

Stage 2 (runner): node:20-alpine
  → Non-root user: nextjs (UID 1001)
  → Copies: .next/standalone, .next/static, public/
  → Port: 3000
  → CMD: node apps/web/server.js
```

### Build Locally

```bash
# Build API image
docker build -f Dockerfile.api -t impactforge-api:local .

# Build Web image
docker build -f Dockerfile.web -t impactforge-web:local .

# Run locally
docker run -p 3001:3001 --env-file .env impactforge-api:local
docker run -p 3000:3000 -e NEXT_PUBLIC_API_URL=http://localhost:3001/v1 impactforge-web:local
```

### Push to ACR

```bash
# Login to ACR
az acr login --name impactforgeacr

# Tag and push
docker tag impactforge-api:local impactforgeacr.azurecr.io/impactforge-api:latest
docker push impactforgeacr.azurecr.io/impactforge-api:latest

docker tag impactforge-web:local impactforgeacr.azurecr.io/impactforge-web:latest
docker push impactforgeacr.azurecr.io/impactforge-web:latest
```

---

## CI/CD Pipeline

### Pipeline File

`azure-pipelines.yml` — 4-stage pipeline triggered by branch:

```
feature/* → CI only (build + test)
develop   → CI + Deploy to Test (auto)
release/* → CI + Deploy to Staging (1 approver)
main      → CI + Deploy to Production (2 approvers)
```

### Stage Details

#### Stage 1: CI (all branches + PRs)

- Install Node 20.x, cache npm + Turbo
- `npm ci` → `npx turbo build` → `npx turbo test`
- E2E tests: `npx jest --config ./test/jest-e2e.json`
- Security audit: `npm audit --audit-level=high` (non-blocking)
- Docker build + push to ACR (skipped for PRs)
- Images tagged with `$(Build.BuildId)` + `latest`

#### Stage 2: Deploy to Test

- **Trigger**: merge to `develop`
- **Variable group**: `impactforge-test`
- Runs migrations automatically
- Deploys API + Web containers to App Service
- Seeds test data
- Health check: `curl -sf https://impactforge-api-test.azurewebsites.net/health`

#### Stage 3: Deploy to Staging

- **Trigger**: push to `release/*`
- **Approval**: 1 approver in Azure DevOps
- **Blue-green**: Deploys to staging slot → smoke test → swap to live
- Health checks on staging slot before swap

#### Stage 4: Deploy to Production

- **Trigger**: merge to `main`
- **Approval**: 2 approvers in Azure DevOps
- **Blue-green**: Deploys to staging slot → smoke test → swap to live
- Auto-rollback available for 10 minutes (swap back)
- Post-deploy: monitoring alerts, audit log verification

### Pipeline Variable Groups

Each environment has a variable group `impactforge-{env}` with:

| Variable | Type | Example |
|----------|------|---------|
| `DATABASE_HOST` | Plain | `impactforge-db-test.postgres.database.azure.com` |
| `DATABASE_PORT` | Plain | `5432` |
| `DATABASE_USER` | Plain | `impactforge_admin` |
| `DATABASE_NAME` | Plain | `impactforge_test` |
| `DATABASE_URL` | Plain | `postgresql://...?sslmode=require` |
| `DATABASE_PASSWORD` | **Secret** | `*****` |
| `JWT_SECRET` | **Secret** | `*****` |
| `REDIS_URL` | Plain | `rediss://...:6380` |
| `API_PORT` | Plain | `3001` |
| `NODE_ENV` | Plain | `test` / `staging` / `production` |
| `CORS_ORIGIN` | Plain | `https://impactforge-web-{env}.azurewebsites.net` |
| `azureSubscription` | Plain | `ImpactForge-Azure-{env}` |
| `resourceGroup` | Plain | `rg-impactforge-{env}` |

---

## Environment Variables Reference

### API (NestJS) — `apps/api`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | Full PostgreSQL connection string |
| `DATABASE_HOST` | Yes | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | No | `5432` | PostgreSQL port |
| `DATABASE_USER` | Yes | `postgres` | PostgreSQL user |
| `DATABASE_PASSWORD` | Yes | `postgres` | PostgreSQL password |
| `DATABASE_NAME` | Yes | `impactforge` | Database name |
| `DATABASE_POOL_MAX` | No | `20` | Max pool connections |
| `REDIS_URL` | No | — | Redis connection string (optional in test) |
| `JWT_SECRET` | Yes | — | JWT signing key (min 32 chars) |
| `JWT_EXPIRES_IN` | No | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | No | `24h` | Refresh token TTL |
| `MFA_ISSUER` | No | `Gateway2Work` | TOTP issuer name |
| `API_PORT` | No | `3001` | API listen port |
| `NODE_ENV` | No | `development` | `development` / `test` / `staging` / `production` |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin |

### Web (Next.js) — `apps/web`

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | `http://localhost:3001/v1` | API base URL (**must include `/v1`**) |
| `NODE_ENV` | No | `development` | Environment mode |

### Azure-Specific (set by Bicep/pipeline)

| Variable | Description |
|----------|-------------|
| `DOCKER_REGISTRY_SERVER_URL` | ACR login server URL |
| `DOCKER_REGISTRY_SERVER_USERNAME` | ACR admin username |
| `DOCKER_REGISTRY_SERVER_PASSWORD` | ACR admin password |
| `WEBSITES_ENABLE_APP_SERVICE_STORAGE` | `false` (container apps) |
| `WEBSITES_PORT` | Container listen port (3001 for API, 3000 for Web) |

---

## Troubleshooting

### Local Development

| Problem | Solution |
|---------|----------|
| `EADDRINUSE :3001` | Kill existing process: `lsof -ti :3001 \| xargs kill -9` |
| `ECONNREFUSED :5432` | Start Docker: `docker compose up -d` and wait for healthy |
| `relation does not exist` | Run migrations: `npm run db:migrate` |
| `Invalid credentials` on login | Run seed: `npm run db:seed` (creates admin@tsrg.org) |
| Build fails on shared package | Build shared first: `npx turbo build --filter=@impactforge/shared` |
| `class-validator` errors | Removed — we use Zod. Don't import `class-validator` |

### Azure Deployment

| Problem | Solution |
|---------|----------|
| Bicep `AlwaysOn` error on Free tier | Fixed: test env sets `alwaysOn: false` |
| PostgreSQL SKU invalid | Use `Standard_B1ms` (not `B_Standard_B1ms`) |
| Health check returns 401 | Health controller has `@Public()` — verify deployment |
| `Cannot POST /v1/auth/login` | API needs global prefix: `app.setGlobalPrefix('v1', ...)` |
| Web shows login after auth | Check `NEXT_PUBLIC_API_URL` includes `/v1` suffix |
| Redis null reference in Bicep | Test env has `createRedis=false` — Redis settings are conditional |
| `setup.sh` deletion race | Script polls every 10s with timeout (fixed) |
| CORS errors in browser | Verify `CORS_ORIGIN` matches the web app URL exactly |
| SSL connection errors | Azure requires `?sslmode=require` in DATABASE_URL |

### Pipeline Issues

| Problem | Solution |
|---------|----------|
| Docker build fails | Ensure Dockerfiles reference correct paths (monorepo root context) |
| Service connection not found | Create in Project Settings → Service Connections |
| Variable group not found | Run `setup.sh` or create manually in Pipelines → Library |
| Approval gate stuck | Check Environments → configure approvers |
| Slot swap fails | Verify staging slot exists (test env has no slots) |

---

## Runbooks

### Deploy a Hotfix to Production

```bash
# 1. Branch from main
git checkout main && git pull
git checkout -b hotfix/critical-fix

# 2. Make the fix, commit
git add .
git commit -m "fix: resolve critical issue description"

# 3. Push and create PRs to BOTH main and develop
git push -u origin hotfix/critical-fix

# 4. In Azure DevOps:
#    - Create PR: hotfix/critical-fix → main    (triggers prod deploy, 2 approvers)
#    - Create PR: hotfix/critical-fix → develop  (keeps develop in sync)
```

### Rollback a Production Deployment

```bash
# Option 1: Swap back to previous version (within 10 minutes of deploy)
az webapp deployment slot swap \
  --resource-group rg-impactforge-prod \
  --name impactforge-api-prod \
  --slot staging \
  --target-slot production

# Option 2: Redeploy previous image tag
az webapp config container set \
  --resource-group rg-impactforge-prod \
  --name impactforge-api-prod \
  --docker-custom-image-name impactforgeacr.azurecr.io/impactforge-api:<previous-build-id>
```

### Rotate Secrets

```bash
# 1. Generate new secret
NEW_JWT_SECRET=$(openssl rand -base64 48 | tr -d '/+=')

# 2. Update Key Vault (staging/prod)
az keyvault secret set \
  --vault-name kv-impactforge-prod \
  --name JWT-SECRET \
  --value "$NEW_JWT_SECRET"

# 3. Restart App Service to pick up new secret
az webapp restart \
  --resource-group rg-impactforge-prod \
  --name impactforge-api-prod

# 4. Update ADO variable group
az pipelines variable-group variable update \
  --group-id <id> --name JWT_SECRET --value "$NEW_JWT_SECRET" --secret true
```

### Destroy an Environment Completely

```bash
# This deletes ALL resources — database, app services, everything
./infra/setup.sh test --clean

# Or manually:
az group delete --name rg-impactforge-test --yes --no-wait
```

### Scale Up for Load

```bash
# Scale App Service Plan
az appservice plan update \
  --resource-group rg-impactforge-prod \
  --name asp-impactforge-prod \
  --sku P2v3

# Scale PostgreSQL
az postgres flexible-server update \
  --resource-group rg-impactforge-prod \
  --name impactforge-db-prod \
  --sku-name Standard_D4s_v3

# Scale Redis
az redis update \
  --resource-group rg-impactforge-prod \
  --name impactforge-redis-prod \
  --sku Standard --vm-size C2
```

### Check Environment Health

```bash
ENV=test  # or staging, prod

# API health
curl -sf https://impactforge-api-${ENV}.azurewebsites.net/health | jq .

# Database connectivity
curl -sf https://impactforge-api-${ENV}.azurewebsites.net/health/db | jq .

# App Service status
az webapp show --resource-group rg-impactforge-${ENV} --name impactforge-api-${ENV} --query state

# PostgreSQL status
az postgres flexible-server show --resource-group rg-impactforge-${ENV} --name impactforge-db-${ENV} --query state

# Recent logs
az webapp log tail --resource-group rg-impactforge-${ENV} --name impactforge-api-${ENV}
```
