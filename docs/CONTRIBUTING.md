# Contributing to Gateway2Work

This guide covers our Git branching strategy, Azure DevOps workflow, commit conventions, and deployment process. **All developers must follow these practices.**

---

## Branching Strategy

We use a **Git Flow** variant aligned with our Azure DevOps CI/CD pipeline.

### Branch Types

| Branch | Purpose | Deploys To | Protection |
|--------|---------|------------|------------|
| `main` | Production-ready code | **Production** | 2 approvers, no direct push |
| `develop` | Integration branch | **Test** (auto) | 1 approver, no direct push |
| `release/*` | Release candidates | **Staging** | 1 approver |
| `feature/*` | New features | CI only (PR validation) | None |
| `fix/*` | Bug fixes | CI only (PR validation) | None |
| `hotfix/*` | Urgent production fixes | CI only (PR to main) | None |

### Branch Naming

```
feature/short-description       # New features
fix/short-description            # Bug fixes
hotfix/short-description         # Urgent production fixes
release/1.2.0                    # Release candidates
```

Examples:
```
feature/add-assessment-export
fix/login-redirect-loop
hotfix/jwt-token-expiry
release/1.0.0
```

**Never use spaces, uppercase letters, or special characters** (except `/` and `-`).

### Workflow

```
1. Create feature branch from develop
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature

2. Work on your feature, commit often

3. Push and create a PR to develop
   git push -u origin feature/my-feature
   → Create PR in Azure DevOps: feature/my-feature → develop

4. CI runs automatically (build, test, lint, security scan)

5. After approval + merge to develop → auto-deploys to Test environment

6. When ready for staging:
   git checkout develop && git pull
   git checkout -b release/1.x.x
   git push -u origin release/1.x.x
   → Auto-deploys to Staging (requires 1 approval gate)

7. After staging validation, PR release → main
   → Auto-deploys to Production (requires 2 approval gates)
```

### Rules

- **Never push directly to `main` or `develop`** — always use PRs
- **Never force-push** to any shared branch
- **Delete feature branches** after merge
- **Hotfixes** branch from `main`, PR back to both `main` AND `develop`
- Keep feature branches short-lived (< 1 week ideally)

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

<optional body>

<optional footer>
```

### Types

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Build process, dependencies, tooling |
| `perf` | Performance improvement |
| `security` | Security fix or improvement |

### Examples

```
feat: add TSRG barriers assessment scoring engine
fix: resolve MFA guard blocking users without MFA enabled
refactor: extract shared CSV parser from bulk import modules
docs: add Azure deployment runbook
chore: upgrade NestJS to v11
security: enforce parameterized queries in reports service
```

### Rules

- Use **lowercase** for the description
- **No period** at the end
- Use **imperative mood** ("add" not "added", "fix" not "fixes")
- Keep the first line under **72 characters**
- Reference Azure DevOps work items in the footer: `AB#1234`

---

## Azure DevOps Pipeline

### Pipeline Stages

```
CI (all branches + PRs)
  ├── Install dependencies
  ├── Build all packages (shared → api → web)
  ├── Run tests (48 unit specs + E2E)
  ├── Security audit (npm audit)
  └── Docker build + push to ACR

Test (develop branch only)
  ├── Deploy API container to Test App Service
  ├── Deploy Web container to Test App Service
  └── Health check validation

Staging (release/* branches)
  ├── Approval gate (1 approver)
  ├── Deploy to staging slot
  ├── Health check validation
  └── Slot swap (blue-green)

Production (main branch)
  ├── Approval gate (2 approvers)
  ├── Deploy to staging slot
  ├── Health check validation
  └── Slot swap (blue-green)
```

### Pipeline Diagram

See `docs/azure_devops_pipeline.html` for the visual pipeline architecture.

---

## Azure Infrastructure

### Environments

| Environment | Trigger | Azure Resources | Cost |
|-------------|---------|-----------------|------|
| **Test** | merge to `develop` | Free App Service, Burstable PostgreSQL, no Redis | ~$18/mo |
| **Staging** | push to `release/*` | Standard App Service, GP PostgreSQL, Basic Redis | ~$150/mo |
| **Production** | merge to `main` | Premium App Service, GP PostgreSQL (HA), Standard Redis | ~$400/mo |

### Infrastructure as Code

All Azure resources are defined in Bicep:

```
infra/
├── main.bicep                    # Main template (all resources)
├── modules/
│   └── app-service.bicep         # App Service + staging slot module
├── parameters/
│   ├── test.bicepparam           # Test environment parameters
│   ├── staging.bicepparam        # Staging parameters
│   └── prod.bicepparam           # Production parameters
└── setup.sh                      # One-command setup/teardown script
```

### Setup / Teardown

```bash
# Deploy test environment (first time)
./infra/setup.sh test

# Tear down and rebuild
./infra/setup.sh test --clean

# Deploy staging
./infra/setup.sh staging

# Deploy production
./infra/setup.sh prod
```

### Key Configuration

- **API URL prefix**: All API routes are under `/v1` (e.g., `/v1/auth/login`)
- **Health endpoint**: Available at `/health` (no prefix) for Azure probes
- **NEXT_PUBLIC_API_URL**: Must include `/v1` suffix
- **Database SSL**: Required in Azure (`?sslmode=require`), skipped locally
- **Redis**: Skipped in test environment; API handles missing `REDIS_URL` gracefully

