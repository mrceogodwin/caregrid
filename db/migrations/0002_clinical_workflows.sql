-- Caregrid clinical workflow foundation
-- Requires 0001_secure_tenant_foundation.sql.
-- Apply only after reviewing against the intended Neon database.

BEGIN;

CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  department_id uuid,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 20 CHECK (duration_minutes BETWEEN 5 AND 480),
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'confirmed', 'checked_in', 'in_consultation', 'completed', 'cancelled', 'no_show')),
  reason_for_visit text CHECK (reason_for_visit IS NULL OR length(reason_for_visit) <= 1000),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT appointments_patient_facility_fk
    FOREIGN KEY (organization_id, facility_id, patient_id)
    REFERENCES patients (organization_id, facility_id, id) ON DELETE RESTRICT,
  CONSTRAINT appointments_department_tenant_fk
    FOREIGN KEY (organization_id, facility_id, department_id)
    REFERENCES departments (organization_id, facility_id, id) ON DELETE RESTRICT,
  CONSTRAINT appointments_org_facility_id_unique UNIQUE (organization_id, facility_id, id),
  CONSTRAINT appointments_org_facility_patient_unique UNIQUE (organization_id, facility_id, id, patient_id)
);

CREATE INDEX IF NOT EXISTS appointments_facility_schedule_idx
  ON appointments (facility_id, scheduled_at);
CREATE INDEX IF NOT EXISTS appointments_patient_history_idx
  ON appointments (organization_id, patient_id, scheduled_at DESC);

CREATE TABLE IF NOT EXISTS encounters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  appointment_id uuid,
  attending_user_id text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed', 'amended', 'voided')),
  chief_complaint text CHECK (chief_complaint IS NULL OR length(chief_complaint) <= 2000),
  history_of_present_illness text CHECK (history_of_present_illness IS NULL OR length(history_of_present_illness) <= 10000),
  assessment text CHECK (assessment IS NULL OR length(assessment) <= 10000),
  plan text CHECK (plan IS NULL OR length(plan) <= 10000),
  signed_by text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT encounters_patient_facility_fk
    FOREIGN KEY (organization_id, facility_id, patient_id)
    REFERENCES patients (organization_id, facility_id, id) ON DELETE RESTRICT,
  CONSTRAINT encounters_appointment_tenant_fk
    FOREIGN KEY (organization_id, facility_id, appointment_id, patient_id)
    REFERENCES appointments (organization_id, facility_id, id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT encounters_signature_consistency CHECK (
    (status IN ('draft', 'voided') AND signed_by IS NULL AND signed_at IS NULL)
    OR (status IN ('signed', 'amended') AND signed_by IS NOT NULL AND signed_at IS NOT NULL)
  ),
  CONSTRAINT encounters_org_facility_id_unique UNIQUE (organization_id, facility_id, id),
  CONSTRAINT encounters_org_facility_patient_unique UNIQUE (organization_id, facility_id, id, patient_id)
);

CREATE INDEX IF NOT EXISTS encounters_patient_history_idx
  ON encounters (organization_id, patient_id, created_at DESC);

CREATE TABLE IF NOT EXISTS encounter_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  encounter_id uuid NOT NULL,
  amended_by text NOT NULL,
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 5 AND 1000),
  amendment text NOT NULL CHECK (length(trim(amendment)) BETWEEN 1 AND 10000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT encounter_amendments_encounter_fk
    FOREIGN KEY (organization_id, facility_id, encounter_id)
    REFERENCES encounters (organization_id, facility_id, id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  encounter_id uuid NOT NULL,
  recorded_by text NOT NULL,
  systolic_bp integer CHECK (systolic_bp IS NULL OR systolic_bp BETWEEN 40 AND 300),
  diastolic_bp integer CHECK (diastolic_bp IS NULL OR diastolic_bp BETWEEN 20 AND 200),
  pulse_bpm integer CHECK (pulse_bpm IS NULL OR pulse_bpm BETWEEN 20 AND 250),
  respiratory_rate integer CHECK (respiratory_rate IS NULL OR respiratory_rate BETWEEN 4 AND 80),
  temperature_c numeric(4,1) CHECK (temperature_c IS NULL OR temperature_c BETWEEN 25 AND 45),
  oxygen_saturation_pct numeric(5,2) CHECK (oxygen_saturation_pct IS NULL OR oxygen_saturation_pct BETWEEN 0 AND 100),
  weight_kg numeric(6,2) CHECK (weight_kg IS NULL OR weight_kg BETWEEN 0.2 AND 500),
  height_cm numeric(6,2) CHECK (height_cm IS NULL OR height_cm BETWEEN 20 AND 260),
  recorded_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT observations_patient_facility_fk
    FOREIGN KEY (organization_id, facility_id, patient_id)
    REFERENCES patients (organization_id, facility_id, id) ON DELETE RESTRICT,
  CONSTRAINT observations_encounter_fk
    FOREIGN KEY (organization_id, facility_id, encounter_id, patient_id)
    REFERENCES encounters (organization_id, facility_id, id, patient_id) ON DELETE RESTRICT,
  CONSTRAINT observations_org_id_unique UNIQUE (organization_id, id)
);

CREATE INDEX IF NOT EXISTS observations_encounter_time_idx
  ON observations (organization_id, encounter_id, recorded_at DESC);

-- Signed clinical notes cannot be edited or deleted in place. Corrections belong
-- in encounter_amendments so the original signed record remains intact.
CREATE OR REPLACE FUNCTION app_private.prevent_signed_encounter_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('signed', 'amended') THEN
    RAISE EXCEPTION 'signed encounters are immutable; create an amendment';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'encounters cannot be deleted; use a controlled void workflow';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS encounters_signed_immutable ON encounters;
CREATE TRIGGER encounters_signed_immutable
  BEFORE UPDATE OR DELETE ON encounters
  FOR EACH ROW EXECUTE FUNCTION app_private.prevent_signed_encounter_mutation();

CREATE OR REPLACE FUNCTION app_private.prevent_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'this record is append-only';
END;
$$;

DROP TRIGGER IF EXISTS encounter_amendments_immutable ON encounter_amendments;
CREATE TRIGGER encounter_amendments_immutable
  BEFORE UPDATE OR DELETE ON encounter_amendments
  FOR EACH ROW EXECUTE FUNCTION app_private.prevent_append_only_mutation();

DROP TRIGGER IF EXISTS observations_immutable ON observations;
CREATE TRIGGER observations_immutable
  BEFORE UPDATE OR DELETE ON observations
  FOR EACH ROW EXECUTE FUNCTION app_private.prevent_append_only_mutation();

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'appointments', 'encounters', 'encounter_amendments', 'observations'
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

COMMIT;
