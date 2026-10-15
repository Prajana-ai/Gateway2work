# TSRGImpactForge

## Architecture

- Monorepo (Turbo)
- Next.js frontend
- NestJS backend
- PostgreSQL
- Row Level Security

## Security

- Never bypass RLS.
- Always use TenantAwareRepository.
- Preserve tenant context.
- Never remove authorization.

## UI

- Material UI
- Reuse existing components.
- Match existing theme.
- Responsive.
- No unnecessary libraries.

## Participant Experience

Flow

Login
→ Welcome
→ Plan
→ Tasks
→ Check-In

Admin and Participant are separate experiences.

## Coding

- Smallest possible change.
- Don't refactor unrelated code.
- Reuse components.
- No duplicate APIs.
- Keep components small.


## Git

Feature branches only.  
PR to develop.
Never commit directly to main.

## Critical Security Rules

1. RLS is sacred. Never bypass it.
2. Always use TenantAwareRepository.
3. Do not modify auth logic without explicit permission.
4. Verify consent requirements before touching participant data.
5. Audit trail must be preserved.

## Documentation

Before implementing participant-facing features:
- Review docs/participant-journey.md
- Review docs/PRD.md when business requirements are involved

When adding new participant functionality:
- Update participant-journey.md if the user flow changes