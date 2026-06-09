import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "./db";
import {
  authAccount,
  authSession,
  authUser,
  authVerificationToken,
} from "./schema/auth";

/**
 * Auth.js v5 config for the OSS open-isms app.
 *
 * Single provider: email magic links. No passwords, no OAuth.
 *
 * Email delivery:
 *   - If EMAIL_SERVER env is set, attempts to send via SMTP at runtime.
 *     Wire your own transport in `sendVerificationRequest` below (a
 *     Resend/Postmark/SES API client, or a nodemailer instance pointed
 *     at EMAIL_SERVER). The default implementation only logs to console.
 *   - Without EMAIL_SERVER, the magic link is logged to the container's
 *     stdout. Convenient for local development (`docker compose logs app`),
 *     not for production.
 *
 * Session strategy: JWT. Simpler than database sessions, and the only
 * Auth.js table we need at runtime is `auth_verification_token` (for the
 * pending magic links). `auth_user` is read/written via the Drizzle
 * adapter when a user proves their email.
 */
export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: authUser,
    accountsTable: authAccount,
    sessionsTable: authSession,
    verificationTokensTable: authVerificationToken,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
  },
  providers: [
    {
      id: "email",
      name: "Email",
      type: "email",
      from: process.env.EMAIL_FROM ?? "no-reply@open-isms.local",
      maxAge: 60 * 60, // magic link valid for 1 hour
      sendVerificationRequest: async ({ identifier: email, url }) => {
        const emailServer = process.env.EMAIL_SERVER;
        if (!emailServer) {
          // Dev fallback: log the magic link instead of emailing.
          // Visible via `docker compose logs app` or `bun dev` output.
          console.log("\n=================================================");
          console.log("MAGIC LINK (dev: configure EMAIL_SERVER for SMTP)");
          console.log(`  to:   ${email}`);
          console.log(`  link: ${url}`);
          console.log("=================================================\n");
          return;
        }
        // Production self-hosters: wire your SMTP/API client here.
        // Examples:
        //   - nodemailer.createTransport(emailServer).sendMail({...})
        //   - new Resend(process.env.RESEND_API_KEY).emails.send({...})
        // The dev fallback fires on every magic link until this is wired.
        throw new Error(
          "EMAIL_SERVER is set but no SMTP transport is configured. " +
            "Edit lib/auth.ts:sendVerificationRequest to wire your mailer.",
        );
      },
    },
  ],
  callbacks: {
    async session({ session, token }) {
      // Surface the user id to server components / API routes.
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
