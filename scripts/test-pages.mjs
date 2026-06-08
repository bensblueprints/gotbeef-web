/**
 * Smoke-test all public routes + auth-gated redirects.
 * Run: node scripts/test-pages.mjs [baseUrl]
 */
const BASE = process.argv[2] ?? "https://gotbeef.us";

const PUBLIC_ROUTES = [
  "/",
  "/products",
  "/products/salt-and-pepper",
  "/products/sampler",
  "/our-beef",
  "/faq",
  "/shipping",
  "/contact",
  "/cart",
  "/checkout",
  "/account/login",
];

const AUTH_REDIRECT_ROUTES = [
  { path: "/admin", expectRedirect: "/account/login" },
  { path: "/account", expectRedirect: "/account/login" },
];

async function fetchRoute(path) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  const text = await res.text();
  const hasError =
    text.includes('"statusCode":500') ||
    text.includes("Application error") ||
    text.includes("Internal Server Error") ||
    text.includes("Cannot find module");
  return { path, status: res.status, location, hasError, len: text.length };
}

async function main() {
  const results = [];
  for (const path of PUBLIC_ROUTES) {
    results.push(await fetchRoute(path));
  }
  for (const { path, expectRedirect } of AUTH_REDIRECT_ROUTES) {
    const r = await fetchRoute(path);
    r.expectRedirect = expectRedirect;
    r.redirectOk = r.status >= 300 && r.status < 400 && locationIncludes(r.location, expectRedirect);
    results.push(r);
  }

  const failed = results.filter(
    r =>
      r.hasError ||
      (r.expectRedirect ? !r.redirectOk : r.status !== 200)
  );

  console.log(JSON.stringify(results, null, 2));
  console.log("\n--- SUMMARY ---");
  console.log(`Total: ${results.length}, Failed: ${failed.length}`);
  if (failed.length) {
    console.log("FAILURES:");
    for (const f of failed) {
      console.log(`  ${f.path} status=${f.status} error=${f.hasError} redirect=${f.location ?? ""}`);
    }
    process.exit(1);
  }
  process.exit(0);
}

function locationIncludes(loc, sub) {
  return loc.includes(sub);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
