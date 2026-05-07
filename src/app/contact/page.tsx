"use client";
import { useState } from "react";
import Link from "next/link";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to send");
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="max-w-3xl mx-auto px-6 py-20">
      <p className="eyebrow mb-4">Talk to a human</p>
      <h1 className="font-serif font-black text-5xl md:text-6xl leading-[0.95] tracking-tight">
        Got <em className="italic">questions?</em>
      </h1>
      <p className="mt-6 text-lg text-ink/80 max-w-xl leading-relaxed">
        Wholesale, custom orders, allergy questions, or just want to say the salt-and-pepper changed your life? Drop us a note. We read everything.
      </p>

      <div className="rule my-10"/>

      {done ? (
        <div className="border border-ink p-8 bg-paper">
          <p className="eyebrow mb-2">Sent</p>
          <h2 className="font-serif font-black text-3xl tracking-tight">Thanks — we got it.</h2>
          <p className="mt-3 text-ink/80">We'll get back to you within one business day.</p>
          <div className="mt-6 flex gap-3">
            <Link href="/products" className="btn-primary">Shop the flavors</Link>
            <button onClick={() => { setDone(false); setName(""); setEmail(""); setMessage(""); }} className="btn-secondary">
              Send another →
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="grid gap-4 max-w-xl">
          <label className="block">
            <span className="eyebrow block mb-2">Name</span>
            <input
              type="text" required value={name} onChange={e => setName(e.target.value)}
              className="w-full border border-ink px-4 py-3 bg-paper"
            />
          </label>
          <label className="block">
            <span className="eyebrow block mb-2">Email</span>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-ink px-4 py-3 bg-paper"
            />
          </label>
          <label className="block">
            <span className="eyebrow block mb-2">Message</span>
            <textarea
              required value={message} onChange={e => setMessage(e.target.value)}
              rows={6}
              className="w-full border border-ink px-4 py-3 bg-paper resize-y"
            />
          </label>
          {error && <p className="text-red-700 text-sm">{error}</p>}
          <button disabled={submitting} className="btn-primary justify-center">
            {submitting ? "Sending..." : "Send message →"}
          </button>
          <p className="text-xs text-ink/60 mt-2">
            Or email us directly at <a href="mailto:hello@gotbeef.us" className="underline underline-offset-4">hello@gotbeef.us</a>.
          </p>
        </form>
      )}
    </section>
  );
}
