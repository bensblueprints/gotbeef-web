"use client";
import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState("");

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" })
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setStatus("ok"); setMsg("You're in. Check your inbox."); setEmail("");
    } catch (err: any) {
      setStatus("err"); setMsg(err.message ?? "Something went wrong");
    }
  }

  return (
    <footer className="border-t border-ink bg-bone mt-24">
      <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <Link href="/" aria-label="Got Beef home" className="block w-[200px]">
            <Logo variant="wordmark" tone="black" className="w-full h-auto"/>
          </Link>
          <p className="mt-4 text-sm max-w-md leading-relaxed">
            Gourmet brisket beef jerky. All-natural, grass-fed, gluten-free. No fillers, no nonsense.
          </p>
          <form onSubmit={subscribe} className="mt-6 flex max-w-md">
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-transparent border border-ink px-4 py-3 text-sm focus:outline-none"/>
            <button className="btn-primary border border-ink" type="submit" disabled={status === "loading"}>
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
          {status !== "idle" && status !== "loading" && (
            <p className={`mt-2 text-xs ${status === "ok" ? "text-emerald-700" : "text-red-700"}`}>{msg}</p>
          )}
        </div>
        <div>
          <p className="eyebrow mb-4">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:opacity-60">All flavors</Link></li>
            <li><Link href="/products/sampler" className="hover:opacity-60">4-flavor sampler</Link></li>
            <li><Link href="/products?bundles=1" className="hover:opacity-60">Bundles</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4">Help</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/faq" className="hover:opacity-60">FAQ</Link></li>
            <li><Link href="/shipping" className="hover:opacity-60">Shipping</Link></li>
            <li><Link href="/contact" className="hover:opacity-60">Contact</Link></li>
            <li><Link href="/account" className="hover:opacity-60">My account</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/20">
        <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] tracking-[0.18em] uppercase flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Got Beef · gotbeef.us</span>
          <span>Made in the USA · Hand-cut · Slow-dried</span>
        </div>
      </div>
    </footer>
  );
}
