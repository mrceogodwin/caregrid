-- Resolve a signed-in identity to active organization and facility memberships.
-- This narrow SECURITY DEFINER function is executable only by the server role.

CREATE OR REPLACE FUNCTION app_private.resolve_user_facilities(p_user_id text)
RETURNS TABLE (
  organization_id uuid,
  membership_id uuid,
  organization_name text,
  organization_slug text,
  role text,
  facility_id uuid,
  facility_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    m.organization_id,
    m.id AS membership_id,
    o.name AS organization_name,
    o.slug AS organization_slug,
    m.role,
    fm.facility_id,
    f.name AS facility_name
  FROM public.memberships AS m
  JOIN public.organizations AS o ON o.id = m.organization_id
  JOIN public.facility_memberships AS fm
    ON fm.organization_id = m.organization_id
   AND fm.membership_id = m.id
  JOIN public.facilities AS f
    ON f.organization_id = fm.organization_id
   AND f.id = fm.facility_id
  WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND o.status = 'active'
    AND fm.status = 'active'
    AND f.status = 'active'
  ORDER BY o.name, f.name;
$$;

REVOKE ALL ON FUNCTION app_private.resolve_user_facilities(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION app_private.resolve_user_facilities(text) TO caregrid_app;
