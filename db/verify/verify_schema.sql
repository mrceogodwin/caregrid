-- Caregrid schema verification
-- Run after applying migrations 0001, 0002 and 0003 to the intended Neon database:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/verify/verify_schema.sql
--
-- This script is read-only. It fails fast if a required table, RLS policy,
-- constraint, or immutability trigger is missing.

DO $verify$
DECLARE
  required_table text;
  required_tables text[] := ARRAY[
    'organizations', 'facilities', 'departments', 'memberships',
    'patients', 'patient_identifiers', 'audit_events',
    'appointments', 'encounters', 'encounter_amendments', 'observations',
    'facility_memberships', 'membership_invitations'
  ];
  missing_count integer;
  required_constraints text[][] := ARRAY[
    ARRAY['departments', 'departments_facility_tenant_fk'],
    ARRAY['departments', 'departments_org_facility_id_unique'],
    ARRAY['patients', 'patients_facility_tenant_fk'],
    ARRAY['patients', 'patients_org_facility_id_unique'],
    ARRAY['patient_identifiers', 'patient_identifiers_patient_facility_fk'],
    ARRAY['appointments', 'appointments_patient_facility_fk'],
    ARRAY['appointments', 'appointments_department_tenant_fk'],
    ARRAY['appointments', 'appointments_org_facility_patient_unique'],
    ARRAY['encounters', 'encounters_patient_facility_fk'],
    ARRAY['encounters', 'encounters_appointment_tenant_fk'],
    ARRAY['encounters', 'encounters_org_facility_patient_unique'],
    ARRAY['observations', 'observations_patient_facility_fk'],
    ARRAY['observations', 'observations_encounter_fk'],
    ARRAY['facility_memberships', 'facility_memberships_facility_tenant_fk'],
    ARRAY['facility_memberships', 'facility_memberships_membership_tenant_fk']
  ];
  required_constraint text[];
BEGIN
  FOREACH required_table IN ARRAY required_tables LOOP
    IF to_regclass(format('public.%I', required_table)) IS NULL THEN
      RAISE EXCEPTION 'Caregrid schema verification failed: missing table public.%', required_table;
    END IF;
  END LOOP;

  SELECT count(*) INTO missing_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY(required_tables)
    AND (NOT c.relrowsecurity OR NOT c.relforcerowsecurity);

  IF missing_count <> 0 THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: % tables are missing enabled/forced RLS', missing_count;
  END IF;

  SELECT count(*) INTO missing_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relname = ANY(required_tables)
    AND NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = n.nspname
        AND p.tablename = c.relname
        AND p.policyname IN ('tenant_isolation', 'organizations_tenant_isolation')
    );

  IF missing_count <> 0 THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: % tables are missing tenant policies', missing_count;
  END IF;

  FOREACH required_constraint IN ARRAY required_constraints LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace ns ON ns.oid = rel.relnamespace
      WHERE ns.nspname = 'public'
        AND rel.relname = required_constraint[1]
        AND con.conname = required_constraint[2]
    ) THEN
      RAISE EXCEPTION 'Caregrid schema verification failed: missing constraint %.%',
        required_constraint[1], required_constraint[2];
    END IF;
  END LOOP;

  IF to_regprocedure('app_private.current_tenant_id()') IS NULL THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: tenant context function is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.audit_events'::regclass
      AND tgname = 'audit_events_immutable'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: audit immutability trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.encounters'::regclass
      AND tgname = 'encounters_signed_immutable'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: signed encounter trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.observations'::regclass
      AND tgname = 'observations_immutable'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: observation immutability trigger is missing';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.encounter_amendments'::regclass
      AND tgname = 'encounter_amendments_immutable'
      AND NOT tgisinternal
  ) THEN
    RAISE EXCEPTION 'Caregrid schema verification failed: amendment immutability trigger is missing';
  END IF;

  RAISE NOTICE 'Caregrid schema verification passed: 13 tables, forced RLS, tenant policies and immutable-record triggers are present.';
END
$verify$;

SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  count(p.policyname) AS policy_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policies p
  ON p.schemaname = n.nspname
 AND p.tablename = c.relname
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'organizations', 'facilities', 'departments', 'memberships',
    'patients', 'patient_identifiers', 'audit_events',
    'appointments', 'encounters', 'encounter_amendments', 'observations',
    'facility_memberships', 'membership_invitations'
  )
GROUP BY c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;
