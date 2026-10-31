-- Caregrid organization access and invitation foundation
-- Requires 0001_secure_tenant_foundation.sql and 0002_clinical_workflows.sql.
-- Authentication credentials remain with the external identity provider.
-- Invitation tokens must be generated with a cryptographically secure RNG;
-- store only SHA-256 hashes and send raw tokens once to the intended recipient.

BEGIN;

CREATE TABLE IF NOT EXISTS facility_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  facility_id uuid NOT NULL,
  membership_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facility_memberships_facility_tenant_fk
    FOREIGN KEY (organization_id, facility_id)
    REFERENCES facilities (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT facility_memberships_membership_tenant_fk
    FOREIGN KEY (organization_id, membership_id)
    REFERENCES memberships (organization_id, id) ON DELETE RESTRICT,
  CONSTRAINT facility_memberships_unique UNIQUE (facility_id, membership_id),
  CONSTRAINT facility_memberships_org_id_unique UNIQUE (organization_id, id)
);

CREATE INDEX IF NOT EXISTS facility_memberships_org_membership_idx
  ON facility_memberships (organization_id, membership_id, status);

CREATE TABLE IF NOT EXISTS membership_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  email_normalized text NOT NULL
    CHECK (email_normalized = lower(trim(email_normalized))
      AND email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  role text NOT NULL CHECK (role IN (
    'admin', 'receptionist', 'nurse', 'doctor',
    'pharmacist', 'lab_staff', 'cashier', 'auditor'
  )),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  invited_by text NOT NULL,
  expires_at timestamptz NOT NULL,
  accepted_by text,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT membership_invitations_acceptance_consistency CHECK (
    (status = 'accepted' AND accepted_by IS NOT NULL AND accepted_at IS NOT NULL)
    OR (status <> 'accepted' AND accepted_by IS NULL AND accepted_at IS NULL)
  ),
  CONSTRAINT membership_invitations_expiry_check CHECK (expires_at > created_at),
  CONSTRAINT membership_invitations_org_id_unique UNIQUE (organization_id, id)
);

CREATE INDEX IF NOT EXISTS membership_invitations_org_status_idx
  ON membership_invitations (organization_id, status, expires_at DESC);

ALTER TABLE facility_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_memberships FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON facility_memberships;
CREATE POLICY tenant_isolation ON facility_memberships
  USING (organization_id = app_private.current_tenant_id())
  WITH CHECK (organization_id = app_private.current_tenant_id());

ALTER TABLE membership_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_invitations FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tenant_isolation ON membership_invitations;
CREATE POLICY tenant_isolation ON membership_invitations
  USING (organization_id = app_private.current_tenant_id())
  WITH CHECK (organization_id = app_private.current_tenant_id());

COMMIT;
