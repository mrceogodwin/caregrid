import Link from "next/link";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="auth-brand" href="/">
          <span>✚</span><strong>caregrid<span>.</span></strong>
        </Link>
        <div className="auth-eyebrow">SECURE FACILITY ACCESS</div>
        <h1>Welcome back.</h1>
        <p className="auth-intro">Sign in with the account provided by your Caregrid facility administrator.</p>
        <SignInForm />
        <div className="auth-footer"><span>Protected workspace</span><span>Caregrid Health Systems</span></div>
      </section>
    </main>
  );
}
