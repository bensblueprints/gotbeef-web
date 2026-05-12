"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Logo from "./Logo";
import { useCart } from "@/lib/cartStore";

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

export default function Header() {
  const { itemCount } = useCart();
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin;

  return (
    <header className="border-b border-ink bg-bone sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-8 text-[12px] uppercase tracking-[0.18em] font-semibold">
          <Link href="/products" className="hover:opacity-60">Shop</Link>
          <Link href="/products?bundles=1" className="hover:opacity-60">Bundles</Link>
          <Link href="/our-beef" className="hover:opacity-60">Our Beef</Link>
          <Link href="/faq" className="hover:opacity-60">FAQ</Link>
          {isAdmin && (
            <Link href="/admin" className="hover:opacity-60 text-amber-700">Admin</Link>
          )}
        </nav>

        <Link href="/" aria-label="Got Beef home" className="block w-[140px]">
          <Logo variant="wordmark" tone="black" className="w-full h-auto"/>
        </Link>

        <div className="flex items-center gap-5 text-[12px] uppercase tracking-[0.18em] font-semibold">
          <Link href={session ? "/account" : "/account/login"} className="relative hover:opacity-60 hidden md:block" aria-label="Account">
            <UserIcon className="w-5 h-5"/>
            {session && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-ink"/>
            )}
          </Link>
          <Link href="/cart" className="flex items-center gap-2 hover:opacity-60">
            Cart
            <span className="inline-flex items-center justify-center w-5 h-5 bg-ink text-white text-[10px] rounded-sm">
              {itemCount}
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
}
