/**
 * Builds the two footer links a recipient sees on any optional email: one to
 * switch off this kind of message, one to the preference centre.
 *
 * Kept apart from the consent rules so those stay free of URL and env
 * concerns, and apart from the layout so the layout stays a pure renderer.
 */
import "@/lib/server-guard";
import { oneClickUnsubscribeUrl, preferenceCentreUrl } from "@/lib/email/unsubscribe";
import type { EmailTypeId } from "./email-types";
import type { PreferenceFooter } from "./layout";

/**
 * The footer for one recipient and one message. Call sites pass the result
 * straight into a template's `footer`, so the visible opt-out and the RFC
 * 8058 header that `sendMail` derives always name the same scope.
 */
export function preferenceFooterFor(
  userId: string,
  emailType: EmailTypeId,
  locale?: "de" | "en" | "nl",
): PreferenceFooter {
  return {
    unsubscribeUrl: oneClickUnsubscribeUrl(userId, emailType),
    preferencesUrl: preferenceCentreUrl(userId, locale),
    locale,
  };
}
