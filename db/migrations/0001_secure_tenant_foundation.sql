-- Caregrid secure tenant foundation
-- Apply only after DATABASE_URL points to the intended Neon database.
-- Tenant context must be set transaction-locally by trusted server code:
--   SELECT set_config('app.tenant_id', '<authorized-organization-uuid>', true);
-- Never accept tenant IDs directly from an untrusted client.

BEGIN;

CREATE SCHEMA IF NOT EXISTS app_private;

CREATE OR REPLACE FUNCTION app_private.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  code text NOT NULL CHECK (length(trim(code)) BETWEEN 2 AND 32),
  facility_type text NOT NULL DEFAULT 'clinic'
    CHECK (facility_type IN ('clinic', 'hospital', 'diagnostic_centre', 'other')),
  timezone text NOT NULL DEFAULT 'Africa/Lagos',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facilities_org_id_id_unique UNIQUE (organization_id, id),
  CONSTRAINT facilities_org_code_unique UNIQUE (organization_id, code)
);

CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 120),
  code text NOT NULL CHECK (length(trim(code)) BETWEEN 2 AND 32),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT departments_facility_tenant_fk
    FOREIGN KEY (organization_id, facility_id)
    REFERENCES facilities (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT departments_facility_code_unique UNIQUE (facility_id, code),
  CONSTRAINT departments_org_id_id_unique UNIQUE (organization_id, id)
);

-- user_id is the stable subject from the future authentication provider.
-- No password or credential material is stored in this table.
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id text NOT NULL CHECK (length(trim(user_id)) BETWEEN 1 AND 255),
  role text NOT NULL CHECK (role IN (
    'owner', 'admin', 'receptionist', 'nurse', 'doctor',
    'pharmacist', 'lab_staff', 'cashier', 'auditor'
  )),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT memberships_org_user_unique UNIQUE (organization_id, user_id),
  CONSTRAINT memberships_org_id_id_unique UNIQUE (organization_id, id)
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  patient_number text NOT NULL CHECK (length(trim(patient_number)) BETWEEN 2 AND 40),
  first_name text NOT NULL CHECK (length(trim(first_name)) BETWEEN 1 AND 100),
  middle_name text CHECK (middle_name IS NULL OR length(middle_name) <= 100),
  last_name text NOT NULL CHECK (length(trim(last_name)) BETWEEN 1 AND 100),
  date_of_birth date,
  sex text CHECK (sex IS NULL OR sex IN ('female', 'male', 'intersex', 'unknown', 'not_recorded')),
  phone_e164 text,
  email text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deceased')),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patients_facility_tenant_fk
    FOREIGN KEY (organization_id, facility_id)
    REFERENCES facilities (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT patients_facility_number_unique UNIQUE (facility_id, patient_number),
  CONSTRAINT patients_org_id_id_unique UNIQUE (organization_id, id)
);

CREATE INDEX IF NOT EXISTS patients_org_name_idx
  ON patients (organization_id, lower(last_name), lower(first_name));
CREATE INDEX IF NOT EXISTS patients_org_phone_idx
  ON patients (organization_id, phone_e164)
  WHERE phone_e164 IS NOT NULL;

CREATE TABLE IF NOT EXISTS patient_identifiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  patient_id uuid NOT NULL,
  facility_id uuid NOT NULL,
  identifier_type text NOT NULL CHECK (length(trim(identifier_type)) BETWEEN 2 AND 40),
  identifier_value text NOT NULL CHECK (length(trim(identifier_value)) BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT patient_identifiers_patient_tenant_fk
    FOREIGN KEY (organization_id, patient_id)
    REFERENCES patients (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT patient_identifiers_facility_tenant_fk
    FOREIGN KEY (organization_id, facility_id)
    REFERENCES facilities (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT patient_identifiers_facility_value_unique
    UNIQUE (facility_id, identifier_type, identifier_value)
);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid,
  actor_user_id text NOT NULL,
  action text NOT NULL CHECK (length(trim(action)) BETWEEN 2 AND 120),
  resource_type text NOT NULL CHECK (length(trim(resource_type)) BETWEEN 2 AND 80),
  resource_id text,
  outcome text NOT NULL DEFAULT 'success' CHECK (outcome IN ('success', 'denied', 'failure')),
  request_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT audit_events_facility_tenant_fk
    FOREIGN KEY (organization_id, facility_id)
    REFERENCES facilities (organization_id, id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS audit_events_org_time_idx
  ON audit_events (organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_org_resource_idx
  ON audit_events (organization_id, resource_type, resource_id);

-- Tenant isolation is enforced in PostgreSQL as well as in application code.
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS organizations_tenant_isolation ON organizations;
CREATE POLICY organizations_tenant_isolation ON organizations
  USING (id = app_private.current_tenant_id())
  WITH CHECK (id = app_private.current_tenant_id());

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'facilities', 'departments', 'memberships', 'patients',
    'patient_identifiers', 'audit_events'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', table_name);
    EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', table_name);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (organization_id = app_private.current_tenant_id()) WITH CHECK (organization_id = app_private.current_tenant_id())',
      table_name
    );
  END LOOP;
END $$;

-- Audit events are append-only for normal application roles.
CREATE OR REPLACE FUNCTION app_private.prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit events are append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_events_immutable ON audit_events;
CREATE TRIGGER audit_events_immutable
  BEFORE UPDATE OR DELETE ON audit_events
  FOR EACH ROW EXECUTE FUNCTION app_private.prevent_audit_event_mutation();

COMMIT;
