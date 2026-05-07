"use client";
import Link from "next/link";
import Logo from "./Logo";
import { useCart } from "@/lib/cartStore";

export default function Header() {
  const { itemCount } = useCart();
  return (
    <header className="border-b border-ink bg-bone sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <nav className="hidden md:flex items-center gap-8 text-[12px] uppercase tracking-[0.18em] font-semibold">
          <Link href="/products" className="hover:opacity-60">Shop</Link>
          <Link href="/products?bundles=1" className="hover:opacity-60">Bundles</Link>
          <Link href="/our-beef" className="hover:opacity-60">Our Beef</Link>
          <Link href="/faq" className="hover:opacity-60">FAQ</Link>
        </nav>
        <Link href="/" aria-label="Got Beef home" className="block w-[140px]">
          <Logo variant="wordmark" tone="black" className="w-full h-auto"/>
        </Link>
        <div className="flex items-center gap-6 text-[12px] uppercase tracking-[0.18em] font-semibold">
          <Link href="/account" className="hover:opacity-60 hidden md:inline">Account</Link>
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
