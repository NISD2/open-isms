/**
 * The notice that a company is being handed to a new owner, or was: to the old owner, the new
 * one and every admin, once each. The old owner gets it even when they no longer belong to the
 * company, so a handover nobody expected is seen by the person it was taken from.
 */
import { eq, inArray } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import type { OwnershipNoticeKind } from "@/lib/mail/emails/ownership-transfer";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { ownershipTransferEmail } from "@/lib/mail/ownership-templates";
import { listCompanyMembers } from "@/lib/organization/membership";
import { getAppUrl } from "@/lib/utils";
import { company, user } from "@/schema";

type Reader = { readonly email: string; readonly locale: string | null };

/** Each address once, the old and new owner first. */
export const noticeReaders = (
  people: readonly (Reader | undefined)[],
  admins: readonly Reader[],
): Reader[] => {
  const seen = new Set<string>();
  return [...people, ...admins].filter((p): p is Reader => {
    if (!p) return false;
    const key = p.email.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

/** Reads names and addresses, then sends without waiting: the handover stands either way. */
export function mailOwnershipNotice(input: {
  readonly db: Database;
  readonly companyId: string;
  readonly actorId: string;
  readonly kind: OwnershipNoticeKind;
  readonly fromUserId: string | null;
  readonly toUserId: string;
  readonly expiresAt: Date | null;
}): void {
  const { db, companyId, actorId, kind } = input;
  const ids = [input.fromUserId, input.toUserId].filter(
    (id): id is string => id !== null,
  );

  Promise.all([
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { name: true },
    }),
    db
      .select({ id: user.id, name: user.name, email: user.email, locale: user.locale })
      .from(user)
      .where(inArray(user.id, ids)),
    listCompanyMembers(db, companyId),
  ])
    .then(async ([companyRow, people, members]) => {
      const from = people.find((p) => p.id === input.fromUserId);
      const to = people.find((p) => p.id === input.toUserId);
      if (!companyRow || !to) return;
      const readers = noticeReaders(
        [from, to],
        members.filter((m) => m.role === "admin"),
      );
      for (const reader of readers) {
        const content = await ownershipTransferEmail({
          kind,
          companyName: companyRow.name,
          fromName: from?.name ?? null,
          toName: to.name,
          expiresAt: input.expiresAt,
          teamUrl: `${getAppUrl()}/team`,
          locale: resolveEmailLocale(reader.locale, null),
        });
        const sent = await sendMail({
          emailType: "account.ownership_transfer",
          to: reader.email,
          ...content,
        });
        // Only a mail that left: a suppressed send also reports success.
        if (sent.success && wasDelivered(sent)) {
          logAudit({
            companyId,
            userId: actorId,
            action: "email.ownership_transfer",
            entityType: "email",
            entityId: sent.id ?? null,
            description: `Ownership ${kind} notice sent to ${reader.email}`,
          });
        }
      }
    })
    .catch((err) => console.error("[ownership] notice not sent", err));
}
