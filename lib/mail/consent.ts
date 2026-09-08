/**
 * The consent gate: the one place that answers "may this message go to this
 * person?".
 *
 * It is consulted inside `sendMail`, not at the call sites, so an optional
 * email cannot be sent by forgetting to ask. The call site's only obligation
 * is to say WHICH message it is sending and WHO the recipient is, and the
 * type system makes both mandatory for anything gated (see lib/mail/send.ts).
 *
 * Three sources of "no", checked in this order:
 *   1. the recipient no longer exists            -> fail closed
 *   2. user.emailFollowupsDisabled               -> all optional mail off
 *      (the legacy coarse switch the RFC 8058 one-click header flips)
 *   3. an email_preference row naming "all", the message's category, or the
 *      message's own type id
 * Essential, external and operator mail never reaches the gate at all.
 *
 * This module is the I/O half; the decision itself lives in ./consent-rules
 * as pure functions, which is what the tests exercise.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { emailPreference, user } from "@/schema";
import { buildEmailConsent, DENY_OPTIONAL, type EmailConsent } from "./consent-rules";

export {
  buildEmailConsent,
  categoryScope,
  type EmailConsent,
  parseScope,
  SCOPE_ALL,
  typeScope,
} from "./consent-rules";

/**
 * Load a recipient's consent. An unknown user denies every optional message:
 * the safe direction when we cannot prove permission.
 */
export async function loadEmailConsent(
  db: DbOrTx,
  userId: string,
): Promise<EmailConsent> {
  const [recipient, rows] = await Promise.all([
    db.query.user.findFirst({
      where: eq(user.id, userId),
      columns: { emailFollowupsDisabled: true },
    }),
    db
      .select({ scope: emailPreference.scope })
      .from(emailPreference)
      .where(eq(emailPreference.userId, userId)),
  ]);
  if (!recipient) return DENY_OPTIONAL;
  return buildEmailConsent({
    followupsDisabled: recipient.emailFollowupsDisabled,
    scopes: rows.map((r) => r.scope),
  });
}
