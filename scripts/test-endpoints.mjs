/**
 * Test every HTTP endpoint in the app.
 * Run: node scripts/test-endpoints.mjs [baseUrl]
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = process.argv[2] ?? "https://gotbeef.us";

function loadEnv() {
  return Object.fromEntries(
    readFileSync(".env", "utf8")
      .split("\n")
      .filter(l => l && !l.startsWith("#"))
      .map(l => {
        const i = l.indexOf("=");
        const k = l.slice(0, i);
        let v = l.slice(i + 1).trim();
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
          v = v.slice(1, -1);
        return [k, v];
      })
  );
}

const env = loadEnv();
const ADMIN_EMAIL = (env.ADMIN_EMAIL_ALLOWLIST ?? "ben@advancedmarketing.co").split(",")[0].trim();
const ADMIN_PASSWORD = env.ADMIN_BOOTSTRAP_PASSWORD ?? "";

const results = [];

function record(name, method, path, { status, ok, detail, expect }) {
  const passed = expect ? expect(status, ok) : status < 500;
  results.push({ name, method, path, status, ok, detail, passed, expect: expect?.toString() });
  const tag = passed ? "PASS" : "FAIL";
  console.log(`${tag} ${method} ${path} → ${status}${detail ? ` (${detail})` : ""}`);
}

async function req(path, { method = "GET", body, headers = {}, cookies = "" } = {}) {
  const h = { ...headers };
  if (cookies) h.Cookie = cookies;
  if (body && !(body instanceof FormData)) {
    h["Content-Type"] = "application/json";
  }
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    redirect: "manual"
  });
  let json = null;
  let text = "";
  const ct = res.headers.get("content-type") ?? "";
  try {
    if (ct.includes("json")) json = await res.json();
    else text = (await res.text()).slice(0, 200);
  } catch {
    text = "";
  }
  return { status: res.status, json, text, headers: res.headers };
}

async function getCsrfAndCookies() {
  const res = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await res.json();
  const cookies = (res.headers.getSetCookie?.() ?? []).map(c => c.split(";")[0]).join("; ");
  return { csrfToken, cookies };
}

async function signIn(email, password) {
  const { csrfToken, cookies } = await getCsrfAndCookies();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    callbackUrl: `${BASE}/account`,
    json: "true"
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Cookie: cookies },
    body,
    redirect: "manual"
  });
  const newCookies = (res.headers.getSetCookie?.() ?? []).map(c => c.split(";")[0]);
  return [cookies, ...newCookies].filter(Boolean).join("; ");
}

async function main() {
  const db = new PrismaClient();
  const user = await db.user.findFirst({ where: { email: ADMIN_EMAIL } });
  const order = await db.order.findFirst({ orderBy: { createdAt: "desc" } });
  const review = await db.review.findFirst({ orderBy: { createdAt: "desc" } });
  const address = user
    ? await db.address.findFirst({ where: { userId: user.id } })
    : null;

  let adminCookies = "";
  let anonCookies = "";

  console.log("\n=== AUTH ENDPOINTS ===\n");
  {
    const r = await req("/api/auth/csrf");
    record("auth csrf", "GET", "/api/auth/csrf", {
      status: r.status,
      ok: r.json?.csrfToken,
      detail: r.json?.csrfToken ? "has token" : "",
      expect: s => s === 200
    });
  }
  {
    const r = await req("/api/auth/session");
    record("auth session (anon)", "GET", "/api/auth/session", {
      status: r.status,
      ok: true,
      detail: r.json?.user ? "has user" : "empty",
      expect: s => s === 200
    });
  }
  if (ADMIN_PASSWORD) {
    adminCookies = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
    const r = await req("/api/auth/session", { cookies: adminCookies });
    record("auth session (admin)", "GET", "/api/auth/session", {
      status: r.status,
      ok: r.json?.user?.email === ADMIN_EMAIL,
      detail: r.json?.user?.email,
      expect: s => s === 200
    });
  }

  console.log("\n=== PUBLIC API ===\n");
  {
    const r = await req("/api/reviews");
    record("reviews list (all)", "GET", "/api/reviews", {
      status: r.status,
      ok: Array.isArray(r.json?.reviews),
      detail: `${r.json?.reviews?.length ?? 0} reviews`,
      expect: s => s === 200
    });
  }
  {
    const r = await req("/api/reviews?flavorSku=GB-SP-3OZ");
    record("reviews by flavor", "GET", "/api/reviews?flavorSku=GB-SP-3OZ", {
      status: r.status,
      ok: r.status === 200,
      expect: s => s === 200
    });
  }
  {
    const r = await req("/api/reviews/fake-id/image");
    record("review image (missing)", "GET", "/api/reviews/fake-id/image", {
      status: r.status,
      ok: r.status === 404,
      expect: s => s === 404
    });
  }
  if (review?.id) {
    const approved = await db.review.findFirst({ where: { status: "approved" } });
    if (approved) {
      const r = await req(`/api/reviews/${approved.id}/image`);
      record("review image (approved)", "GET", `/api/reviews/${approved.id}/image`, {
        status: r.status,
        ok: r.status === 200 || r.status === 404,
        detail: r.status === 200 ? "has image" : "no image",
        expect: s => s === 200 || s === 404
      });
    } else {
      console.log("SKIP GET /api/reviews/:id/image (no approved review)");
    }
  }
  {
    const r = await req("/api/email/subscribe", {
      method: "POST",
      body: { email: "endpoint-test@example.com", source: "footer" }
    });
    record("email subscribe", "POST", "/api/email/subscribe", {
      status: r.status,
      ok: r.json?.ok === true,
      detail: r.json?.error,
      expect: s => s === 200
    });
  }
  {
    const r = await req("/api/email/subscribe", {
      method: "POST",
      body: { email: "not-an-email", source: "footer" }
    });
    record("email subscribe (invalid)", "POST", "/api/email/subscribe", {
      status: r.status,
      ok: r.status === 400,
      expect: s => s === 400
    });
  }
  {
    const r = await req("/api/contact", {
      method: "POST",
      body: { name: "Test", email: "endpoint-test@example.com", message: "Smoke test message" }
    });
    record("contact", "POST", "/api/contact", {
      status: r.status,
      ok: r.json?.ok === true,
      expect: s => s === 200
    });
  }
  {
    const r = await req("/api/contact", { method: "POST", body: { name: "", email: "x", message: "" } });
    record("contact (invalid)", "POST", "/api/contact", {
      status: r.status,
      ok: r.status === 400,
      expect: s => s === 400
    });
  }
  {
    const r = await req("/api/checkout/create-intent", {
      method: "POST",
      body: {
        email: "endpoint-test@example.com",
        lines: [{ sku: "GB-SP-3OZ", qty: 1 }],
        shipTo: {
          name: "Test", line1: "123 Main", city: "Austin", state: "TX", postalCode: "78701", country: "US"
        }
      }
    });
    const airwallexOnlyFail =
      r.status === 400 &&
      r.json?.error &&
      !r.json.error.includes("prisma") &&
      !r.json.error.includes("Unknown argument");
    record("checkout create-intent", "POST", "/api/checkout/create-intent", {
      status: r.status,
      ok: r.json?.ok === true || airwallexOnlyFail,
      detail: r.json?.error ?? (r.json?.orderId ? `order=${r.json.orderId}` : ""),
      expect: s => s === 200 || (s === 400 && airwallexOnlyFail)
    });
  }
  {
    const r = await req("/api/checkout/create-intent", { method: "POST", body: {} });
    record("checkout create-intent (invalid)", "POST", "/api/checkout/create-intent", {
      status: r.status,
      ok: r.status === 400,
      expect: s => s === 400
    });
  }

  console.log("\n=== WEBHOOKS (unsigned) ===\n");
  {
    const res = await fetch(`${BASE}/api/webhooks/airwallex`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": "bad",
        "x-timestamp": "1"
      },
      body: JSON.stringify({ name: "payment_intent.succeeded" })
    });
    const r = { status: res.status, json: await res.json().catch(() => null) };
    record("airwallex webhook (bad sig)", "POST", "/api/webhooks/airwallex", {
      status: r.status,
      ok: r.status === 401,
      expect: s => s === 401
    });
  }
  {
    const r = await req("/api/webhooks/shipstation", {
      method: "POST",
      body: { resource_type: "SHIP_NOTIFY", resource_url: "https://example.com" }
    });
    record("shipstation webhook", "POST", "/api/webhooks/shipstation", {
      status: r.status,
      ok: r.json?.ok === true,
      expect: s => s === 200
    });
  }

  console.log("\n=== ACCOUNT API (unauthenticated) ===\n");
  for (const [method, path, body] of [
    ["POST", "/api/account/addresses", { name: "T", line1: "1", city: "A", state: "TX", postalCode: "78701" }],
    ["PATCH", "/api/account/profile", { name: "Test" }],
    ["PATCH", "/api/account/preferences", { marketing: false }],
    ["POST", "/api/account/reviews", { flavorSku: "GB-SP-3OZ", rating: 5, body: "test" }]
  ]) {
    const r = await req(path, { method, body });
    record(`account ${method} (anon)`, method, path, {
      status: r.status,
      ok: r.status === 401,
      expect: s => s === 401
    });
  }
  if (address?.id) {
    const r = await req(`/api/account/addresses/${address.id}`, { method: "PATCH", body: { city: "Austin" } });
    record("account PATCH address (anon)", "PATCH", `/api/account/addresses/${address.id}`, {
      status: r.status,
      ok: r.status === 401,
      expect: s => s === 401
    });
  }

  if (!adminCookies) {
    console.log("\nSkipping authenticated tests — ADMIN_BOOTSTRAP_PASSWORD not set\n");
  } else {
    console.log("\n=== ACCOUNT API (authenticated) ===\n");
    {
      const r = await req("/api/account/profile", {
        method: "PATCH",
        body: { name: "Ben Test" },
        cookies: adminCookies
      });
      record("account profile PATCH", "PATCH", "/api/account/profile", {
        status: r.status,
        ok: r.json?.ok === true,
        detail: r.json?.error,
        expect: s => s === 200
      });
    }
    {
      const r = await req("/api/account/preferences", {
        method: "PATCH",
        body: { marketing: true, orderUpdates: true },
        cookies: adminCookies
      });
      record("account preferences PATCH", "PATCH", "/api/account/preferences", {
        status: r.status,
        ok: r.json?.ok === true,
        expect: s => s === 200
      });
    }
    {
      const r = await req("/api/account/addresses", {
        method: "POST",
        body: {
          name: "API Test",
          line1: "456 Oak Ave",
          city: "Austin",
          state: "TX",
          postalCode: "78702",
          country: "US",
          isDefault: false
        },
        cookies: adminCookies
      });
      record("account addresses POST", "POST", "/api/account/addresses", {
        status: r.status,
        ok: r.json?.ok === true,
        detail: r.json?.id ? `id=${r.json.id}` : r.json?.error,
        expect: s => s === 200
      });
      if (r.json?.id) {
        const addrId = r.json.id;
        const r2 = await req(`/api/account/addresses/${addrId}`, {
          method: "PATCH",
          body: { city: "Dallas" },
          cookies: adminCookies
        });
        record("account address PATCH", "PATCH", `/api/account/addresses/${addrId}`, {
          status: r2.status,
          ok: r2.json?.ok === true,
          expect: s => s === 200
        });
        const r3 = await req(`/api/account/addresses/${addrId}`, {
          method: "DELETE",
          cookies: adminCookies
        });
        record("account address DELETE", "DELETE", `/api/account/addresses/${addrId}`, {
          status: r3.status,
          ok: r3.json?.ok === true,
          expect: s => s === 200
        });
      }
    }
    {
      const r = await req("/api/account/reviews", {
        method: "POST",
        body: {
          flavorSku: "GB-SP-3OZ",
          rating: 5,
          title: "Endpoint test",
          body: "Automated smoke test review body."
        },
        cookies: adminCookies
      });
      record("account reviews POST", "POST", "/api/account/reviews", {
        status: r.status,
        ok: r.json?.ok === true,
        detail: r.json?.id ?? r.json?.error,
        expect: s => s === 200
      });
      if (r.json?.id) {
        await db.review.update({ where: { id: r.json.id }, data: { status: "pending" } });
      }
    }

    console.log("\n=== ADMIN API (unauthenticated) ===\n");
    if (order?.id) {
      const r = await req(`/api/admin/orders/${order.id}`, { method: "PATCH", body: { status: "paid" } });
      record("admin order PATCH (anon)", "PATCH", `/api/admin/orders/${order.id}`, {
        status: r.status,
        ok: r.status === 403,
        expect: s => s === 403
      });
      const r2 = await req(`/api/admin/orders/${order.id}/ship`, { method: "POST" });
      record("admin order ship (anon)", "POST", `/api/admin/orders/${order.id}/ship`, {
        status: r2.status,
        ok: r2.status === 403,
        expect: s => s === 403
      });
    }

    console.log("\n=== ADMIN API (authenticated) ===\n");
    {
      const r = await req("/admin/export.csv", { cookies: adminCookies });
      record("admin export.csv", "GET", "/admin/export.csv", {
        status: r.status,
        ok: r.status === 200 && r.text.includes("order_number"),
        detail: r.text?.slice(0, 40),
        expect: s => s === 200
      });
    }
    {
      const r = await req("/admin/shipping/export.csv", { cookies: adminCookies });
      record("admin shipping export.csv", "GET", "/admin/shipping/export.csv", {
        status: r.status,
        ok: r.status === 200,
        expect: s => s === 200
      });
    }
    {
      const r = await req("/admin/export.csv");
      record("admin export.csv (anon)", "GET", "/admin/export.csv", {
        status: r.status,
        ok: r.status === 403,
        expect: s => s === 403
      });
    }
    if (order?.id) {
      const r = await req(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        body: { notes: "Endpoint test note" },
        cookies: adminCookies
      });
      record("admin order PATCH", "PATCH", `/api/admin/orders/${order.id}`, {
        status: r.status,
        ok: r.json?.ok === true,
        detail: r.json?.error,
        expect: s => s === 200
      });
      const r2 = await req(`/api/admin/orders/${order.id}/ship`, {
        method: "POST",
        cookies: adminCookies
      });
      record("admin order ship", "POST", `/api/admin/orders/${order.id}/ship`, {
        status: r2.status,
        ok: r2.json?.ok === true,
        detail: r2.json?.error ?? "ok",
        expect: s => s === 200 || s === 500 // 500 if ShipStation not configured
      });
    }
    const pendingReview = await db.review.findFirst({ where: { status: "pending" } });
    if (pendingReview) {
      const r = await req(`/api/admin/reviews/${pendingReview.id}`, {
        method: "PATCH",
        body: { status: "approved" },
        cookies: adminCookies
      });
      record("admin review PATCH", "PATCH", `/api/admin/reviews/${pendingReview.id}`, {
        status: r.status,
        ok: r.json?.ok === true,
        expect: s => s === 200
      });
      const r2 = await req(`/api/admin/reviews/${pendingReview.id}/image-admin`, { cookies: adminCookies });
      record("admin review image", "GET", `/api/admin/reviews/${pendingReview.id}/image-admin`, {
        status: r2.status,
        ok: r2.status === 200 || r2.status === 404,
        expect: s => s === 200 || s === 404
      });
    } else {
      console.log("SKIP admin review endpoints (no pending review)");
    }
    {
      const r = await req("/api/admin/reviews/fake-id", {
        method: "PATCH",
        body: { status: "approved" },
        cookies: adminCookies
      });
      record("admin review PATCH (missing)", "PATCH", "/api/admin/reviews/fake-id", {
        status: r.status,
        ok: r.status === 500 || r.status === 404,
        expect: s => s >= 400
      });
    }
  }

  await db.$disconnect();

  const failed = results.filter(r => !r.passed);
  const warned = results.filter(r => r.passed && r.detail?.includes("Airwallex"));
  console.log("\n=== SUMMARY ===");
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${results.length - failed.length}`);
  console.log(`Failed: ${failed.length}`);
  if (failed.length) {
    console.log("\nFailures:");
    for (const f of failed) console.log(`  ${f.method} ${f.path} → ${f.status} ${f.detail ?? ""}`);
  }
  process.exit(failed.length ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
