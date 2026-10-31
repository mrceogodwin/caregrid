# Caregrid

Caregrid is a multi-tenant hospital operations platform being built for private clinics, diagnostic centres and small-to-medium hospitals, starting with Nigerian healthcare workflows.

## Current status
- Production Neon PostgreSQL project and dedicated `caregrid` database are connected to Vercel.
- Migrations 0001–0003 are applied to production. The database contains 13 tenant-scoped tables with forced row-level security, tenant policies, composite tenant constraints and immutable clinical/audit triggers.
- The Vercel runtime uses the dedicated `caregrid_app` role. It is not a superuser and cannot bypass row-level security.
- The production database health endpoint returns a generic readiness result at `/api/health/database`.
- Neon Auth (managed Better Auth) is provisioned for the production branch. The Next.js sign-in integration and active facility membership gate are being implemented.
- The dashboard remains a demo preview. Sample patients, metrics and registration interactions are not real records and are not persisted.

## Technology
- Next.js App Router, React and TypeScript
- PostgreSQL on Neon; SQL migrations in `db/migrations`
- Server-only PostgreSQL client in `lib/db.ts`
- Managed Neon Auth for identity; organization/facility roles remain in Caregrid's own membership tables
- Vercel hosting
- Planned private object storage: Cloudflare R2
- Planned transactional notifications: Brevo

## Environment variables
- `DATABASE_URL`: sensitive PostgreSQL URL for the restricted `caregrid_app` role. Never use the owner role in application code.
- `NEON_AUTH_BASE_URL`: managed Neon Auth endpoint for the selected branch.
- `NEON_AUTH_COOKIE_SECRET`: server-only random secret of at least 32 characters.

Set secrets in Vercel or local `.env.local`; never commit real values or expose them with a `NEXT_PUBLIC_` prefix.

## Database migrations
Production has migrations 0001, 0002 and 0003 applied. The read-only verifier is `db/verify/verify_schema.sql`. Migration 0004 adds a narrow server-only resolver for the signed-in user's active facility memberships; test it on a branch before applying it to production.

Tenant context must be set transaction-locally by trusted server code only after validating the signed-in user's active membership. Never trust a tenant ID supplied by a browser request. Normal application queries must use `caregrid_app`, not `caregrid_owner`.

## Authentication and authorization
The sign-in flow uses managed Neon Auth. Authentication alone does not grant access to an organization or facility. The dashboard checks the signed-in identity against Caregrid's active organization and facility membership records. Public registration is not linked from the application; users must be invited and assigned to a facility before they can enter the workspace. The managed Neon Auth service currently permits account creation at its API layer, so every data access path must continue to require an active Caregrid membership and tenant context.

## Local development
```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure the correct development branch values. Keep `.env.local` out of version control.

## Quality checks
```bash
npm run typecheck
npm run lint
npm run build
```

## Safety and privacy
Do not enter real patient information into the current demo UI. The database foundation and connectivity are in place, but clinical data workflows, full server-side role authorization, tenant-context transaction helpers, backup/restore validation, security testing and regulatory review must be completed before a real patient pilot. A successful deployment or database health check alone does not establish clinical readiness or compliance. Validate Nigeria Data Protection Act requirements, cross-border data transfers, retention, incident response and access controls with qualified advisers.
