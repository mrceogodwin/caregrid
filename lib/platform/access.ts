import "server-only";

import { getDb } from "@/lib/db";

export type VerifiedAuthUser = {
  id: string;
  email?: string | null;
  emailVerified?: boolean;
};

export async function getPlatformAdminRole(user: VerifiedAuthUser) {
  const email = user.email?.trim().toLowerCase();

  // Never authorize by an unverified email or a browser-supplied role.
  if (!user.id || !email || user.emailVerified !== true) return null;

  try {
    const db = getDb();
    const rows = await db<{ role: string }[]>`
      SELECT role
      FROM app_private.platform_admin_allowlist
      WHERE email = ${email}
        AND enabled = true
      LIMIT 1
    `;
    return rows[0]?.role === "platform_super_admin"
      ? "platform_super_admin"
      : null;
  } catch {
    // Missing migration or database failure must deny access.
    return null;
  }
}
