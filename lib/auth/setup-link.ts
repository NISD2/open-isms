/**
 * Account setup links, for a customer whose account a platform admin created on a sales call
 * (door two, lib/billing/close-deal.ts). They have no password yet; the link lets them set one, or
 * they continue with Google, which matches them by email.
 *
 * Stored in `email_otp` with purpose "account_setup", but unlike the six-digit codes it is a long
 * random secret in a link, valid seven days and used once:
 *
 *   token = <row id>.<secret>     the row holds sha256(secret), never the secret
 *
 * The id finds the row, so no email address travels in the URL. The secret is compared in constant
 * time. A new link for the same email retires the older ones.
 */
import "@/lib/server-guard";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { emailOtp } from "@/schema";

const PURPOSE = "account_setup";
const VALID_MS = 7 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/** Split a token into its row id and secret, or null when it cannot be one of ours. */
export const parseSetupToken = (
  token: string,
): { readonly id: string; readonly secret: string } | null => {
  const [id, secret, ...rest] = token.split(".");
  if (rest.length > 0 || !id || !secret || !UUID.test(id) || secret.length < 32)
    return null;
  return { id, secret };
};

/** Issue a link token for this email, retiring any earlier unused one. */
export const createSetupToken = async (db: DbOrTx, email: string, now = new Date()) => {
  const normalized = email.toLowerCase().trim();
  const secret = randomBytes(32).toString("base64url");
  await db
    .update(emailOtp)
    .set({ consumedAt: now })
    .where(
      and(
        eq(emailOtp.email, normalized),
        eq(emailOtp.purpose, PURPOSE),
        isNull(emailOtp.consumedAt),
      ),
    );
  const [row] = await db
    .insert(emailOtp)
    .values({
      email: normalized,
      codeHash: sha256(secret),
      purpose: PURPOSE,
      expiresAt: new Date(now.getTime() + VALID_MS),
    })
    .returning({ id: emailOtp.id });
  if (!row) throw new Error("setup token insert returned no row");
  return `${row.id}.${secret}`;
};

/** The email a live, unused token belongs to, or null. Does not use it up. */
export const readSetupToken = async (db: DbOrTx, token: string, now = new Date()) => {
  const parts = parseSetupToken(token);
  if (!parts) return null;
  const [row] = await db
    .select({ id: emailOtp.id, email: emailOtp.email, codeHash: emailOtp.codeHash })
    .from(emailOtp)
    .where(
      and(
        eq(emailOtp.id, parts.id),
        eq(emailOtp.purpose, PURPOSE),
        isNull(emailOtp.consumedAt),
        gt(emailOtp.expiresAt, now),
      ),
    )
    .limit(1);
  if (!row) return null;
  const given = Buffer.from(sha256(parts.secret), "hex");
  const stored = Buffer.from(row.codeHash, "hex");
  if (given.length !== stored.length || !timingSafeEqual(given, stored)) return null;
  return { id: row.id, email: row.email };
};

/** Use a token up, so the link works once. Returns whether this call used it. */
export const consumeSetupToken = async (db: DbOrTx, id: string, now = new Date()) => {
  const used = await db
    .update(emailOtp)
    .set({ consumedAt: now })
    .where(and(eq(emailOtp.id, id), isNull(emailOtp.consumedAt)))
    .returning({ id: emailOtp.id });
  return used.length === 1;
};
