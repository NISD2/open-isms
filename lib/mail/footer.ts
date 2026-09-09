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
import type { EmailLocale } from "./locale";

/**
 * The footer for one recipient and one message. Call sites pass the result
 * straight into a template's `footer`, so the visible opt-out and the RFC
 * 8058 header that `sendMail` derives always name the same scope.
 *
 * `locale` is required, and that is the point. It used to be optional and
 * every one of the five call sites left it out, so `layout.ts` fell back to
 * its `?? "de"` and every English digest went out with a German footer under
 * it. The preference centre link lost its `&lang=` too, so the page a
 * recipient landed on to opt out was in the wrong language as well. An
 * optional parameter that nobody remembers to pass is not a default, it is
 * a bug with a shrug in front of it. Resolve one with resolveEmailLocale().
 */
export function preferenceFooterFor(
  userId: string,
  emailType: EmailTypeId,
  locale: EmailLocale,
): PreferenceFooter {
  return {
    unsubscribeUrl: oneClickUnsubscribeUrl(userId, emailType),
    preferencesUrl: preferenceCentreUrl(userId, locale),
    locale,
  };
}
