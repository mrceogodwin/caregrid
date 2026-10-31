import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getPlatformAdminRole } from "@/lib/platform/access";

export const dynamic = "force-dynamic";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  emailVerified?: boolean;
};

export default async function PlatformAdminPage() {
  const result = await auth.getSession() as {
    data?: { user?: SessionUser | null } | null;
    user?: SessionUser | null;
  };
  const user = result.data?.user ?? result.user ?? null;

  if (!user) redirect("/auth/sign-in");

  const role = await getPlatformAdminRole(user);
  if (role !== "platform_super_admin") {
    return (
      <main className="access-state">
        <div className="access-mark">✚</div>
        <p className="auth-eyebrow">PLATFORM CONTROL</p>
        <h1>Access not authorized.</h1>
        <p>This account does not have verified Platform Super Admin access.</p>
        <p>Platform access requires a verified identity and an explicit platform-level authorization.</p>
        <a className="auth-submit" href="/dashboard">Return to workspace <span>→</span></a>
      </main>
    );
  }

  return (
    <main className="access-state">
      <div className="access-mark">✚</div>
      <p className="auth-eyebrow">CAREGRID · PLATFORM CONTROL</p>
      <h1>Platform administration.</h1>
      <p>Signed in as <strong>{user.email}</strong>.</p>
      <p>Your platform-level identity is verified. Organization provisioning, facility management, subscription controls and audited support tools will appear here as those workflows are completed.</p>
      <p className="security-note">No hospital patient records are exposed in this platform control area.</p>
    </main>
  );
}
