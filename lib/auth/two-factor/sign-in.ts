import "@/lib/server-guard";
import { checkPassword, type PasswordAccount } from "@/lib/auth/password-check";
import type { DbOrTx } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { auditTwoFactor } from "./audit";
import { readTypedCode } from "./codes";
import { failureNotice, noticeTwoFactor } from "./notice";
import { twoFactorRequirement } from "./policy";
import { checkSecondFactor, confirmSetup, readTwoFactor } from "./store";

const CODE_WINDOW_MS = 15 * 60 * 1000;
const CODE_ATTEMPTS = 10;

/**
 * Codes tried per person, wherever they are typed: at sign-in, in Settings, at setup. Ten in
 * fifteen minutes leaves room for typos and none for guessing a million codes.
 */
export const allowCodeAttempt = (userId: string): Promise<boolean> =>
  rateLimit(`two-factor:${userId}`, CODE_ATTEMPTS, CODE_WINDOW_MS);

/** Why a password sign-in does not go through yet, as the sign-in card reads it. */
export type SignInRefusal =
  | "RATE_LIMITED"
  | "EMAIL_NOT_VERIFIED"
  | "TWO_FACTOR_REQUIRED"
  | "TWO_FACTOR_INVALID"
  | "TWO_FACTOR_SETUP_REQUIRED"
  | "TWO_FACTOR_UNAVAILABLE"
  /** A hundred wrong codes in a row: only a recovery code (or a platform admin's reset) helps. */
  | "TWO_FACTOR_LOCKED";

export type PasswordSignIn =
  | { readonly ok: true; readonly user: PasswordAccount }
  /** `code` null: wrong address or password, which the card shows as such. */
  | { readonly ok: false; readonly code: SignInRefusal | null };

type Request = { readonly ip: string; readonly userAgent: string | null };

const refuse = (code: SignInRefusal | null): PasswordSignIn => ({ ok: false, code });

/**
 * A password sign-in, whole: the password, then the second factor, all in `authorize` and before
 * any session exists, so no half signed-in state ever reaches a page or an API. The sign-in card
 * sends the password again with the code. Google sign-ins never come here (Google asks for its
 * own second factor).
 *
 * - Second factor on: a code from the app, or a recovery code, is needed.
 * - Off, and required (platform admin, or a company that requires it): the person sets it up
 *   (app/api/auth/two-factor/setup) and the code they then type confirms it and signs them in.
 * - Off and not required, or no key on this instance: the password is enough. Someone who turned
 *   it on is refused while the key is missing rather than let in without it.
 */
export async function passwordSignIn(
  db: DbOrTx,
  key: Buffer | null,
  credentials: {
    readonly email: string | undefined;
    readonly password: string | undefined;
    readonly totpCode: string | undefined;
  },
  request: Request,
  now: Date = new Date(),
): Promise<PasswordSignIn> {
  const checked = await checkPassword(
    db,
    credentials.email,
    credentials.password,
    request.ip,
  );
  if (!checked.ok) {
    if (checked.reason === "rate_limited") return refuse("RATE_LIMITED");
    if (checked.reason === "unverified") return refuse("EMAIL_NOT_VERIFIED");
    return refuse(null);
  }
  const person = checked.user;
  const row = await readTwoFactor(db, person.id);
  const typed = readTypedCode(credentials.totpCode);
  const who = {
    subjectId: person.id,
    actorId: person.id,
    companyId: person.companyId,
    ...request,
  };

  if (row?.enabledAt) {
    if (!key) return refuse("TWO_FACTOR_UNAVAILABLE");
    if (typed.kind === "none") return refuse("TWO_FACTOR_REQUIRED");
    if (!(await allowCodeAttempt(person.id))) return refuse("RATE_LIMITED");
    const check = await checkSecondFactor(db, key, person.id, typed, now);
    if (!check.ok) {
      const notice = failureNotice(check.failedAttempts);
      if (notice) noticeTwoFactor(db, person.id, notice);
      return refuse(check.locked ? "TWO_FACTOR_LOCKED" : "TWO_FACTOR_INVALID");
    }
    if (check.method === "recovery") {
      auditTwoFactor(
        {
          kind: "recovery_code_used",
          at: "sign_in",
          recoveryCodesLeft: check.recoveryCodesLeft,
        },
        who,
      );
    }
    return { ok: true, user: person };
  }

  if (!key) return { ok: true, user: person };
  const requiredBy = await twoFactorRequirement(db, {
    userId: person.id,
    email: person.email,
  });
  if (requiredBy === null) return { ok: true, user: person };

  if (typed.kind === "app" && row?.pendingStartedAt) {
    if (!(await allowCodeAttempt(person.id))) return refuse("RATE_LIMITED");
    if (!(await confirmSetup(db, key, person.id, typed.code, now))) {
      return refuse("TWO_FACTOR_INVALID");
    }
    auditTwoFactor({ kind: "enabled", how: "sign_in", requiredBy }, who);
    // Anyone with the password could set it up here: the mail is how the person learns of it.
    noticeTwoFactor(db, person.id, "enabled");
    return { ok: true, user: person };
  }
  return refuse("TWO_FACTOR_SETUP_REQUIRED");
}
