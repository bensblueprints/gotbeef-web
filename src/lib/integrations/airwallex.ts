// Airwallex integration — Drop-in checkout flow.
// Server-side only. Requires AIRWALLEX_CLIENT_ID + AIRWALLEX_API_KEY.

const ENV = process.env.AIRWALLEX_ENV ?? "demo";
const BASE = ENV === "prod"
  ? "https://api.airwallex.com"
  : "https://api-demo.airwallex.com";

let cachedToken: { token: string; expires: number } | null = null;

async function authToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(`${BASE}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID ?? "",
      "x-api-key": process.env.AIRWALLEX_API_KEY ?? ""
    }
  });
  if (!res.ok) throw new Error(`Airwallex auth failed: ${res.status}`);
  const json = await res.json();
  cachedToken = { token: json.token, expires: new Date(json.expires_at).getTime() };
  return cachedToken.token;
}

export async function createPaymentIntent(input: {
  amountCents: number; currency?: string; orderId: string; email: string;
}) {
  const token = await authToken();
  const res = await fetch(`${BASE}/api/v1/pa/payment_intents/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      request_id: `gb-${input.orderId}-${Date.now()}`,
      amount: input.amountCents / 100,
      currency: input.currency ?? "USD",
      merchant_order_id: input.orderId,
      order: { type: "physical_goods" },
      customer: { email: input.email },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/return?order=${input.orderId}`
    })
  });
  if (!res.ok) throw new Error(`Airwallex intent failed: ${res.status}`);
  return res.json() as Promise<{ id: string; client_secret: string; status: string }>;
}

export async function getPaymentIntent(intentId: string) {
  const token = await authToken();
  const res = await fetch(`${BASE}/api/v1/pa/payment_intents/${intentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Airwallex get intent failed: ${res.status}`);
  return res.json() as Promise<{ id: string; client_secret: string; status: string }>;
}

/**
 * Verify webhook signature using AIRWALLEX_WEBHOOK_SECRET.
 * Airwallex signs webhooks with HMAC SHA256 over the raw body + timestamp.
 */
export async function verifyWebhook(rawBody: string, signature: string, timestamp: string) {
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET ?? "";
  if (!secret) throw new Error("AIRWALLEX_WEBHOOK_SECRET not set");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}${rawBody}`));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  return expected === signature;
}
