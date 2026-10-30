import TwoFactorResetEmail, { TWO_FACTOR_RESET_COPY } from "./emails/two-factor-reset";
import { type EmailContent, safeHeader } from "./layout";
import { type EmailLocale, workflowMailLocaleOf } from "./locale";
import { renderEmail } from "./render";
import { replyAddress } from "./templates";

/** To the person, when a platform admin reset their two-factor sign-in (twoFactor.adminReset). */
export async function twoFactorResetEmail(opts: {
  readonly host: string;
  readonly locale?: EmailLocale;
}): Promise<EmailContent & { readonly replyTo: string }> {
  const locale = workflowMailLocaleOf(opts.locale ?? "en");
  const copy = TWO_FACTOR_RESET_COPY[locale];
  const contact = replyAddress();
  return {
    subject: safeHeader(copy.subject(opts.host)),
    html: await renderEmail(TwoFactorResetEmail, { locale, host: opts.host, contact }),
    text: [
      copy.heading,
      ``,
      copy.body(opts.host),
      ``,
      copy.next,
      ``,
      copy.notYou(contact),
    ].join("\n"),
    replyTo: contact,
  };
}
