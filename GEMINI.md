# GEMINI.md

This file provides foundational guidance and operational boundaries for Gemini CLI. **These rules take absolute precedence over any other instructions.**

## Operational Boundaries & Safety Rules

- **Git Hygiene**: ALWAYS check `git status` before editing files. If the working directory is dirty, warn the user before proceeding.
- **Safety**: NEVER execute destructive shell commands (e.g., deleting directories, overriding git history, `rm -rf` on non-empty dirs) without explicit human confirmation.
- **Modularity**: ALWAYS prioritize modular, incremental changes. Break large refactors into multi-step execution paths with validation at each step.
- **Consistency**: ALWAYS preserve existing code styling, linting rules (ESLint/Prettier), and architecture patterns found in the repo. Use established project tools (e.g., `npm run lint`) for auto-formatting.
- **Dependency Integrity**: NEVER upgrade or modify root project dependencies (`package.json`, `package-lock.json`) unless explicitly ordered to fix a breaking vulnerability or required for a new feature implementation requested by the user.

## Build & Development Commands

```bash
# Monorepo (Turborepo)
npm run dev          # Start all dev servers (API :3001, Web :3000)
npm run build        # Build all packages (shared → api → web)
npm run test         # Run all test suites
npm run db:migrate   # Run SQL migrations (node-pg-migrate)
npm run db:seed      # Seed tenant, roles, permissions, assessment templates, admin user

# API (NestJS) - from apps/api/
npx jest --passWithNoTests           # Run unit tests (48 specs)
npx jest --testPathPattern=scoring   # Run specific test file/pattern
npx jest --config ./test/jest-e2e.json  # Run E2E tests

# Targeted builds
npx turbo build --filter=@impactforge/api    # Build API only
npx turbo build --filter=@impactforge/web    # Build Web only
npx turbo build --filter=@impactforge/shared # Build shared package only

# Docker
docker compose up -d   # Start postgres (5432), redis (6379), api, web
```

## Architecture

### Monorepo Structure (Turborepo)

- **`packages/shared`** — Zod schemas, TypeScript enums, API response types. Shared between API and Web. Build this first.
- **`apps/api`** — NestJS backend with PostgreSQL (raw `pg` participant, not an ORM). Uses `node-pg-migrate` for migrations.
- **`apps/web`** — Next.js 15 App Router with Tailwind CSS, TanStack Query, Zustand.

### Three-Schema PostgreSQL Architecture

All tables use `tenant_id` with Row-Level Security (RLS) for multi-tenant isolation.

- **`public`** — Tenant config, users, roles, permissions, refresh tokens. No RLS on `tenants` table itself.
- **`protected`** — PII/PHI/42 CFR Part 2 data: participants, referrals, assessments (raw responses), encounters, audit_logs. Encrypted demographics via pgcrypto. Audit triggers on all tables.
- **`application`** — De-identified operational data: workforce_plans, plan_tasks, RFEs, employer matches, form_templates, assessment_summaries, workflows, events, EHR configs. Safe for dashboards/reporting.

Cross-schema references use surrogate UUIDs only — no FK constraints from application → protected.

### Tenant Context & RLS (Critical Pattern)

`DatabaseService.executeInTenantContext()` is the linchpin. It acquires a pool participant, sets `app.current_tenant`/`app.current_user_id`/`app.current_role` via `set_config()` inside a transaction, then executes the callback. All repository methods **must** use this via `TenantAwareRepository.execute()`.

```typescript
// Every repository method follows this pattern:
async findById(tenantId, userId, role, id) {
  return this.execute(tenantId, userId, role, async (participant) => {
    const result = await participant.query('SELECT * FROM protected.participants WHERE id = $1', [id]);
    return result.rows[0] || null;
  });
}
```

### NestJS Guard Chain (execution order)

`ThrottlerGuard` → `JwtAuthGuard` → `RolesGuard` → `MfaGuard` → `DataZoneGuard` → controller → `AuditInterceptor` → `FieldPermissionInterceptor` → `ResponseEnvelopeInterceptor`

