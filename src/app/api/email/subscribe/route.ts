import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { subscribeToList } from "@/lib/integrations/klaviyo";

const Body = z.object({
  email: z.string().email(),
  source: z.enum(["footer", "checkout", "popup", "post-purchase"]).default("footer")
});

export async function POST(req: NextRequest) {
  try {
    const data = Body.parse(await req.json());
    // Always store internally first — Klaviyo can fail without losing the email.
    await db.emailCapture.upsert({
      where: { email: data.email.toLowerCase() },
      create: { email: data.email.toLowerCase(), source: data.source, consentMarketing: true },
      update: { source: data.source, consentMarketing: true }
    });
    // Then push to Klaviyo (best-effort — skip silently if unconfigured).
    if (process.env.KLAVIYO_PRIVATE_API_KEY && process.env.KLAVIYO_NEWSLETTER_LIST_ID) {
      try {
        await subscribeToList(data.email, { source: data.source });
        await db.emailCapture.update({
          where: { email: data.email.toLowerCase() },
          data: { klaviyoSyncedAt: new Date() }
        });
      } catch (e) {
        console.warn("Klaviyo sync failed, will retry later", e);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message ?? "Invalid request" }, { status: 400 });
  }
}
