# TSRG Gateway2Work

Gateway2Work is a modern, HIPAA-compliant case management platform tailored for workforce development and human services.

## Database & Data Model

The project uses a **PostgreSQL 16+** three-schema architecture to manage workforce development data securely and scalably.

### Schema Architecture
- **Public**: Tenant configuration, users, and RBAC.
- **Protected**: PII/PHI (Participants, Enrollments, Assessments, Follow-ups) protected by 42 CFR Part 2 and HIPAA.
- **Application**: Operational and de-identified data (Services, Trainings, Employers, Outcomes).

### Key Database Commands
To manage the database locally, use the following commands from the root:

```bash
# Start the database container
docker compose up -d postgres

# Apply SQL migrations
npm run db:migrate

# Seed initial data (Tenants, Roles, RFE directory)
npm run db:seed

# Optional: load realistic mock participants for a populated UI
# (additive, repeatable, isolated in the "tsrg-mock" tenant)
docker compose exec api npm run db:mock:built -- --count 10
```

See [docs/CONTRIBUTING.md → Loading Mock Data](./docs/CONTRIBUTING.md#loading-mock-data-optional) for details on the mock-data installer.

### Entity-Relationship Diagram (ERD)
The full data model is derived from the WFD (Workforce Data Dictionary) CSV in `/docs`. You can view the ERD and detailed design decisions in the PRD:

👉 [View Data Model & Architecture (PRD Section 9)](./docs/PRD.md#9-data-model--architecture)

### Source Data
The source of truth for the initial data model is:
`docs/WFD Data Dictionary(DatabaseStructure).csv`
