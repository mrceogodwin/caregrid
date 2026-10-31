import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getUserFacilities } from "@/lib/tenant/membership";
import DashboardClient from "./dashboard-client";

export const dynamic = "force-dynamic";

type SessionUser = { id: string; email?: string; name?: string | null };

export default async function DashboardPage() {
  const result = await auth.getSession() as {
    data?: { user?: SessionUser | null } | null;
    user?: SessionUser | null;
  };
  const user = result.data?.user ?? result.user ?? null;

  if (!user) redirect("/auth/sign-in");

  const facilities = await getUserFacilities(user.id);

  if (facilities.length === 0) {
    return (
      <main className="access-state">
        <div className="access-mark">✚</div>
        <p className="auth-eyebrow">ACCOUNT ACCESS</p>
        <h1>Your account is not assigned yet.</h1>
        <p>You are signed in as <strong>{user.email ?? user.name ?? "your account"}</strong>, but no active Caregrid facility membership was found.</p>
        <p>Ask your Caregrid organization administrator to invite you and assign your facility access.</p>
        <a className="auth-submit" href="/auth/sign-in">Return to sign in <span>→</span></a>
      </main>
    );
  }

  if (facilities.length > 1) {
    return (
      <main className="access-state">
        <div className="access-mark">✚</div>
        <p className="auth-eyebrow">FACILITY ACCESS</p>
        <h1>Choose your workspace.</h1>
        <p>Your account has access to multiple facilities. The facility switcher is being completed before multi-facility access is enabled.</p>
        <ul>{facilities.map((facility) => <li key={facility.facility_id}>{facility.organization_name} — {facility.facility_name}</li>)}</ul>
      </main>
    );
  }

  const facility = facilities[0];
  return (
    <DashboardClient
      facilityName={facility.facility_name}
      userName={user.name || user.email || "Caregrid user"}
      role={facility.role}
    />
  );
}
