BEGIN;

-- Platform-level authorization is deliberately separate from hospital memberships.
-- This allowlist is read only by trusted server code after Neon Auth verifies the session.
CREATE TABLE IF NOT EXISTS app_private.platform_admin_allowlist (
  email text PRIMARY KEY,
  role text NOT NULL CHECK (role IN ('platform_super_admin')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_admin_allowlist_email_normalized
    CHECK (email = lower(btrim(email)) AND position('@' in email) > 1)
);

REVOKE ALL ON TABLE app_private.platform_admin_allowlist FROM PUBLIC;
GRANT SELECT ON TABLE app_private.platform_admin_allowlist TO caregrid_app;

INSERT INTO app_private.platform_admin_allowlist (email, role, enabled)
VALUES ('squadempireng@gmail.com', 'platform_super_admin', false)
ON CONFLICT (email) DO UPDATE
SET role = EXCLUDED.role,
    enabled = false;

COMMIT;
