"use client";

import { useActionState } from "react";
import { createOrganizationAction } from "./actions";

const initialState: { error?: string; success?: string } = {};

export function CreateOrganizationForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, initialState);

  return (
    <form className="platform-form" action={formAction}>
      <div className="platform-form-heading">
        <span className="platform-form-icon">＋</span>
        <div>
          <h2>Provision an organization</h2>
          <p>Create a tenant and its first facility</p>
        </div>
      </div>

      <label>
        Organization name
        <input name="organizationName" required minLength={2} maxLength={160} placeholder="e.g. Cedarfield Medical Group" />
      </label>
      <label>
        Organization slug
        <input name="organizationSlug" required minLength={2} maxLength={63} pattern="[a-z0-9][a-z0-9-]{1,62}" placeholder="cedarfield-medical" />
        <small>Used in internal organization references.</small>
      </label>
      <div className="platform-form-row">
        <label>
          First facility name
          <input name="facilityName" required minLength={2} maxLength={160} placeholder="Main Clinic" />
        </label>
        <label>
          Facility code
          <input name="facilityCode" required minLength={2} maxLength={32} placeholder="CED-MAIN" />
        </label>
      </div>
      <label>
        Facility type
        <select name="facilityType" defaultValue="clinic">
          <option value="clinic">Clinic</option>
          <option value="hospital">Hospital</option>
          <option value="diagnostic_centre">Diagnostic centre</option>
          <option value="other">Other</option>
        </select>
      </label>

      {state.error && <p className="platform-form-error" role="alert">{state.error}</p>}
      {state.success && <p className="platform-form-success" role="status">{state.success}</p>}
      <button className="platform-primary-button" type="submit" disabled={pending}>
        {pending ? "Creating organization…" : "Create organization"}
        <span>→</span>
      </button>
      <p className="platform-form-footnote">Creation is audited. Hospital staff access is granted separately through the invitation workflow.</p>
    </form>
  );
}
