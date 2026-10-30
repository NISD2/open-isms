/**
 * The mails of handing a company to another member: the code the owner confirms with, and the
 * notice to the old owner, the new one and the admins.
 */
import type { Locale } from "@/lib/seo";
import CodeEmail from "./emails/code";
import OwnershipTransferEmail, {
  OWNERSHIP_CODE_COPY,
  OWNERSHIP_TRANSFER_COPY,
  type OwnershipNoticeKind,
  ownershipTransferText,
} from "./emails/ownership-transfer";
import { type EmailContent, safeHeader } from "./layout";
import {
  codeMailLocale,
  type EmailLocale,
  isEmailLocale,
  resolveEmailLocale,
  workflowMailLocaleOf,
} from "./locale";
import { renderEmail } from "./render";
import { replyAddress } from "./templates";

/**
 * A security notice, so it asks for a reply when it was not expected: on nisd2.eu that reaches the
 * published contact address, never the no-reply sender.
 */
export async function ownershipTransferEmail(opts: {
  kind: OwnershipNoticeKind;
  companyName: string;
  fromName: string | null;
  toName: string;
  /** When a request lapses; only for "requested". */
  expiresAt: Date | null;
  teamUrl: string;
  /** The reader's language, when the caller knows it. */
  locale?: EmailLocale;
}): Promise<EmailContent & { readonly replyTo: string }> {
  const locale = workflowMailLocaleOf(opts.locale ?? "en");
  const props = {
    locale,
    kind: opts.kind,
    companyName: opts.companyName,
    fromName: opts.fromName,
    toName: opts.toName,
    // A calendar day in the company's time zone, as every business date here.
    until: opts.expiresAt
      ? new Intl.DateTimeFormat(locale === "cs" ? "cs-CZ" : "en-GB", {
          dateStyle: "long",
          timeZone: "Europe/Berlin",
        }).format(opts.expiresAt)
      : null,
    teamUrl: opts.teamUrl,
  };
  return {
    subject: safeHeader(
      OWNERSHIP_TRANSFER_COPY[locale].subject[opts.kind](opts.companyName, opts.toName),
    ),
    html: await renderEmail(OwnershipTransferEmail, props),
    text: ownershipTransferText(props),
    replyTo: replyAddress(),
  };
}

/** The code the owner types to confirm handing the company over. */
export async function ownershipCodeEmail(opts: {
  code: string;
  locale?: Locale;
}): Promise<EmailContent> {
  const language = codeMailLocale(opts.locale);
  const copy = OWNERSHIP_CODE_COPY[isEmailLocale(language) ? language : "en"];
  return {
    subject: safeHeader(`${copy.subjectPrefix}: ${opts.code}`),
    html: await renderEmail(CodeEmail, {
      locale: resolveEmailLocale(opts.locale ?? null, null),
      heading: copy.heading,
      intro: copy.intro,
      code: opts.code,
      expiryNote: copy.expiryNote,
      ignoreNote: copy.ignoreNote,
    }),
    text: [
      copy.heading,
      ``,
      copy.intro,
      ``,
      opts.code,
      ``,
      `${copy.expiryNote} ${copy.ignoreNote}`,
    ].join("\n"),
  };
}
