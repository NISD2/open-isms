/**
 * The Art. 12(3) GDPR confirmation, sent the moment an erasure is done, at the address the account
 * had: a summary in the person's language with the formal record under it (./confirmation-mail),
 * and the certificate (./certificate) attached as a Markdown file. That address is kept in the
 * erasure record for exactly this, so nothing erased is needed.
 *
 * Never throws, because the erasure has already happened by the time this runs. A failed send
 * tells the operators, who still have the certificate in the Erasures tab to send by hand.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { documentEmail, sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import type { EmailLocale } from "@/lib/mail/locale";
import { renderRecordMarkdown } from "@/lib/mail/markdown";
import { dataErasureLog } from "@/schema";
import { alertGdprOperators } from "./alert";
import {
  buildErasureCertificate,
  erasureCertificateFilename,
  erasureRecord,
} from "./certificate";
import { erasureConfirmationWording } from "./confirmation-mail";
import { erasureStoredFiles } from "./erase-user";

interface Erasure {
  readonly logId: string;
  readonly caseRef: string;
  /** The erased account's own address, read before the erasure. */
  readonly to: string;
  /** The language the account read the platform in, read before the erasure with the address. */
  readonly locale: EmailLocale;
}

const send = async (db: DbOrTx, erasure: Erasure): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(dataErasureLog)
    .where(eq(dataErasureLog.id, erasure.logId))
    .limit(1);
  if (!row) throw new Error(`erasure record ${erasure.caseRef} not found`);
  const files = await erasureStoredFiles(db, row);
  const record = erasureRecord(row, files);
  const content = documentEmail(
    erasureConfirmationWording(row, files, erasure.locale, {
      html: await renderRecordMarkdown(record),
      text: record,
    }),
  );
  const result = await sendMail({
    emailType: "gdpr.erasure_confirmation",
    to: erasure.to,
    // Carries replyTo: the email says "reply here", and the default sender takes no replies.
    ...content,
    idempotencyKey: `erasure-${row.caseRef}`,
    // The address must not outlive the erasure in a failure record.
    failureLabel: `erasure ${row.caseRef}`,
    attachments: [
      {
        filename: erasureCertificateFilename(row),
        content: new TextEncoder().encode(buildErasureCertificate(row, files)),
        contentType: "text/markdown; charset=utf-8",
      },
    ],
  });
  // A send suppressed by configuration (mail off, no transport) reports success but went nowhere.
  return wasDelivered(result);
};

/** Sends the certificate to the erased person. Resolves to whether it went out. */
export async function sendErasureCertificate(
  db: DbOrTx,
  erasure: Erasure,
): Promise<boolean> {
  const sent = await send(db, erasure).catch((err) => {
    console.error(`[gdpr] erasure ${erasure.caseRef}: certificate not sent`, err);
    return false;
  });
  if (!sent) {
    await alertGdprOperators(`${erasure.caseRef}: Bestätigung von Hand senden`, [
      `Die Löschbestätigung zum Vorgang ${erasure.caseRef} ging nicht an die betroffene Person.`,
      "Bitte das Zertifikat im Tab Erasures herunterladen und von Hand senden.",
    ]);
  }
  return sent;
}
