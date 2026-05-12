"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("nodemailer", { email, redirectTo: "/account", redirect: false });
      if ((res as any)?.error) {
        setError("Couldn't send sign-in email. Please try again or contact support.");
      } else {
        setSent(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function password_login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await signIn("credentials", { email, password, redirectTo: "/account", redirect: false });
      if ((res as any)?.error || !(res as any)?.ok) {
        setError("Incorrect email or password.");
      } else {
        window.location.href = "/account";
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="font-serif font-black text-4xl tracking-tight">Sign in.</h1>

      <div className="mt-8 flex border-b border-ink/15">
        <button
          type="button"
          onClick={() => { setTab("email"); setSent(false); setError(null); }}
          className={`flex-1 py-3 text-[12px] uppercase tracking-[0.18em] font-semibold ${tab === "email" ? "border-b-2 border-ink" : "text-ink/50"}`}>
          Email link
        </button>
        <button
          type="button"
          onClick={() => { setTab("password"); setSent(false); setError(null); }}
          className={`flex-1 py-3 text-[12px] uppercase tracking-[0.18em] font-semibold ${tab === "password" ? "border-b-2 border-ink" : "text-ink/50"}`}>
          Password
        </button>
      </div>

      {tab === "email" ? (
        sent ? (
          <p className="mt-8 p-4 border border-ink">Check {email} for your sign-in link.</p>
        ) : (
          <form onSubmit={magic} className="mt-8 space-y-3">
            <p className="text-sm text-ink/70">We'll email you a one-tap sign-in link. No password to remember.</p>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-ink px-4 py-3"/>
            <button className="btn-primary w-full justify-center" disabled={busy}>
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
          </form>
        )
      ) : (
        <form onSubmit={password_login} className="mt-8 space-y-3">
          <p className="text-sm text-ink/70">Admin sign-in. Customers should use the email link.</p>
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-ink px-4 py-3"/>
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
            placeholder="password"
            className="w-full border border-ink px-4 py-3"/>
          <button className="btn-primary w-full justify-center" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
    </section>
  );
}
