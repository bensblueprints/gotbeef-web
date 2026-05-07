import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/account/login");
  if (!(session.user as any).isAdmin) redirect("/");

  return (
    <section className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-[200px_1fr] gap-10">
      <aside>
        <p className="eyebrow mb-4">Admin</p>
        <nav className="space-y-2 text-sm">
          <Link href="/admin" className="block hover:opacity-60">Orders</Link>
          <Link href="/admin/shipping" className="block hover:opacity-60">Shipping Friday</Link>
          <Link href="/admin/customers" className="block hover:opacity-60">Customers</Link>
          <Link href="/admin/reviews" className="block hover:opacity-60">Reviews</Link>
          <Link href="/admin/email" className="block hover:opacity-60">Email captures</Link>
          <Link href="/admin/inventory" className="block hover:opacity-60">Inventory</Link>
        </nav>
      </aside>
      <div>{children}</div>
    </section>
  );
}
