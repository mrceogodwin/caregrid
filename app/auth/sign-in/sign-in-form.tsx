"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });
      if (result.error) {
        setError(result.error.message || "Unable to sign in. Check your details and try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label>
        Work email
        <input type="email" autoComplete="username" required value={email}
          onChange={(event) => setEmail(event.target.value)} placeholder="name@facility.com" />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" required minLength={8}
          value={password} onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password" />
      </label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="auth-submit" type="submit" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign in securely"} <span>→</span>
      </button>
      <p className="auth-help">Caregrid accounts are provisioned by a facility administrator. Public registration is not offered in this workspace.</p>
    </form>
  );
}
