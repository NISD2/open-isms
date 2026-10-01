/**
 * Render the emails people receive to disk with fixture data: no server, no database, no mail
 * transport. Lets a change to the shared layout be looked at across the whole set in one command,
 * at the width a mail client gives it.
 *
 *   bun run scripts/preview-emails.ts                 # as nisd2.eu sends them
 *   bun run scripts/preview-emails.ts --self-hosted   # as a self-hosted install sends them
 *
 * Output lands in .preview/emails/ (gitignored). Open index.html.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { canceledEmailWording, refundSentWording } from "@/lib/billing/cancel-terms";
import { invoiceDates, invoiceEmailWording } from "@/lib/billing/order";
import {
  type ErasureLogRow,
  erasureRecord,
  SELF_SERVICE_ACTOR,
  SELF_SERVICE_CHANNEL,
} from "@/lib/gdpr/certificate";
import { erasureConfirmationWording } from "@/lib/gdpr/confirmation-mail";
import type { EmailContent } from "@/lib/mail/layout";
import type { EmailLocale } from "@/lib/mail/locale";
import { renderRecordMarkdown } from "@/lib/mail/markdown";
import {
  categoryAssignedEmail,
  documentEmail,
  emailVerificationCodeEmail,
  welcomeEmail,
} from "@/lib/mail/templates";

const OUT_DIR = join(process.cwd(), ".preview", "emails");
const LOCALES: readonly EmailLocale[] = ["de", "en", "nl"];

// The footer and the signature follow the app's public address, so the preview picks one.
process.env.NEXT_PUBLIC_APP_URL = process.argv.includes("--self-hosted")
  ? "https://isms.example.org"
  : "https://www.nisd2.eu";

const amounts = { netCents: 480_000, vatCents: 91_200 };
const dates = invoiceDates(new Date("2026-09-15T09:00:00Z"));
const erasedAt = new Date("2026-10-01T10:00:00.000Z");

const erasureRow: ErasureLogRow = {
  id: "33333333-3333-4333-8333-333333333333",
  caseRef: "ERASURE-2026-0007",
  subjectUserId: "11111111-1111-4111-8111-111111111111",
  subjectEmail: "anna@kunde.example",
  subjectEmailHash: "a".repeat(64),
  subjectName: "Anna Muster",
  companyId: "22222222-2222-4222-8222-222222222222",
  companyName: "Kunde GmbH",
  requestReceivedAt: erasedAt,
  requestChannel: SELF_SERVICE_CHANNEL,
  rightsInvoked: "Right to erasure (Art. 17)",
  legalBasis: "GDPR Art. 17(1)(a), 17(1)(b)",
  erasedAt,
  actorUserId: null,
  actorEmail: SELF_SERVICE_ACTOR,
  method: "hard_delete",
  companyTornDown: true,
  scope: {
    deleted: { user: 1 },
    anonymized: {},
    systemsCleared: [],
    processorsInScope: ["Resend (transactional email logs)"],
    companyTornDown: true,
    residualNotes: [],
  },
  notes: null,
  retentionUntil: new Date("2029-10-01T10:00:00.000Z"),
  checksum: "b".repeat(64),
  createdAt: erasedAt,
};

const erasureMail = async (locale: EmailLocale): Promise<EmailContent> => {
  const files = { kind: "not_applicable" } as const;
  const record = erasureRecord(erasureRow, files);
  return documentEmail(
    erasureConfirmationWording(erasureRow, files, locale, {
      html: await renderRecordMarkdown(record),
      text: record,
    }),
  );
};

const creditNote = (locale: EmailLocale, refundOwed: boolean, accountErased: boolean) =>
  documentEmail(
    canceledEmailWording(
      {
        kind: "money_back",
        invoiceNumber: "RE-2026-0012",
        invoiceIssueDate: dates.issueDate,
        creditNoteNumber: "GS-2026-0003",
        creditNoteDate: "2026-10-01",
        amounts,
        refundOwed,
        attached: true,
        accountErased,
      },
      locale,
    ),
  );

const mails: readonly (readonly [string, () => EmailContent | Promise<EmailContent>])[] =
  [
    ["welcome", () => welcomeEmail({ name: "Anna" })],
    [
      "sign-in-code-de",
      () => emailVerificationCodeEmail({ code: "482913", locale: "de" }),
    ],
    [
      "assigned-with-opt-out-de",
      () =>
        categoryAssignedEmail({
          assigneeName: "Anna",
          categoryName: "Risikomanagement",
          categoryCode: "RM",
          companyName: "Kunde GmbH",
          assignerName: "Jan",
          categoryUrl: "https://www.nisd2.eu/journey",
          footer: {
            unsubscribeUrl: "https://www.nisd2.eu/api/email/unsubscribe?u=preview",
            preferencesUrl: "https://www.nisd2.eu/email/preferences?u=preview&lang=de",
            locale: "de",
          },
        }),
    ],
    ...(["de", "en"] as const).map(
      (locale) =>
        [
          `invoice-${locale}`,
          () =>
            documentEmail(
              invoiceEmailWording({
                number: "RE-2026-0012",
                locale,
                where: { attached: true, invoiceUrl: null },
                termsVersion: "2026-10-01",
                amounts,
                dates,
                firstOrder: true,
              }),
            ),
        ] as const,
    ),
    ...LOCALES.flatMap((locale) => [
      [`credit-note-paid-${locale}`, () => creditNote(locale, true, false)] as const,
      [
        `credit-note-unpaid-deleted-${locale}`,
        () => creditNote(locale, false, true),
      ] as const,
      [
        `renewal-stopped-${locale}`,
        () =>
          documentEmail(
            canceledEmailWording(
              {
                kind: "renewal",
                invoiceNumber: "RE-2026-0012",
                periodEnd: dates.performanceEndDate,
                reason: "window_passed",
              },
              locale,
            ),
          ),
      ] as const,
      [
        `refund-sent-${locale}`,
        () =>
          documentEmail(
            refundSentWording(
              {
                creditNoteNumber: "GS-2026-0003",
                invoiceNumber: "RE-2026-0012",
                amounts,
              },
              locale,
            ),
          ),
      ] as const,
      [`erasure-${locale}`, () => erasureMail(locale)] as const,
    ]),
  ];

const page = (subject: string, html: string) =>
  `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${subject}</title><body style="margin:0"><div style="font:13px -apple-system,sans-serif;padding:8px 12px;background:#222;color:#eee">Subject: ${subject}</div>${html}</body>`;

await mkdir(OUT_DIR, { recursive: true });
const written = await Promise.all(
  mails.map(async ([name, render]) => {
    const mail = await render();
    await writeFile(join(OUT_DIR, `${name}.html`), page(mail.subject, mail.html));
    return { name, subject: mail.subject };
  }),
);
await writeFile(
  join(OUT_DIR, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>Email previews</title><body style="font:14px -apple-system,sans-serif;margin:24px"><h1 style="font-size:18px">Email previews</h1><ul>${written
    .map(({ name, subject }) => `<li><a href="${name}.html">${name}</a>: ${subject}</li>`)
    .join("")}</ul></body>`,
);
console.log(`${written.length} emails written to ${OUT_DIR}`);
