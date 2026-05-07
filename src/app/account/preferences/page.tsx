import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Email preferences" };

async function updatePrefs(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/account/login");

  const marketing = formData.get("marketing") === "on";
  const orderUpdates = formData.get("orderUpdates") === "on";
  const newProducts = formData.get("newProducts") === "on";

  await db.emailPreferences.upsert({
    where: { userId },
    create: { userId, marketing, orderUpdates, newProducts },
    update: { marketing, orderUpdates, newProducts }
  });

  revalidatePath("/account/preferences");
  redirect("/account/preferences?ok=1");
}

export default async function PreferencesPage({ searchParams }: { searchParams: { ok?: string } }) {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const prefs = await db.emailPreferences.findUnique({ where: { userId } });

  const marketing = prefs?.marketing ?? true;
  const orderUpdates = prefs?.orderUpdates ?? true;
  const newProducts = prefs?.newProducts ?? true;

  const ok = searchParams.ok === "1";

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif font-black text-4xl tracking-tight">Email preferences</h1>
      <p className="text-ink/70 mt-2 text-sm">Choose what you'd like to hear from us.</p>

      {ok && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">Saved.</p>
      )}

      <form action={updatePrefs} className="mt-8 space-y-2">
        <Toggle
          name="orderUpdates"
          label="Order updates"
          desc="Confirmations, shipping, delivery — the essentials."
          defaultChecked={orderUpdates}
        />
        <Toggle
          name="newProducts"
          label="New flavors & drops"
          desc="A heads-up when a new bag hits the shop."
          defaultChecked={newProducts}
        />
        <Toggle
          name="marketing"
          label="Marketing & promotions"
          desc="Occasional offers and seasonal news."
          defaultChecked={marketing}
        />
        <div className="pt-5">
          <button type="submit" className="btn-primary">Save preferences</button>
        </div>
      </form>
    </div>
  );
}

function Toggle({
  name,
  label,
  desc,
  defaultChecked
}: {
  name: string;
  label: string;
  desc: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="flex items-start gap-4 border border-ink/15 bg-paper p-5 cursor-pointer hover:border-ink/40">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 mt-0.5 border-ink accent-ink"
      />
      <div>
        <p className="font-serif font-black text-lg tracking-tight">{label}</p>
        <p className="text-sm text-ink/70 mt-1">{desc}</p>
      </div>
    </label>
  );
}
