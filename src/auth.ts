// Auth.js (NextAuth v5) — magic-link via Brevo + email/password (admin).
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";
import { sendMagicLink } from "@/lib/email";

const adminAllowlist = (process.env.ADMIN_EMAIL_ALLOWLIST ?? "")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

const providers: any[] = [];

if (process.env.BREVO_API_KEY) {
  providers.push(
    Email({
      from: "Got Beef <orders@gotbeef.us>",
      // Dummy server — we override sendVerificationRequest entirely
      server: "smtp://localhost",
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendMagicLink({ to: identifier, url });
      },
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
