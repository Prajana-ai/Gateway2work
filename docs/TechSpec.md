**ImpactForge Technical Specification – Data Model & API Endpoints**  
**Version**: 1.0 (PRD v2.0 aligned)  
**Date**: April 2026  
**Tech Stack Reminder**: PostgreSQL 16+ (JSONB + Row-Level Security), NestJS (TypeScript) or FastAPI backend, Next.js/PWA frontend. Multi-tenant, HIPAA-aligned (Protected vs. Application Data Zones).

### 1. Technical Data Model Overview

**Design Principles**
- **Multi-tenancy**: Every table includes `tenant_id` (UUID). Row-Level Security (RLS) policies enforce tenant isolation automatically.
- **Data Zones** (HIPAA + 42 CFR Part 2 critical):
  - **Protected Data Zone** (schema: `protected`): Contains PII, PHI, substance-use history, consent records, raw assessment responses. Encrypted at rest (pgcrypto or AWS KMS), strict RLS + audit triggers.
  - **Application Data Zone** (schema: `application`): De-identified/minimized data (e.g., anonymized IDs, computed summaries, RFEs). Used for dashboards, matching, reporting.
  - Cross-zone references use surrogate UUIDs only. No direct joins from application → protected without explicit permission checks.
- **Dynamic / Customizable Data**: Heavy use of `JSONB` columns for forms, assessments, and custom fields → no schema migrations for new vertical templates.
- **Compliance Built-in**:
  - All tables have `created_at`, `updated_at`, `created_by`, `updated_by`, `audit_log_id`.
  - Automatic triggers write to `audit_logs` table on any INSERT/UPDATE/DELETE of protected data.
  - Consent flags and expiration dates enforced at query time.
- **Indexing & Performance**: GIN indexes on JSONB, composite indexes on `(tenant_id, status)`, partitioning on large tables (participants, encounters) by tenant + date.
- **Data Model Notation**: Below are the core tables (PostgreSQL DDL-style). Full ER diagram available in Figma/Lucidchart on request.

#### Core Tables (Selected – Full 25+ tables in repo)

**Schema: public (shared config)**
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  vertical_template TEXT DEFAULT 'general' CHECK (vertical_template IN ('general', 'tsrg_workforce', 'youth', 'housing')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  email TEXT UNIQUE NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN DEFAULT true,
  mfa_enabled BOOLEAN DEFAULT true
);
```

**Schema: protected (PHI / 42 CFR Part 2)**
```sql
CREATE TABLE participants (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  external_ehr_id TEXT,                    -- from provider EHR
  referral_source TEXT,                    -- jail, court, self, etc.
  referral_date TIMESTAMPTZ,
  demographics JSONB,                      -- name, DOB (hashed where possible), contact – encrypted
  consent_42cfr BOOLEAN DEFAULT false,     -- explicit consent for substance-use data
  consent_expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending'            -- pending, active, inactive, completed
);

CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  participant_id UUID REFERENCES protected.participants(id),
  provider_agency_id UUID,
  referral_status TEXT DEFAULT 'pending',
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessments (                   -- 3 TSRG tools + any custom
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  participant_id UUID REFERENCES protected.participants(id),
  assessment_type TEXT NOT NULL,             -- 'tsrg_skills', 'tsrg_interests', 'tsrg_barriers'
  raw_responses JSONB NOT NULL,              -- full answers (protected)
  computed_summary JSONB,                    -- interests, aptitudes, barriers (moved to application on scoring)
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id)
);

