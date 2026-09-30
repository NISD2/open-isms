/**
 * Telling a person that an erasure needs them. The same shape as the billing
 * alert (lib/billing/alert.ts): a log line alone is read by nobody. Callers
 * pass only facts that name no one (case references, company ids, counts),
 * because the mail and the log both outlive the erasure.
 *
 * Resolves to whether the mail actually went out, never throws: the caller
 * records the answer, and retries while it is false.
 */
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { gdprAlertEmail, sendMail } from "@/lib/mail";
import { deliverToOperators } from "@/lib/mail/delivery";

export const alertGdprOperators = async (
  subject: string,
  lines: readonly string[],
): Promise<boolean> => {
  console.error(`[gdpr] ${subject}\n${lines.join("\n")}`);
  return deliverToOperators(
    getPlatformAdminEmails(),
    (to) =>
      sendMail({
        emailType: "internal.gdpr_alert",
        to,
        ...gdprAlertEmail({ subject, lines }),
      }),
    "gdpr operator alert",
  );
};
