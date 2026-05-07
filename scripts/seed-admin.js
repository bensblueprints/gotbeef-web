// One-shot admin bootstrap. Runs on container start.
// - Upserts every email in ADMIN_EMAIL_ALLOWLIST as a User with isAdmin=true
// - If ADMIN_BOOTSTRAP_PASSWORD is set, also stamps a bcrypt password so the
//   admin can sign in with the credentials provider before Resend is wired up.
// Idempotent: safe to run on every container start.

const { PrismaClient } = require("@prisma/client");

async function main() {
  const allowlist = (process.env.ADMIN_EMAIL_ALLOWLIST || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allowlist.length === 0) {
    console.log("[seed-admin] ADMIN_EMAIL_ALLOWLIST empty — skipping");
    return;
  }

  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
  let passwordHash = null;
  if (password) {
    const bcrypt = require("bcryptjs");
    passwordHash = bcrypt.hashSync(password, 10);
  }

  const db = new PrismaClient();
  try {
    for (const email of allowlist) {
      await db.user.upsert({
        where: { email },
        create: {
          email,
          isAdmin: true,
          ...(passwordHash ? { passwordHash } : {}),
        },
        update: {
          isAdmin: true,
          ...(passwordHash ? { passwordHash } : {}),
        },
      });
      console.log(`[seed-admin] ok: ${email}${passwordHash ? " (password set)" : ""}`);
    }
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("[seed-admin] FAILED:", e);
  // Don't block container start — log and exit 0 so server.js still launches.
  process.exit(0);
});