CREATE TABLE encounters (                    -- for Medicaid billing
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  participant_id UUID REFERENCES protected.participants(id),
  staff_id UUID REFERENCES users(id),
  encounter_date TIMESTAMPTZ,
  duration_minutes INTEGER,
  notes TEXT,
  billable BOOLEAN DEFAULT false
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Schema: application (de-identified / analytics)**
```sql
CREATE TABLE workforce_plans (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,                   -- surrogate reference only
  long_term_goal TEXT,
  short_term_goals JSONB,                    -- array of goals
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plan_tasks (
  id UUID PRIMARY KEY,
  plan_id UUID REFERENCES application.workforce_plans(id),
  description TEXT NOT NULL,
  owner_type TEXT CHECK (owner_type IN ('staff', 'participant')),
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'todo',
  completed_at TIMESTAMPTZ,
  completed_by UUID
);

CREATE TABLE recovery_friendly_employers (   -- RFEs – public-ish data
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,                               -- food, construction, logistics, etc.
  locations JSONB,                           -- array of {city, state}
  is_rfe_certified BOOLEAN DEFAULT true,
  trainee_readiness TEXT,                    -- 'yes', 'limited', 'no'
  notes TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE participant_employer_matches (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  participant_id UUID NOT NULL,
  rfe_id UUID REFERENCES application.recovery_friendly_employers(id),
  application_status TEXT DEFAULT 'interested',
  outcome TEXT,                              -- hired, not_hired, in_training
  applied_date TIMESTAMPTZ
);

CREATE TABLE form_templates (                -- drag-and-drop forms
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  vertical TEXT,
  json_schema JSONB NOT NULL,                -- JSON Schema for validation
  ui_schema JSONB                            -- react-form-builder layout
);
```

**Key Relationships** (text ER)
- Tenant → Users, Participants, Plans, RFEs (1:N)
- Participant → Referrals, Assessments, WorkforcePlans, Encounters, ParticipantEmployerMatches (1:N)
- WorkforcePlan → PlanTasks (1:N)
- RFE → ParticipantEmployerMatches (1:N)
- Assessment → Participant (computed_summary moved to application zone via background job after scoring)

**Indexes & Constraints Highlights**
- RLS policy: `CREATE POLICY tenant_isolation ON participants USING (tenant_id = current_setting('app.current_tenant')::UUID);`
- Unique constraint on `(tenant_id, external_ehr_id)` to prevent duplicates.
- Triggers: Any UPDATE on protected.participants → insert into audit_logs.

**Data Migration / Seeding**
- Initial RFE import: ~137 Colorado employers via CSV → application.recovery_friendly_employers.
- EHR ingestion: background job maps CSV/JSON → protected.participants + referrals.

### 2. API Endpoint Specification (RESTful)

**Base URL**: `https://api.impactforge.app/v1`  
**Auth**: JWT Bearer token + tenant context header `X-Tenant-ID` (enforced server-side).  
**Rate Limiting**: 1000 req/min per tenant.  
**Responses**: Standard { data, meta, error } envelope.  
**HIPAA Notes**: All protected endpoints log to audit_logs; consent checks on every participant read.

#### Auth & Tenants
| Method | Endpoint | Description | Key Params/Body | Protected? |
|--------|----------|-------------|-----------------|------------|
| POST | `/auth/login` | Email + password + MFA | {email, password, mfa_code} | No |
| POST | `/auth/sso` | SAML/OAuth for providers | — | No |
| GET | `/tenants/me` | Current tenant config + vertical template | — | Yes |

#### Referrals & Intake (Phase 1 focus)
| Method | Endpoint | Description | Key Params/Body |
|--------|----------|-------------|-----------------|
| POST | `/referrals` | Ingest from EHR/CSV | {external_ehr_id, provider_agency_id, demographics} |
| GET | `/referrals` | List pending/active | ?status=pending&limit=50 |
| PATCH | `/referrals/{id}/status` | Update status | {status: "active"} |

#### Participants & Assessments
| Method | Endpoint | Description | Key Params/Body |
|--------|----------|-------------|-----------------|
| GET | `/participants` | Search participants (fuzzy) | ?search=john&status=active |
| GET | `/participants/{id}` | 360° view (protected fields masked if no permission) | — |
| POST | `/participants/{id}/assessments` | Submit TSRG assessment | {type: "tsrg_skills", responses: {...}} → returns computed_summary |
| GET | `/participants/{id}/assessments` | List all assessments | — |

#### Workforce Plans & Tasks (TSRG Core)
| Method | Endpoint | Description | Key Params/Body |
|--------|----------|-------------|-----------------|
| POST | `/workforce-plans` | Create plan for participant | {participant_id, long_term_goal, short_term_goals: []} |
| GET | `/workforce-plans/{id}` | Full plan + tasks | — |
| PATCH | `/workforce-plans/{id}` | Update goals | {long_term_goal: "..."} |
| POST | `/workforce-plans/{id}/tasks` | Add task | {description, owner_type: "participant", due_date} |
| PATCH | `/plan-tasks/{id}/complete` | Participant or staff marks done | — (auto-audits) |

#### Recovery-Friendly Employers & Matching
| Method | Endpoint | Description | Key Params/Body |
|--------|----------|-------------|-----------------|
| GET | `/rfes` | Searchable directory | ?sector=food&location=denver&trainee_readiness=yes |
| POST | `/rfes` | Bulk import (admin only) | CSV/JSON array |
| POST | `/participants/{participant_id}/matches` | Link participant to RFE | {rfe_id, application_status} |
| GET | `/participants/{participant_id}/matches` | View outcomes | — |

#### Encounters, Reporting & Exports
| Method | Endpoint | Description | Key Params/Body |
|--------|----------|-------------|-----------------|
| POST | `/encounters` | Log billable encounter | {participant_id, duration_minutes, notes} |
| GET | `/reports/encounters` | Medicaid export CSV | ?start_date=...&end_date=... |
| GET | `/reports/placement` | IPS-style metrics | ?group_by=sector |
| POST | `/reports/conversational` | Enterprise AI query | {"q": "Show placement rates by sector for completed assessments"} |

#### Forms & Advanced (Pro/Enterprise)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/form-templates` | List (including TSRG 3 assessments) |
| POST | `/form-templates` | Create custom drag-and-drop form |
| POST | `/integrations/ehr/webhook` | Future write-back ready |

**Additional API Features**
- Webhooks: `POST /webhooks` for referral status changes, task due reminders.
- Bulk operations: `/bulk/participants/import`, `/bulk/rfes/import`.
- Pagination, filtering, sorting on all list endpoints (`?page=1&limit=50&sort=created_at:desc`).
- OpenAPI/Swagger spec auto-generated (NestJS/FastAPI).

**Security & Compliance Middleware**
- Every protected endpoint runs: `checkConsent()`, `checkDataZone()`, `logAudit()`.
- 42 CFR Part 2: Queries filtered by `consent_42cfr = true AND consent_expires_at > NOW()`.

This data model + API spec is **immediately implementable** and fully supports the TSRG pilot (Phase 1) while remaining extensible for future verticals and IPS.

