import Link from "next/link";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Your addresses" };

async function deleteAddress(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;
  const a = await db.address.findUnique({ where: { id }, select: { userId: true } });
  if (!a || a.userId !== userId) return;

  const refs = await db.order.count({
    where: { OR: [{ shippingAddressId: id }, { billingAddressId: id }] }
  });
  if (refs > 0) {
    await db.address.update({ where: { id }, data: { userId: null } });
  } else {
    await db.address.delete({ where: { id } });
  }
  revalidatePath("/account/addresses");
}

async function makeDefault(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return;
  const a = await db.address.findUnique({ where: { id }, select: { userId: true } });
  if (!a || a.userId !== userId) return;
  await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
  await db.address.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
}

export default async function AddressesPage() {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const addresses = await db.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-serif font-black text-4xl tracking-tight">Your addresses</h1>
        <Link href="/account/addresses/new" className="btn-primary">Add new address</Link>
      </div>

      {addresses.length === 0 ? (
        <div className="mt-12 text-center py-12 border border-ink/10">
          <p className="text-ink/70 mb-6">You haven't saved any addresses yet.</p>
          <Link href="/account/addresses/new" className="btn-primary">Add your first address</Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {addresses.map(a => (
            <div key={a.id} className="border border-ink/15 bg-paper p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif font-black text-xl tracking-tight">{a.name}</p>
                  {a.isDefault && (
                    <p className="eyebrow text-ink/60 mt-1">Default</p>
                  )}
                </div>
              </div>
              <div className="text-sm text-ink/70 mt-3 leading-relaxed">
                <p>{a.line1}</p>
                {a.line2 && <p>{a.line2}</p>}
                <p>{a.city}, {a.state} {a.postalCode}</p>
                <p>{a.country}</p>
                {a.phone && <p className="mt-1">{a.phone}</p>}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={`/account/addresses/${a.id}/edit`} className="btn-secondary">Edit</Link>
                {!a.isDefault && (
                  <form action={makeDefault}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="btn-secondary" type="submit">Make default</button>
                  </form>
                )}
                <form action={deleteAddress}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-sm text-ink/60 hover:text-ink underline underline-offset-4 px-3 py-3" type="submit">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
