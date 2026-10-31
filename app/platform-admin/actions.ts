"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { getPlatformAdminRole } from "@/lib/platform/access";

type ActionState = { error?: string; success?: string };

type SessionUser = {
  id: string;
  email?: string | null;
  emailVerified?: boolean;
};

export async function createOrganizationAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth.getSession() as {
    data?: { user?: SessionUser | null } | null;
    user?: SessionUser | null;
  };
  const user = session.data?.user ?? session.user ?? null;

  if (!user?.id || !user.email || user.emailVerified !== true) {
    return { error: "A verified platform administrator session is required." };
  }

  const role = await getPlatformAdminRole(user);
  if (role !== "platform_super_admin") {
    return { error: "You are not authorized to provision organizations." };
  }

  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const organizationSlug = String(formData.get("organizationSlug") ?? "").trim().toLowerCase();
  const facilityName = String(formData.get("facilityName") ?? "").trim();
  const facilityCode = String(formData.get("facilityCode") ?? "").trim().toUpperCase();
  const facilityType = String(formData.get("facilityType") ?? "clinic");

  if (organizationName.length < 2 || organizationName.length > 160) {
    return { error: "Organization name must be between 2 and 160 characters." };
  }
  if (!/^[a-z0-9][a-z0-9-]{1,62}$/.test(organizationSlug)) {
    return { error: "Use a lowercase slug with letters, numbers and hyphens (2–63 characters)." };
  }
  if (facilityName.length < 2 || facilityName.length > 160) {
    return { error: "Facility name must be between 2 and 160 characters." };
  }
  if (facilityCode.length < 2 || facilityCode.length > 32) {
    return { error: "Facility code must be between 2 and 32 characters." };
  }
  if (!["clinic", "hospital", "diagnostic_centre", "other"].includes(facilityType)) {
    return { error: "Choose a valid facility type." };
  }

  try {
    const db = getDb();
    const created = await db`
      SELECT *
      FROM app_private.platform_create_organization(
        ${user.id},
        ${user.email.trim().toLowerCase()},
        ${organizationName},
        ${organizationSlug},
        ${facilityName},
        ${facilityCode},
        ${facilityType}
      )
    `;

    if (!created.length) {
      return { error: "The organization could not be created. Please try again." };
    }

    revalidatePath("/platform-admin");
    return { success: `Created ${organizationName} and its first facility.` };
  } catch {
    return {
      error: "Could not create the organization. Check that the slug and facility code are unique.",
    };
  }
}


export async function activatePlatformAdminAction(_previous: { activated?: boolean; error?: string }): Promise<{ activated?: boolean; error?: string }> {
  const session = await auth.getSession() as {
    data?: { user?: SessionUser | null } | null;
    user?: SessionUser | null;
  };
  const user = session.data?.user ?? session.user ?? null;

  if (!user?.id || !user.email || user.emailVerified !== true) {
    return { error: "Complete Google or email verification before activating platform access." };
  }

  const db = getDb();
  try {
    const rows = await db<{ activated: boolean }[]>`
      SELECT app_private.platform_activate_super_admin(
        ${user.id},
        ${user.email.trim().toLowerCase()}
      ) AS activated
    `;
    revalidatePath("/platform-admin");
    return { activated: rows[0]?.activated === true };
  } catch {
    return { error: "This account is not eligible for platform activation. Contact the platform owner." };
  }
}
