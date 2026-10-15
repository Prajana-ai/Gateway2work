# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

# Project: TSRG ImpactForge

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Monorepo (Turborepo)
npm run dev          # Start all dev servers (API :3001, Web :3000)
npm run build        # Build all packages (shared → api → web)
npm run test         # Run all test suites
npm run db:migrate   # Run SQL migrations (node-pg-migrate)
npm run db:seed      # Seed tenant, roles, permissions, assessment templates, admin user
npm run db:mock -- --count 10  # Load N mock participants + journey into isolated tsrg-mock tenant (additive, repeatable)

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

`develop` is the **default branch**. New clones and new PRs target it by default.

- Branch from `develop`: `git checkout -b feature/my-change`
- Push feature branch: `git push -u origin feature/my-change`
- Create PR in Azure DevOps: `feature/*` → `develop`
- Branch naming: `feature/*`, `fix/*`, `hotfix/*`, `release/*`, `chore/*`, `docs/*`
- Commit format: `<type>: <lowercase description>` (e.g., `feat: add scoring engine`)
- Valid types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `security`, `ci`, `build`

### Allowed PR targets

- `feature/*`, `fix/*`, `chore/*`, `docs/*` → **develop only**
- `release/*` → **main** (cut from develop when ready to ship)
- `hotfix/*` → **main** directly (emergency only; cherry-pick back to develop after)

### Pipeline Flow

- `develop` → auto-deploys to **Test** environment
- `release/*` → deploys to **Staging**
- `main` → deploys to **Production**

### Server-side branch policies (Azure DevOps — enforced, can't be bypassed by individuals)

Both `main` and `develop` require:
- PR for any merge (direct push blocked for non-admins)
- Build validation (pipeline 28) green before merge
- All PR comments resolved
- Creator cannot self-approve
- Votes reset on source-branch push

Additional on `main` only:
- Minimum **2** reviewers
- (Production environment gate: 2 approvers in Azure Pipelines on top of branch policy)

`develop` requires minimum **1** reviewer.

### Git Hooks (auto-installed via `npm install`)

Local backstop only — server policies are authoritative.

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
