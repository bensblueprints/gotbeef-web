import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { FLAVORS } from "@/lib/products";

const MAX_IMAGE_BYTES = 5_000_000;

export async function POST(req: NextRequest) {
  const ct = (req.headers.get("content-type") ?? "").toLowerCase();
  const isForm = ct.startsWith("multipart/form-data") || ct.startsWith("application/x-www-form-urlencoded");

  const fail = (msg: string, code: string, status = 400) => {
    if (isForm) {
      return NextResponse.redirect(new URL(`/account/reviews/new?error=${code}`, req.url), { status: 303 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status });
  };

  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return fail("Unauthorized", "auth", 401);

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return fail("Unauthorized", "auth", 401);

  let flavorSku = "";
  let rating = 0;
  let title: string | null = null;
  let body = "";
  let imageData: Buffer | null = null;
  let imageType: string | null = null;

  try {
    if (isForm) {
      const fd = await req.formData();
      flavorSku = String(fd.get("flavorSku") ?? "");
      rating = Number(fd.get("rating") ?? 0);
      const t = fd.get("title");
      title = t ? String(t).slice(0, 200) : null;
      body = String(fd.get("body") ?? "");

      const file = fd.get("image");
      if (file && typeof file === "object" && "arrayBuffer" in file) {
        const f = file as File;
        if (f.size > 0) {
          if (f.size > MAX_IMAGE_BYTES) return fail("Image too large (max 5MB).", "size");
          if (!f.type || !f.type.startsWith("image/")) return fail("Image must be jpg, png, or webp.", "type");
          if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
            return fail("Image must be jpg, png, or webp.", "type");
          }
          const buf = Buffer.from(await f.arrayBuffer());
          imageData = buf;
          imageType = f.type;
        }
      }
    } else {
      const json = await req.json();
      flavorSku = String(json.flavorSku ?? "");
      rating = Number(json.rating ?? 0);
      title = json.title ? String(json.title).slice(0, 200) : null;
      body = String(json.body ?? "");
    }
  } catch (err: any) {
    return fail("Could not parse request.", "missing");
  }

  if (!FLAVORS.some(f => f.sku === flavorSku)) return fail("Invalid flavor.", "flavor");
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return fail("Rating must be 1-5.", "rating");
  if (!body.trim()) return fail("Review body is required.", "missing");
  if (body.length > 5000) return fail("Review body too long.", "missing");

  try {
    const review = await db.review.create({
      data: {
        userId,
        authorName: user.name ?? user.email,
        authorEmail: user.email,
        flavorSku,
        rating,
        title,
        body: body.trim(),
        imageData: imageData ?? undefined,
        imageType: imageType ?? undefined,
        status: "pending"
      },
      select: { id: true }
    });
    if (isForm) {
      return NextResponse.redirect(new URL("/account/reviews?ok=1", req.url), { status: 303 });
    }
    return NextResponse.json({ ok: true, id: review.id });
  } catch (err: any) {
    return fail(err.message ?? "Failed to create review.", "missing", 500);
  }
}
