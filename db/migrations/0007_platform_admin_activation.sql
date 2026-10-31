BEGIN;

CREATE TABLE IF NOT EXISTS app_private.platform_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id text NOT NULL,
  action text NOT NULL,
  subject_email text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  occurred_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE app_private.platform_audit_events FROM PUBLIC;
REVOKE ALL ON TABLE app_private.platform_audit_events FROM caregrid_app;

CREATE OR REPLACE FUNCTION app_private.platform_activate_super_admin(
  p_user_id text,
  p_email text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, app_private, neon_auth
AS $function$
DECLARE
  normalized_email text := lower(btrim(p_email));
  identity_verified boolean;
  was_enabled boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM neon_auth."user" u
    WHERE u.id::text = p_user_id
      AND lower(u.email) = normalized_email
      AND u."emailVerified" IS TRUE
  ) INTO identity_verified;

  IF NOT identity_verified THEN
    RAISE EXCEPTION 'verified identity required' USING ERRCODE = '42501';
  END IF;

  SELECT a.enabled
  INTO was_enabled
  FROM app_private.platform_admin_allowlist a
  WHERE a.email = normalized_email
    AND a.role = 'platform_super_admin'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'platform administrator invitation not found' USING ERRCODE = '42501';
  END IF;

  IF was_enabled THEN
    RETURN true;
  END IF;

  UPDATE app_private.platform_admin_allowlist
  SET enabled = true
  WHERE email = normalized_email
    AND role = 'platform_super_admin'
    AND enabled = false;

  INSERT INTO app_private.platform_audit_events (
    actor_user_id, action, subject_email, metadata
  )
  VALUES (
    p_user_id,
    'platform_super_admin.activated',
    normalized_email,
    jsonb_build_object('method', 'verified_identity_self_activation')
  );

  RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION app_private.platform_activate_super_admin(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.platform_activate_super_admin(text, text) TO caregrid_app;

COMMIT;
