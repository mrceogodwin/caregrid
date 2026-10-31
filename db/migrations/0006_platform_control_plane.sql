BEGIN;

-- Platform control-plane reads and provisioning stay separate from tenant roles.
-- Every function re-validates a verified Neon Auth identity and the enabled
-- platform allowlist; no browser-provided role is trusted.

CREATE OR REPLACE FUNCTION app_private.platform_is_super_admin(
  p_user_id text,
  p_email text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, app_private, neon_auth
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM neon_auth."user" u
    JOIN app_private.platform_admin_allowlist a
      ON a.email = lower(btrim(p_email))
    WHERE u.id::text = p_user_id
      AND lower(u.email) = lower(btrim(p_email))
      AND u."emailVerified" IS TRUE
      AND a.enabled IS TRUE
      AND a.role = 'platform_super_admin'
  );
$function$;

CREATE OR REPLACE FUNCTION app_private.platform_list_organizations(
  p_user_id text,
  p_email text
)
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  organization_slug text,
  organization_status text,
  created_at timestamptz,
  facility_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $function$
  SELECT
    o.id,
    o.name,
    o.slug,
    o.status,
    o.created_at,
    count(f.id)::bigint
  FROM public.organizations o
  LEFT JOIN public.facilities f
    ON f.organization_id = o.id
  WHERE app_private.platform_is_super_admin(p_user_id, p_email)
  GROUP BY o.id, o.name, o.slug, o.status, o.created_at
  ORDER BY o.created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION app_private.platform_create_organization(
  p_user_id text,
  p_email text,
  p_organization_name text,
  p_organization_slug text,
  p_facility_name text,
  p_facility_code text,
  p_facility_type text
)
RETURNS TABLE (
  organization_id uuid,
  facility_id uuid,
  organization_name text,
  facility_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, app_private
AS $function$
DECLARE
  new_organization_id uuid;
  new_facility_id uuid;
  actor_id text;
BEGIN
  IF NOT app_private.platform_is_super_admin(p_user_id, p_email) THEN
    RAISE EXCEPTION 'platform authorization required' USING ERRCODE = '42501';
  END IF;

  IF length(trim(p_organization_name)) NOT BETWEEN 2 AND 160
     OR p_organization_slug !~ '^[a-z0-9][a-z0-9-]{1,62}$'
     OR length(trim(p_facility_name)) NOT BETWEEN 2 AND 160
     OR length(trim(p_facility_code)) NOT BETWEEN 2 AND 32
     OR p_facility_type NOT IN ('clinic', 'hospital', 'diagnostic_centre', 'other') THEN
    RAISE EXCEPTION 'invalid organization or facility details' USING ERRCODE = '22023';
  END IF;

  actor_id := p_user_id;

  INSERT INTO public.organizations (name, slug)
  VALUES (trim(p_organization_name), lower(trim(p_organization_slug)))
  RETURNING id INTO new_organization_id;

  INSERT INTO public.facilities (
    organization_id, name, code, facility_type, timezone
  )
  VALUES (
    new_organization_id,
    trim(p_facility_name),
    upper(trim(p_facility_code)),
    p_facility_type,
    'Africa/Lagos'
  )
  RETURNING id INTO new_facility_id;

  INSERT INTO public.audit_events (
    organization_id, facility_id, actor_user_id, action,
    resource_type, resource_id, outcome, metadata
  )
  VALUES (
    new_organization_id,
    new_facility_id,
    actor_id,
    'organization.provisioned',
    'organization',
    new_organization_id::text,
    'success',
    jsonb_build_object('facility_id', new_facility_id, 'source', 'platform_admin')
  );

  RETURN QUERY
  SELECT new_organization_id, new_facility_id,
         trim(p_organization_name), trim(p_facility_name);
END;
$function$;

REVOKE ALL ON FUNCTION app_private.platform_is_super_admin(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.platform_list_organizations(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION app_private.platform_create_organization(text, text, text, text, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION app_private.platform_is_super_admin(text, text) TO caregrid_app;
GRANT EXECUTE ON FUNCTION app_private.platform_list_organizations(text, text) TO caregrid_app;
GRANT EXECUTE ON FUNCTION app_private.platform_create_organization(text, text, text, text, text, text, text) TO caregrid_app;

COMMIT;
