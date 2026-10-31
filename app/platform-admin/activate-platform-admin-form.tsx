"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { activatePlatformAdminAction } from "./actions";

const initialState: { activated?: boolean; error?: string } = {};

export function ActivatePlatformAdminForm() {
  const [state, formAction, pending] = useActionState(activatePlatformAdminAction, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.activated) router.refresh();
  }, [state.activated, router]);

  return (
    <form className="platform-activation-form" action={formAction}>
      {state.error && <p className="platform-form-error" role="alert">{state.error}</p>}
      <button className="platform-primary-button" type="submit" disabled={pending}>
        {pending ? "Verifying access…" : "Activate Platform Super Admin"}
        <span>→</span>
      </button>
    </form>
  );
}