---

## Security Practices

### HIPAA Compliance

This is a **HIPAA-compliant** application. All developers must:

1. **Never log PII/PHI** — no client names, SSNs, DOBs, or health data in logs
2. **Always use parameterized queries** (`$1`, `$2`) — never string interpolation
3. **Respect data zones** — use `@DataZoneAccess('protected')` for PHI endpoints
4. **Consent enforcement** — use `@RequiresConsent()` on client-specific endpoints
5. **Audit trail** — all protected schema changes are auto-logged via triggers
6. **Encryption** — demographics and raw assessment responses use pgcrypto

### Secrets Management

- **Local**: `.env` file (never committed — in `.gitignore`)
- **Test**: Secrets passed directly via Bicep parameters
- **Staging/Prod**: Azure Key Vault references in App Service settings

**Never commit** `.env`, credentials, API keys, or connection strings.

---

## Local Development Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd TSRGImpactForge
npm install

# 2. Environment
cp .env.example .env  # Edit as needed

# 3. Start infrastructure
docker compose up -d postgres redis # PostgreSQL + Redis

# 4. Database
npm run db:migrate    # Run SQL migrations
npm run db:seed       # Seed test data

# 5. Run the app
npm run dev           # API :3001 + Web :3000

# 6. Login
# Email: admin@tsrg.org
# Password: changeme123
```

### Loading Mock Data (Optional)

After seeding, populate the database with realistic mock participants, referrals, encounters, assessments, plans, employer matches, employment outcomes, trainings, and follow-ups — useful when you want to click through populated screens instead of an empty UI.

**Key properties:**
- **Additive + repeatable.** Each run inserts a new batch of participants and never modifies or deletes existing rows. Re-run as many times as you like.
- **Tenant-isolated.** Mock data lives in its own tenant (`tsrg-mock`) with its own admin login. It never mixes with the real `TSRG Pilot` tenant — log in as the mock admin to see it, log in as `admin@tsrg.org` to see the original (empty) tenant.
- **Tagged.** Every mock participant has `external_ehr_id = 'mock-<uuid>'`, so you can identify mock rows with a single `WHERE` clause.

**Recommended (works regardless of your local `.env`):**

```bash
# Run inside the api container — picks up DATABASE_URL from docker-compose.yml
docker compose exec api npm run db:mock:built -- --count 10
```

**Alternative (host shell, requires `.env` pointing at the docker-mapped postgres):**

```bash
# Note: docker-compose maps postgres to host port 5436, not the .env.example default 5432.
# Update .env to DATABASE_URL=postgresql://impactforge:secret123@localhost:5436/impactforge_dev
# (and DATABASE_SSL=false in development) before running:
npx dotenv -e .env -- npm run db:mock -- --count 10
```

**Login as the mock admin:**

| Field    | Value                  |
|----------|------------------------|
| URL      | http://localhost:3000  |
| Email    | `mock-admin@tsrg.org`  |
| Password | `changeme123`          |

**What each run creates (per participant):**

| Table                                | Records per participant      |
|--------------------------------------|------------------------------|
| `protected.participants`             | 1                            |
| `protected.referrals`                | 1                            |
| `protected.enrollments`              | 1                            |
| `protected.encounters`               | 2–4                          |
| `protected.assessments` (3 types)    | 3 — for ~60% of participants |
| `application.assessment_summaries`   | 3 — paired with assessments  |
| `application.workforce_plans`        | 1 — for ~60%                 |
| `application.plan_tasks`             | 4 — for ~60%                 |
| `application.participant_employer_matches` | 1 — for ~50%           |
| `application.employment_outcomes`    | 1 — for ~40%                 |
| `protected.trainings`                | 1 — for ~40%                 |
| `protected.follow_ups`               | 1 — for ~50%                 |
| `protected.discharges`               | 1 — for ~20% (completed)     |
| `application.ips_fidelity_reviews`   | 1 per run (tenant-level)     |

Tenant fixtures (mock tenant, admin user, 3 staff, 5 employers, 5 RFEs) are upserted once and reused on every run.

**To reset to an empty state**, wipe the docker volume:

```bash
docker compose down -v
docker compose up -d
docker compose exec api node dist/database/seeds/run-seeds.js   # base seed (TSRG Pilot admin)
docker compose exec api npm run db:mock:built -- --count 10     # mock data
```

**CLI args:**
- `--count N` — number of participants to insert this run (1–500, default 5).

### Running Tests

```bash
# All tests
npm run test

# API tests only
cd apps/api && npx jest --passWithNoTests

# Specific test file
cd apps/api && npx jest --testPathPattern=scoring

# E2E tests
cd apps/api && npx jest --config ./test/jest-e2e.json
```

---

## Code Review Checklist

Before approving a PR, verify:

- [ ] Follows branching strategy (correct source → target)
- [ ] Commit messages follow conventional commits
- [ ] No secrets or PII in code/logs
- [ ] SQL uses parameterized queries (no string interpolation)
- [ ] New endpoints have correct decorators (`@DataZoneAccess`, `@RequiresConsent`, `@Roles`)
- [ ] Repository methods use `TenantAwareRepository.execute()` pattern
- [ ] Frontend API calls go through `apiClient` (not raw `fetch`)
- [ ] Tests pass (CI pipeline green)
- [ ] No `console.log` left in production code
