import "server-only";
import { getDb } from "@/lib/db";

export type FacilityAccess = {
  organization_id: string;
  membership_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
  facility_id: string;
  facility_name: string;
};

export async function getUserFacilities(userId: string): Promise<FacilityAccess[]> {
  if (!userId || userId.length > 255) return [];
  const db = getDb();
  const rows = await db`
    SELECT organization_id, membership_id, organization_name,
      organization_slug, role, facility_id, facility_name
    FROM app_private.resolve_user_facilities(${userId})
  `;
  return rows as unknown as FacilityAccess[];
}
