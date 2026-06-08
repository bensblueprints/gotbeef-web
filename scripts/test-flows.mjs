/**
 * Integration smoke tests: checkout API, admin session, account pages.
 * Requires dev server + .env with DATABASE_URL, Airwallex, ADMIN_BOOTSTRAP_PASSWORD.
 */
import { readFileSync } from "fs";
import { PrismaClient } from "@prisma/client";

const BASE = process.argv[2] ?? "http://localhost:3000";
const env = Object.fromEntries(
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

const ADMIN_EMAIL = (env.ADMIN_EMAIL_ALLOWLIST ?? "ben@advancedmarketing.co").split(",")[0].trim();
const ADMIN_PASSWORD = env.ADMIN_BOOTSTRAP_PASSWORD ?? "";

const db = new PrismaClient();
const results = [];

function log(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ": " + detail : ""}`);
}

async function getCsrfAndCookies() {
  const res = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = await res.json();
  const setCookie = res.headers.getSetCookie?.() ?? [];
  return { csrfToken, cookies: setCookie.map(c => c.split(";")[0]).join("; ") };
}

async function adminSignIn() {
  const { csrfToken, cookies } = await getCsrfAndCookies();
  const body = new URLSearchParams({
    csrfToken,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    callbackUrl: `${BASE}/admin`,
    json: "true"
  });
  const res = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookies
    },
    body,
    redirect: "manual"
  });
  const newCookies = [...(res.headers.getSetCookie?.() ?? [])].map(c => c.split(";")[0]);
  const all = [cookies, ...newCookies].filter(Boolean).join("; ");
  const sessionRes = await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: all } });
  const session = await sessionRes.json();
  return { cookies: all, session };
}

async function fetchAuthed(path, cookies) {
  return fetch(`${BASE}${path}`, { headers: { Cookie: cookies }, redirect: "manual" });
}

async function testCheckoutCreate() {
  const res = await fetch(`${BASE}/api/checkout/create-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test-smoke@example.com",
      lines: [{ sku: "GB-SP-3OZ", qty: 1 }],
      shipTo: {
        name: "Test User",
        line1: "123 Main St",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "US"
      }
    })
  });
  const data = await res.json();
  if (!res.ok) {
    log("checkout create-intent", false, data.error ?? res.status);
    return null;
  }
  log("checkout create-intent", true, `orderId=${data.orderId}`);
  const order = await db.order.findUnique({ where: { id: data.orderId } });
  log("order persisted", !!order && order.status === "pending", order?.number ?? "");
  return data.orderId;
}

async function testAdminFulfillment(orderId, cookies) {
  if (!orderId) return;
  const res = await fetchAuthed(`/admin/orders/${orderId}`, cookies);
  const ok = res.status === 200;
  log("admin order detail", ok, `status=${res.status}`);
  if (!ok) return;

  await db.order.update({ where: { id: orderId }, data: { status: "paid" } });
  log("mark order paid (db)", true);

  await db.order.update({ where: { id: orderId }, data: { status: "fulfilling" } });
  const o = await db.order.findUnique({ where: { id: orderId } });
  log("mark order fulfilling (db)", o?.status === "fulfilling");
}

async function testAdminPages(cookies) {
  for (const path of [
    "/admin",
    "/admin/shipping",
    "/admin/customers",
    "/admin/reviews",
    "/admin/email",
    "/admin/inventory"
  ]) {
    const res = await fetchAuthed(path, cookies);
    const text = await res.text();
    const bad = res.status !== 200 || text.includes("Application error") || text.includes("statusCode\":500");
    log(`admin page ${path}`, !bad, `status=${res.status}`);
  }
}

async function testAccountPages(cookies) {
  for (const path of [
    "/account",
    "/account/addresses",
    "/account/profile",
    "/account/preferences",
    "/account/reviews"
  ]) {
    const res = await fetchAuthed(path, cookies);
    const text = await res.text();
    const bad = res.status !== 200 || text.includes("Application error");
    log(`account page ${path}`, !bad, `status=${res.status}`);
  }
}

async function main() {
  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_BOOTSTRAP_PASSWORD missing from .env");
    process.exit(1);
  }

  const orderId = await testCheckoutCreate();

  const { cookies, session } = await adminSignIn();
  const adminOk = session?.user?.email === ADMIN_EMAIL;
  log("admin sign-in", adminOk, session?.user?.email ?? "no session");

  if (adminOk) {
    await testAdminPages(cookies);
    await testAdminFulfillment(orderId, cookies);
    await testAccountPages(cookies);
  }

  const failed = results.filter(r => !r.ok);
  console.log(`\n--- ${results.length - failed.length}/${results.length} passed ---`);
  if (failed.length) process.exit(1);
  await db.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
