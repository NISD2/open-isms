import "@/lib/server-guard";
import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { renderSVG } from "uqr";
import type { DbOrTx } from "@/lib/db";
import { getAppUrl } from "@/lib/utils";
import { userTwoFactor } from "@/schema";
import {
  appUri,
  newAppSecret,
  newRecoveryCodes,
  normaliseRecoveryCode,
  stepOfCode,
  type TypedCode,
} from "./codes";
import { decryptSecret, encryptSecret, hashRecoveryCode } from "./crypto";

/** A setup started longer ago than this has to be started again. */
const SETUP_VALID_MS = 15 * 60 * 1000;

export type TwoFactorRow = typeof userTwoFactor.$inferSelect;

export const readTwoFactor = async (
  db: DbOrTx,
  userId: string,
): Promise<TwoFactorRow | undefined> =>
  db.query.userTwoFactor.findFirst({ where: eq(userTwoFactor.userId, userId) });

/** What a person needs to set the app up, shown once: never stored in this form. */
export type SetupMaterial = {
  readonly secret: string;
  readonly uri: string;
  /** The otpauth address as a QR code, an SVG data URL for an <img>. */
  readonly qrDataUrl: string;
  readonly recoveryCodes: readonly string[];
};

/** The name the app lists the entry under: this instance's host, as people know it. */
const issuer = (): string => {
  try {
    const host = new URL(getAppUrl()).hostname;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "ISMS";
  }
};

/**
 * Starts (or restarts) a setup: a new secret and new recovery codes, kept pending until the first
 * correct code. Leaves an active second factor alone; the caller turns it off first.
 */
export async function startSetup(
  db: DbOrTx,
  key: Buffer,
  person: { readonly userId: string; readonly email: string },
  now: Date,
): Promise<SetupMaterial> {
  const secret = newAppSecret();
  const recoveryCodes = newRecoveryCodes();
  const pending = {
    pendingSecretEncrypted: encryptSecret(secret, key),
    pendingRecoveryCodeHashes: recoveryCodes.map((c) =>
      hashRecoveryCode(normaliseRecoveryCode(c)),
    ),
    pendingStartedAt: now,
    updatedAt: now,
  };
  await db
    .insert(userTwoFactor)
    .values({ userId: person.userId, ...pending })
    .onConflictDoUpdate({ target: userTwoFactor.userId, set: pending });
  const uri = appUri(secret, issuer(), person.email);
  return {
    secret,
    uri,
    qrDataUrl: `data:image/svg+xml;base64,${Buffer.from(renderSVG(uri)).toString("base64")}`,
    recoveryCodes,
  };
}

/**
 * Turns the pending setup on when `code` is the app's current code: the secret and recovery codes
 * become the active ones and the code's step counts as used. False for a wrong or old code, an
 * expired setup, or none.
 */
export async function confirmSetup(
  db: DbOrTx,
  key: Buffer,
  userId: string,
  code: string,
  now: Date,
): Promise<boolean> {
  const row = await readTwoFactor(db, userId);
  if (!row?.pendingSecretEncrypted || !row.pendingStartedAt) return false;
  if (now.getTime() - row.pendingStartedAt.getTime() > SETUP_VALID_MS) return false;
  const secret = decryptSecret(row.pendingSecretEncrypted, key);
  if (!secret) return false;
  const step = stepOfCode(secret, code, now.getTime());
  if (step === null) return false;
  // Matched on the setup it read, so a setup restarted in between is not the one turned on.
  const done = await db
    .update(userTwoFactor)
    .set({
      secretEncrypted: row.pendingSecretEncrypted,
      enabledAt: now,
      recoveryCodeHashes: row.pendingRecoveryCodeHashes ?? [],
      lastUsedStep: step,
      pendingSecretEncrypted: null,
      pendingRecoveryCodeHashes: null,
      pendingStartedAt: null,
      updatedAt: now,
    })
    .where(
      and(
        eq(userTwoFactor.userId, userId),
        eq(userTwoFactor.pendingStartedAt, row.pendingStartedAt),
      ),
    )
    .returning({ userId: userTwoFactor.userId });
  return done.length === 1;
}

export type FactorCheck =
  | { readonly ok: true; readonly method: "app" }
  | { readonly ok: true; readonly method: "recovery"; readonly recoveryCodesLeft: number }
  | { readonly ok: false };

/**
 * Checks a code against an active second factor. An app code counts once: its step must be later
 * than the last one accepted, and the update that records it is the check, so two requests with
 * the same code cannot both pass. A recovery code is removed in the statement that accepts it.
 */
export async function checkSecondFactor(
  db: DbOrTx,
  key: Buffer,
  userId: string,
  typed: TypedCode,
  now: Date,
): Promise<FactorCheck> {
  if (typed.kind === "none") return { ok: false };
  const row = await readTwoFactor(db, userId);
  if (!row?.enabledAt || !row.secretEncrypted) return { ok: false };

  if (typed.kind === "recovery") {
    const hash = hashRecoveryCode(typed.code);
    const [used] = await db
      .update(userTwoFactor)
      .set({
        recoveryCodeHashes: sql`array_remove(${userTwoFactor.recoveryCodeHashes}, ${hash})`,
        updatedAt: now,
      })
      .where(
        and(
          eq(userTwoFactor.userId, userId),
          sql`${hash} = any(${userTwoFactor.recoveryCodeHashes})`,
        ),
      )
      .returning({ left: sql<number>`cardinality(${userTwoFactor.recoveryCodeHashes})` });
    return used
      ? { ok: true, method: "recovery", recoveryCodesLeft: Number(used.left) }
      : { ok: false };
  }

  const secret = decryptSecret(row.secretEncrypted, key);
  if (!secret) return { ok: false };
  const step = stepOfCode(secret, typed.code, now.getTime());
  if (step === null) return { ok: false };
  const accepted = await db
    .update(userTwoFactor)
    .set({ lastUsedStep: step, updatedAt: now })
    .where(and(eq(userTwoFactor.userId, userId), lt(userTwoFactor.lastUsedStep, step)))
    .returning({ userId: userTwoFactor.userId });
  return accepted.length === 1 ? { ok: true, method: "app" } : { ok: false };
}

/** Ten new recovery codes for an active second factor; the old ones stop working. */
export async function replaceRecoveryCodes(
  db: DbOrTx,
  userId: string,
  now: Date,
): Promise<readonly string[] | null> {
  const codes = newRecoveryCodes();
  const done = await db
    .update(userTwoFactor)
    .set({
      recoveryCodeHashes: codes.map((c) => hashRecoveryCode(normaliseRecoveryCode(c))),
      updatedAt: now,
    })
    .where(and(eq(userTwoFactor.userId, userId), isNotNull(userTwoFactor.enabledAt)))
    .returning({ userId: userTwoFactor.userId });
  return done.length === 1 ? codes : null;
}

/** Turns the second factor off: the secret, the recovery codes and any setup in progress go. */
export async function removeSecondFactor(db: DbOrTx, userId: string): Promise<boolean> {
  const gone = await db
    .delete(userTwoFactor)
    .where(eq(userTwoFactor.userId, userId))
    .returning({ enabledAt: userTwoFactor.enabledAt });
  return gone[0]?.enabledAt != null;
}
