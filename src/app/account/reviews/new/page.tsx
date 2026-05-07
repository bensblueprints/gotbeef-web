import Link from "next/link";
import { FLAVORS } from "@/lib/products";

export const metadata = { title: "Write a review" };

export default function NewReviewPage({ searchParams }: { searchParams: { flavor?: string; error?: string } }) {
  const preselected = searchParams.flavor && FLAVORS.find(f => f.sku === searchParams.flavor)
    ? searchParams.flavor
    : "";
  const error = searchParams.error;

  return (
    <div className="max-w-2xl">
      <p className="eyebrow text-ink/60">
        <Link href="/account/reviews" className="hover:opacity-60">← Reviews</Link>
      </p>
      <h1 className="font-serif font-black text-4xl tracking-tight mt-2">Write a review</h1>
      <p className="text-ink/70 mt-2 text-sm">
        Reviews are read by a human before going live. We'll email you when yours is published.
      </p>

      {error && (
        <p className="mt-6 border border-ink bg-ink/5 px-4 py-3 text-sm">
          {error === "size" && "Image is too large. Max 5MB."}
          {error === "type" && "Image must be jpg, png, or webp."}
          {error === "missing" && "Please complete all required fields."}
          {error === "rating" && "Please select a rating between 1 and 5."}
          {error === "flavor" && "Please pick a valid flavor."}
          {!["size", "type", "missing", "rating", "flavor"].includes(error) && "Something went wrong. Please try again."}
        </p>
      )}

      <form
        action="/api/account/reviews"
        method="post"
        encType="multipart/form-data"
        className="mt-8 space-y-5"
      >
        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Flavor *</span>
          <select
            name="flavorSku"
            required
            defaultValue={preselected}
            className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink"
          >
            <option value="" disabled>Pick a flavor</option>
            {FLAVORS.map(f => (
              <option key={f.sku} value={f.sku}>{f.name}</option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="eyebrow text-ink/60 block mb-2">Rating *</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <label key={n} className="flex items-center gap-1.5 border border-ink/30 px-3 py-2 cursor-pointer hover:border-ink text-sm">
                <input type="radio" name="rating" value={n} required className="accent-ink" />
                <span>{n} ★</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Title (optional)</span>
          <input
            type="text"
            name="title"
            maxLength={200}
            className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink"
          />
        </label>

        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Your review *</span>
          <textarea
            name="body"
            required
            rows={6}
            maxLength={5000}
            className="w-full border border-ink/30 bg-paper px-4 py-3 text-sm focus:outline-none focus:border-ink resize-y"
          />
        </label>

        <label className="block">
          <span className="eyebrow text-ink/60 block mb-2">Photo (optional, jpg/png/webp, max 5MB)</span>
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-ink file:bg-bone file:text-ink file:cursor-pointer hover:file:bg-ink hover:file:text-bone"
          />
        </label>

        <div className="flex gap-3 pt-3">
          <button type="submit" className="btn-primary">Submit review</button>
          <Link href="/account/reviews" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
