import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const metadata = { title: "Your profile" };

async function updateProfile(formData: FormData) {
  "use server";
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) redirect("/account/login");

  const name = String(formData.get("name") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!emailRaw || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
    redirect("/account/profile?error=invalid_email");
  }

  // Email uniqueness check
  const existing = await db.user.findUnique({ where: { email: emailRaw } });
  if (existing && existing.id !== userId) {
    redirect("/account/profile?error=email_taken");
  }

  let updateFailed = false;
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        email: emailRaw
      }
    });
  } catch {
    updateFailed = true;
  }
  if (updateFailed) {
    redirect("/account/profile?error=email_taken");
  }

  revalidatePath("/account/profile");
  redirect("/account/profile?ok=1");
}

export default async function ProfilePage({ searchParams }: { searchParams: { ok?: string; error?: string } }) {
  const session = await auth();
  const userId = (session!.user as any).id as string;
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/account/login");

  const ok = searchParams.ok === "1";
  const error = searchParams.error;

  return (
    <div className="max-w-2xl">
      <h1 className="font-serif font-black text-4xl tracking-tight">Your profile</h1>
      <p className="text-ink/70 mt-2 text-sm">Update the name and email tied to your Got Beef account.</p>

      {ok && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">Saved.</p>
      )}
      {error === "email_taken" && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">That email is already in use.</p>
      )}
      {error === "invalid_email" && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">Please enter a valid email address.</p>
      )}

      <form action={updateProfile} className="mt-8 space-y-5">
        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Name</span>
          <input
            type="text"
            name="name"
            defaultValue={user.name ?? ""}
            className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink"
          />
        </label>
        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Email *</span>
          <input
            type="email"
            name="email"
            required
            defaultValue={user.email}
            className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink"
          />
        </label>
        <div className="flex gap-3 pt-3">
          <button type="submit" className="btn-primary">Save changes</button>
          <Link href="/account" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
