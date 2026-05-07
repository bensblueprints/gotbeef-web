// Auth.js (NextAuth v5) — email magic-link via Resend + email/password.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

const adminAllowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

// Magic-link via Resend is only registered when RESEND_API_KEY is set, so the
// provider doesn't blow up auth at runtime before email is wired up.
const resendKey = process.env.RESEND_API_KEY;
const providers: any[] = [];
if (resendKey) {
  providers.push(
    Resend({
      from: process.env.RESEND_FROM ?? "Got Beef <orders@gotbeef.us>",
      apiKey: resendKey,
    })
  );
}
providers.push(
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(creds) {
      if (!creds?.email || !creds?.password) return null;
      const user = await db.user.findUnique({ where: { email: String(creds.email).toLowerCase() } });
      if (!user || !user.passwordHash) return null;
      const bcrypt = await import("bcryptjs");
      const ok = await bcrypt.compare(String(creds.password), user.passwordHash);
      return ok ? user : null;
    }
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/account/login" },
  trustHost: true,
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = adminAllowlist.includes((user.email ?? "").toLowerCase());
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).isAdmin = !!token.isAdmin;
      }
      return session;
    }
  }
});
