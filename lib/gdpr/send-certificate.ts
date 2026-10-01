/**
 * The Art. 12(3) GDPR confirmation, sent the moment an erasure is done: the person receives the
 * certificate (./certificate) in the email and as a Markdown file, at the address their account had.
 * That address is kept in the erasure record for exactly this, so nothing erased is needed.
 *
 * Never throws, because the erasure has already happened by the time this runs. A failed send
 * tells the operators, who still have the certificate in the Erasures tab to send by hand.
 */
import "@/lib/server-guard";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { mailSupportEmail } from "@/lib/env";
import { erasureConfirmationEmail, sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import { dataErasureLog } from "@/schema";
import { alertGdprOperators } from "./alert";
import { buildErasureCertificate, erasureCertificateFilename } from "./certificate";
import { erasureStoredFiles } from "./erase-user";

interface Erasure {
  readonly logId: string;
  readonly caseRef: string;
  /** The erased account's own address, read before the erasure. */
  readonly to: string;
}

const send = async (db: DbOrTx, erasure: Erasure): Promise<boolean> => {
  const [row] = await db
    .select()
    .from(dataErasureLog)
    .where(eq(dataErasureLog.id, erasure.logId))
    .limit(1);
  if (!row) throw new Error(`erasure record ${erasure.caseRef} not found`);
  const certificate = buildErasureCertificate(row, await erasureStoredFiles(db, row));
  const result = await sendMail({
    emailType: "gdpr.erasure_confirmation",
    to: erasure.to,
    ...erasureConfirmationEmail({ caseRef: row.caseRef, certificate }),
    // The certificate says "reply here"; the default sender takes no replies.
    replyTo: mailSupportEmail(),
    idempotencyKey: `erasure-${row.caseRef}`,
    // The address must not outlive the erasure in a failure record.
    failureLabel: `erasure ${row.caseRef}`,
    attachments: [
      {
        filename: erasureCertificateFilename(row),
        content: new TextEncoder().encode(certificate),
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
