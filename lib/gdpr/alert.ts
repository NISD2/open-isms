/**
 * Telling a person that an erasure needs them. The same shape as the billing
 * alert (lib/billing/alert.ts): a log line alone is read by nobody. Callers
 * pass only facts that name no one (case references, company ids, counts),
 * because the mail and the log both outlive the erasure. Never throws.
 */
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { gdprAlertEmail, sendMail } from "@/lib/mail";

export const alertGdprOperators = async (subject: string, lines: readonly string[]) => {
  console.error(`[gdpr] ${subject}\n${lines.join("\n")}`);
  const admins = [...getPlatformAdminEmails()];
  if (admins.length === 0) return;
  await sendMail({
    emailType: "internal.gdpr_alert",
    to: admins,
    ...gdprAlertEmail({ subject, lines }),
  }).catch((err: unknown) =>
    console.error(
      "[gdpr] operator alert not sent:",
      err instanceof Error ? err.name : "unknown error",
    ),
  );
};
