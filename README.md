# Caregrid

Caregrid is a multi-tenant hospital operations platform being built for private clinics, diagnostic centres and small-to-medium hospitals, starting with Nigerian healthcare workflows.

## Current status
The initial Next.js App Router scaffold includes a responsive dashboard, workspace navigation, overview metrics, a patient directory and a demo-only registration interaction. All metrics and sample patient rows are illustrative. They are not medical records and must not be used for real patient care.

## Technology
- Next.js App Router, React and TypeScript
- Neon PostgreSQL: planned; project provisioning and application connection are not yet verified
- Vercel hosting
- Planned private object storage: Cloudflare R2
- Planned transactional notifications: Brevo

## Local development
```bash
npm install
npm run dev
```

## Quality checks
```bash
npm run typecheck
npm run lint
npm run build
```

## Build sequence
1. Secure foundation, tenant-aware database schema, migrations and health checks.
2. Authentication, organization membership and server-enforced role permissions.
3. Patient registration, search, duplicate warnings, appointments and queue.
4. Clinical encounters, lab orders/results and pharmacy inventory.
5. Billing, receipts, reconciliation, reports and audit trails.
6. Private file storage, notification jobs, backup/restore tests and pilot readiness.

## Safety and privacy
Do not enter real patient information into the current demo UI. Authentication, authorization, database persistence, audit logging and production security controls are not complete. A successful deployment alone does not establish regulatory compliance or clinical readiness. Before a real pilot, validate Nigeria Data Protection Act requirements, cross-border data transfers, retention, incident response, access controls and backup/recovery with qualified advisers.