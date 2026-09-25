/**
 * Telling a person that an order needs them in Qonto. A log line alone is read by nobody, and every
 * case that ends here is money: an invoice that may exist without our record, or a customer who
 * has not received theirs. Never throws, because it runs on paths that are already failing.
 */
import { getPlatformAdminEmails } from "@/lib/auth/platform-admin";
import { billingAlertEmail, sendMail } from "@/lib/mail";

export const alertOperators = async (subject: string, lines: readonly string[]) => {
  console.error(`[billing] ${subject}\n${lines.join("\n")}`);
  const admins = [...getPlatformAdminEmails()];
  if (admins.length === 0) return;
  await sendMail({
    emailType: "internal.billing_alert",
    to: admins,
    ...billingAlertEmail({ subject, lines }),
  }).catch((err) => console.error("[billing] operator alert not sent", err));
};
