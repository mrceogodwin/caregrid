import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/lib/db";
import { getPlatformAdminRole } from "@/lib/platform/access";
import { CreateOrganizationForm } from "./create-organization-form";

export const dynamic = "force-dynamic";

type SessionUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  emailVerified?: boolean;
};

type PlatformOrganization = {
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  organization_status: string;
  created_at: string | Date;
  facility_count: string | number;
};

export default async function PlatformAdminPage() {
  const result = await auth.getSession() as {
    data?: { user?: SessionUser | null } | null;
    user?: SessionUser | null;
  };
  const user = result.data?.user ?? result.user ?? null;

  if (!user) redirect("/auth/sign-in");

  const role = await getPlatformAdminRole(user);
  if (role !== "platform_super_admin" || !user.email) {
    return (
      <main className="access-state">
        <div className="access-mark">✚</div>
        <p className="auth-eyebrow">PLATFORM CONTROL</p>
        <h1>Access not authorized.</h1>
        <p>This account does not have verified Platform Super Admin access.</p>
        <p>Platform access requires a verified identity and an enabled platform authorization.</p>
        <a className="auth-submit" href="/auth/sign-in">Return to sign in <span>→</span></a>
      </main>
    );
  }

  const db = getDb();
  const organizations = await db<PlatformOrganization[]>`
    SELECT *
    FROM app_private.platform_list_organizations(
      ${user.id},
      ${user.email.trim().toLowerCase()}
    )
  `;

  const facilityCount = organizations.reduce(
    (total, organization) => total + Number(organization.facility_count || 0),
    0,
  );
  const activeCount = organizations.filter(
    (organization) => organization.organization_status === "active",
  ).length;

  return (
    <div className="platform-layout">
      <aside className="platform-sidebar">
        <a className="platform-brand" href="/platform-admin">
          <span className="platform-brand-mark">✚</span>
          <span>caregrid<small>PLATFORM CONTROL</small></span>
        </a>
        <div className="platform-nav-label">WORKSPACE</div>
        <a className="platform-nav-item active" href="/platform-admin"><span>▦</span> Overview</a>
        <a className="platform-nav-item" href="#organizations"><span>▤</span> Organizations</a>
        <a className="platform-nav-item" href="#provision"><span>＋</span> Provisioning</a>
        <div className="platform-sidebar-spacer" />
        <div className="platform-user">
          <span className="platform-user-avatar">{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
          <span><b>{user.name || "Platform admin"}</b><small>{user.email}</small></span>
        </div>
      </aside>

      <main className="platform-main">
        <header className="platform-topbar">
          <div><span>Caregrid</span><i>/</i><b>Platform overview</b></div>
          <span className="platform-secure-label"><i /> Secure platform session</span>
        </header>

        <section className="platform-content">
          <div className="platform-page-heading">
            <div>
              <p className="platform-eyebrow">PLATFORM OPERATIONS</p>
              <h1>Good to see you.</h1>
              <p>Manage organizations and facilities across the Caregrid network.</p>
            </div>
            <a className="platform-primary-button platform-heading-button" href="#provision">＋ New organization</a>
          </div>

          <div className="platform-notice">
            <span>✦</span>
            <div><b>Platform-level access</b><p>This workspace manages tenants and facilities. Hospital patient records are not displayed here.</p></div>
            <small>VERIFIED ADMIN</small>
          </div>

          <div className="platform-stats">
            <article><span>Organizations</span><strong>{organizations.length}</strong><small>Registered tenants</small></article>
            <article><span>Active organizations</span><strong>{activeCount}</strong><small>Currently enabled</small></article>
            <article><span>Facilities</span><strong>{facilityCount}</strong><small>Across all organizations</small></article>
            <article><span>Platform role</span><strong className="platform-role-value">Super Admin</strong><small>Verified account</small></article>
          </div>

          <div className="platform-work-grid">
            <section className="platform-panel" id="organizations">
              <div className="platform-panel-heading">
                <div><h2>Organizations</h2><p>Tenant accounts registered on Caregrid</p></div>
                <span>{organizations.length} total</span>
              </div>
              {organizations.length === 0 ? (
                <div className="platform-empty">
                  <span>▤</span>
                  <b>No organizations yet</b>
                  <p>Provision your first organization and facility to begin onboarding a hospital.</p>
                  <a href="#provision">Create the first organization →</a>
                </div>
              ) : (
                <div className="platform-table-wrap">
                  <table className="platform-table">
                    <thead><tr><th>ORGANIZATION</th><th>FACILITIES</th><th>STATUS</th><th>CREATED</th></tr></thead>
                    <tbody>
                      {organizations.map((organization) => (
                        <tr key={organization.organization_id}>
                          <td><b>{organization.organization_name}</b><small>{organization.organization_slug}</small></td>
                          <td>{organization.facility_count}</td>
                          <td><span className={organization.organization_status === "active" ? "platform-status active" : "platform-status"}>{organization.organization_status}</span></td>
                          <td>{new Date(organization.created_at).toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="platform-panel platform-provision-panel" id="provision">
              <CreateOrganizationForm />
            </section>
          </div>
          <p className="platform-footer-note">Caregrid Platform Control · Organization creation is recorded in the tenant audit trail.</p>
        </section>
      </main>
    </div>
  );
}
