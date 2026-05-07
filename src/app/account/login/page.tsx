"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    await signIn("resend", { email, redirectTo: "/account" });
    setSent(true);
  }

  return (
    <section className="max-w-md mx-auto px-6 py-20">
      <p className="eyebrow mb-2">Account</p>
      <h1 className="font-serif font-black text-4xl tracking-tight">Sign in.</h1>
      <p className="text-sm text-ink/70 mt-2">We'll email you a one-tap sign-in link. No password to remember.</p>
      {sent ? (
        <p className="mt-8 p-4 border border-ink">Check {email} for your sign-in link.</p>
      ) : (
        <form onSubmit={magic} className="mt-8 space-y-3">
          <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full border border-ink px-4 py-3"/>
          <button className="btn-primary w-full justify-center">Email me a sign-in link</button>
        </form>
      )}
    </section>
  );
}