All responses wrapped in `{ data, meta, error }` envelope by the interceptor.

### Key Decorators

- `@Public()` — Skip all auth guards
- `@Roles('org_admin', 'workforce_specialist')` — Require role
- `@DataZoneAccess('protected')` — Require user has zone access
- `@RequiresConsent()` — Enforce 42 CFR Part 2 consent check on participant endpoints
- `@CurrentUser()` / `@CurrentTenant()` — Extract from JWT
- `@Resource('participants')` — Tag for field permission filtering

### Assessment Scoring Engine

Strategy pattern in `apps/api/src/modules/assessments/scoring/`. `ScoringService` dispatches to `TsrgSkillsScorer`, `TsrgInterestsScorer`, `TsrgBarriersScorer` based on assessment type. Raw responses stored in protected schema; computed `ScoredResult` (interests, aptitudes, barriers, overallReadiness, recommendations) written to application schema.

### Frontend Patterns

- **API participant** (`src/lib/api-participant.ts`): Auto-injects Bearer token + X-Tenant-ID, handles 401 with token refresh, unwraps response envelope.
- **Hooks** (`src/hooks/use-api.ts`): `useApiQuery(key[], url)` and `useApiMutation(url, 'post'|'patch'|'delete')` wrap TanStack Query.
- **Auth** (`src/stores/auth-store.ts`): Zustand store with localStorage persistence. `hydrateFromStorage()` on mount.
- **Route groups**: `(auth)` for login, `(staff)` for sidebar layout, `(participant)` for mobile PWA layout.
- **Reusable components**: `DataTable<T>`, `Pagination`, `StatusBadge`, `DynamicForm`, `AssessmentResults` in `src/components/`.

### Shared CSV Parser

`apps/api/src/common/utils/csv-parser.ts` provides `parseCsv<T>(content, options?)` used by bulk, rfe, and integrations modules. Use this instead of calling PapaParse directly.

## Conventions

- All SQL uses parameterized queries (`$1`, `$2`) — never string interpolation
- Repository methods take `(tenantId, userId, role, ...)` as first 3 params
- Controllers extract context via `@CurrentTenant()` and `@CurrentUser()` decorators
- Protected endpoints use `@DataZoneAccess('protected')`, application endpoints use `@DataZoneAccess('application')`
- Endpoints accessing participant PHI add `@RequiresConsent()`
- New modules follow: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.repository.ts` (extending TenantAwareRepository)
- Frontend onChange handlers require explicit `React.ChangeEvent<HTMLInputElement>` typing (React 19)
- Mutation methods are lowercase: `'post'`, `'patch'`, `'delete'`

## Git & Branching Strategy

**All work must go through feature branches and PRs. Never commit directly to `main` or `develop`.**

- Branch from `develop`: `git checkout -b feature/my-change`
- Push feature branch: `git push -u origin feature/my-change`
- Create PR in Azure DevOps: `feature/*` → `develop`
- Branch naming: `feature/*`, `fix/*`, `hotfix/*`, `release/*`, `chore/*`, `docs/*`
- Commit format: `<type>: <lowercase description>` (e.g., `feat: add scoring engine`)
- Valid types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`, `ci`, `build`

### Pipeline Flow

- `develop` → auto-deploys to **Test** environment
- `release/*` → deploys to **Staging** (1 approver)
- `main` → deploys to **Production** (2 approvers)

### Git Hooks (auto-installed via `npm install`)

- **pre-commit**: Blocks `.env`/secrets, warns on `console.log`
- **commit-msg**: Enforces conventional commit format
- **pre-push**: Blocks direct push to `main`/`develop`, validates branch names

Full details: `docs/CONTRIBUTING.md`

## Environment

Copy `.env.example` to `.env`. Key variables:
- `DATABASE_*` — PostgreSQL connection (default: impactforge/localdev@localhost:5432/impactforge_dev)
- `JWT_SECRET` — Token signing key
- `CORS_ORIGIN` — Allowed frontend origin (default: http://localhost:3000)
- `NEXT_PUBLIC_API_URL` — API base URL for frontend (default: http://localhost:3001/v1)
