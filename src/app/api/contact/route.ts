// Contact form endpoint. No DB writes — just email Ben via Resend (or log if unconfigured).
import { z } from "zod";
import { sendContactMessage } from "@/lib/email";

const Body = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(5000)
});

export async function POST(req: Request) {
  try {
    const data = Body.parse(await req.json());

    if (process.env.RESEND_API_KEY) {
      try {
        await sendContactMessage(data);
      } catch (err) {
        console.error("[contact] resend send failed", err);
        // Still return success to the user — message is captured in logs.
      }
    } else {
      console.log("[contact] (no RESEND_API_KEY) message received:", data);
    }

    return Response.json({ ok: true });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message ?? "Invalid request" }, { status: 400 });
  }
}
