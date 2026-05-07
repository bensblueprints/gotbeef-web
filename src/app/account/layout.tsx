import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/account/login");

  return (
    <section className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-[220px_1fr] gap-12">
      <aside className="border-r border-ink/10 pr-6">
        <p className="eyebrow mb-4">Account</p>
        <p className="font-serif font-black text-2xl tracking-tight mb-6">{session.user.name ?? session.user.email}</p>
        <nav className="space-y-2 text-sm">
          <Link href="/account" className="block hover:opacity-60">Orders</Link>
          <Link href="/account/addresses" className="block hover:opacity-60">Addresses</Link>
          <Link href="/account/profile" className="block hover:opacity-60">Profile</Link>
          <Link href="/account/preferences" className="block hover:opacity-60">Email preferences</Link>
          <Link href="/account/reviews" className="block hover:opacity-60">Reviews</Link>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
            <button className="text-left text-ink/60 hover:text-ink mt-4">Sign out</button>
          </form>
        </nav>
      </aside>
      <div>{children}</div>
    </section>
  );
}
