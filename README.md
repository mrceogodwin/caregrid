# Caregrid

Caregrid is a multi-tenant hospital operations platform being built for private clinics, diagnostic centres and small-to-medium hospitals, starting with Nigerian healthcare workflows.

## Current status
The initial Next.js App Router scaffold includes a responsive dashboard, workspace navigation, overview metrics, a patient directory and a demo-only registration interaction. All metrics and sample patient rows are illustrative. They are not medical records and must not be used for real patient care.

A first PostgreSQL migration defines organizations, facilities, departments, memberships, patient records, patient identifiers and append-only audit events. A second migration adds tenant-scoped appointments, clinical encounters, observations and append-only clinical amendments. A third migration adds facility-level staff assignments and hashed-token invitation records; credentials remain with an external identity provider. Composite foreign keys also prevent cross-facility department assignments and mismatching patients across appointments, encounters and observations. PostgreSQL row-level security policies enforce organization scoping when a trusted server transaction sets its tenant context. Signed encounters cannot be edited or deleted in place. A server-only PostgreSQL client and a non-cacheable database health endpoint are also in place. The migration has been committed but has **not** been applied to a live database because the Neon project and connection string are not yet verified.

## Technology
- Next.js App Router, React and TypeScript
- PostgreSQL schema and migrations in `db/migrations`; Neon connection pending
- Server-only PostgreSQL client in `lib/db.ts`
- Database readiness check at `/api/health/database`
- Vercel hosting
- Planned private object storage: Cloudflare R2
- Planned transactional notifications: Brevo

## Database setup
1. Provision a Neon PostgreSQL project and select the intended production region.
2. Configure the Neon connection string as a secret `DATABASE_URL` in Vercel for the appropriate environments. Do not commit it or paste it into source control.
3. Review and apply migrations in order: `0001_secure_tenant_foundation.sql`, then `0002_clinical_workflows.sql` and `0003_membership_access_foundation.sql`. Use a trusted migration runner or `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/0001_secure_tenant_foundation.sql` followed by the equivalent command for `0002_clinical_workflows.sql`.
4. Run the read-only schema verification script with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/verify/verify_schema.sql`. It checks all 13 expected tables, forced row-level security, tenant policies and immutable-record triggers. The migrations have not yet been executed against Neon; do not treat a successful Vercel build as proof that the SQL has run.
5. Check `/api/health/database`. It returns only a generic status and never exposes connection details.

Tenant context must be set transaction-locally by trusted server code after validating the authenticated user's active membership. Never trust a tenant ID supplied by a browser request. Do not use a superuser or a role with `BYPASSRLS` for normal application queries.

## Local development
```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and set `DATABASE_URL` only after provisioning the database. Keep `.env.local` out of version control.

## Quality checks
```bash
npm run typecheck
npm run lint
npm run build
```

## Build sequence
1. Secure foundation, tenant-aware database schema, migrations and health checks.
2. Connect an external identity provider; validate provider subjects against active organization and facility memberships, then enforce server-side role permissions. Invitation storage is only a schema foundation until that workflow is implemented.
3. Patient registration, search, duplicate warnings, appointments and queue.
4. Clinical encounters, lab orders/results and pharmacy inventory.
5. Billing, receipts, reconciliation, reports and audit trails.
6. Private file storage, notification jobs, backup/restore tests and pilot readiness.

## Safety and privacy
Do not enter real patient information into the current demo UI. Authentication, authorization, database persistence, audit logging and production security controls are not complete. A successful deployment alone does not establish regulatory compliance or clinical readiness. Before a real pilot, validate Nigeria Data Protection Act requirements, cross-border data transfers, retention, incident response, access controls and backup/recovery with qualified advisers.