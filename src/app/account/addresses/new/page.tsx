import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Add address" };

async function createAddress(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/account/login");

  const name = String(formData.get("name") ?? "").trim();
  const line1 = String(formData.get("line1") ?? "").trim();
  const line2 = String(formData.get("line2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const state = String(formData.get("state") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const country = String(formData.get("country") ?? "US").trim() || "US";
  const phone = String(formData.get("phone") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";

  if (!name || !line1 || !city || !state || !postalCode) {
    redirect("/account/addresses/new?error=missing");
  }

  if (isDefault) {
    await db.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }

  await db.address.create({
    data: {
      userId,
      name,
      line1,
      line2: line2 || null,
      city,
      state,
      postalCode,
      country,
      phone: phone || null,
      isDefault
    }
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export default function NewAddressPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error;

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-ink/60">
        <Link href="/account/addresses" className="hover:opacity-60">← Addresses</Link>
      </p>
      <h1 className="font-serif font-black text-4xl tracking-tight mt-2">Add a new address</h1>

      {error === "missing" && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">Please fill in all required fields.</p>
      )}

      <form action={createAddress} className="mt-8 space-y-5">
        <Field label="Full name" name="name" required />
        <Field label="Address line 1" name="line1" required />
        <Field label="Address line 2 (optional)" name="line2" />
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="City" name="city" required />
          <Field label="State" name="state" required />
          <Field label="ZIP / Postal" name="postalCode" required />
        </div>
        <Field label="Country" name="country" defaultValue="US" required />
        <Field label="Phone (optional)" name="phone" type="tel" />
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="isDefault" className="h-4 w-4 border-ink" />
          <span>Make this my default shipping address</span>
        </label>
        <div className="flex gap-3 pt-3">
          <button type="submit" className="btn-primary">Save address</button>
          <Link href="/account/addresses" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-ink/60 block mb-2">{label}{required && " *"}</span>
      <input
        type={type}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink"
      />
    </label>
  );
}
