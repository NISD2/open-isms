import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import type { TwoFactorNoticeKind } from "@/lib/mail/emails/two-factor-notice";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { twoFactorNoticeEmail } from "@/lib/mail/two-factor-templates";
import { getAppUrl } from "@/lib/utils";
import { user } from "@/schema";
import { LOCK_AFTER_FAILURES, WARN_AFTER_FAILURES } from "./store";

/**
 * Which notice a run of wrong codes earns, if any: one at the tenth in a row, one at the
 * hundredth, when codes from the app pause. Each count is reached once per run, so each mail goes
 * once until a right code starts the count again.
 */
export function failureNotice(failedAttempts: number): TwoFactorNoticeKind | null {
  if (failedAttempts === WARN_AFTER_FAILURES) return "failures";
  if (failedAttempts === LOCK_AFTER_FAILURES) return "locked";
  return null;
}

/**
 * Tells the person, at their own address, what happened to their second factor. Sent after the
 * change and never awaited by it: a mail that fails is logged, the change stands.
 */
export function noticeTwoFactor(
  db: DbOrTx,
  userId: string,
  kind: TwoFactorNoticeKind,
): void {
  const send = async () => {
    const [account] = await db
      .select({ email: user.email, locale: user.locale })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!account) return;
    const content = await twoFactorNoticeEmail({
      kind,
      host: new URL(getAppUrl()).host,
      locale: resolveEmailLocale(account.locale, null),
    });
    await sendMail({
      emailType: "account.two_factor_notice",
      to: account.email,
      ...content,
    });
  };
  send().catch((err) => console.error("[two-factor] notice not sent", kind, err));
}
