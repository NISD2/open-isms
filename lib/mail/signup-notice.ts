import { describeSignupCampaign, describeSignupGate } from "@/lib/auth/signup-campaign";
import type { WalkLocale } from "@/lib/durchgang/types";
import type { SignupCampaign } from "@/schema";
import { NewSignupEmail } from "./emails/operator-notices";
import { type EmailContent, safeHeader } from "./layout";
import type { EmailLocale } from "./locale";
import { renderEmail } from "./render";
import { signupFollowUp } from "./signup-followup";

// ---------------------------------------------------------------------------
// Platform Admin: new user signup notification
// ---------------------------------------------------------------------------

/** The language the prepared follow-up is written in, named for the operator who sends it. */
const FOLLOW_UP_LANGUAGE: Record<WalkLocale, string> = {
  de: "German",
  en: "English",
  cs: "Czech",
};

export async function newUserSignupEmail(opts: {
  userEmail: string;
  userName: string;
  provider: string;
  /** The signup's own language, which the prepared follow-up is written in. */
  locale: EmailLocale;
  /** The campaign tags of the page the signup started from. */
  campaign: SignupCampaign | null;
}): Promise<EmailContent> {
  const { userEmail, userName, provider } = opts;
  const followUp = signupFollowUp({ name: userName, locale: opts.locale });
  const mailtoUrl = `mailto:${encodeURIComponent(userEmail)}?subject=${encodeURIComponent(followUp.subject)}&body=${encodeURIComponent(followUp.body)}`;
  const followUpLanguage = FOLLOW_UP_LANGUAGE[followUp.locale];
  const source = describeSignupCampaign(opts.campaign);
  const gate = describeSignupGate(opts.campaign);

  return {
    subject: `New signup: ${safeHeader(userEmail)}`,
    html: await renderEmail(NewSignupEmail, {
      userEmail,
      userName,
      provider,
      at: new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" }),
      mailtoUrl,
      followUpLanguage,
      source,
      gate,
    }),
    text: [
      `New signup: ${userEmail} (${userName}) via ${provider}`,
      ...(source ? [`Source: ${source}`] : []),
      ...(gate ? [`Wanted to open: ${gate}`] : []),
      "",
      `Follow up (prepared in ${followUpLanguage}): ${mailtoUrl}`,
    ].join("\n"),
  };
}
