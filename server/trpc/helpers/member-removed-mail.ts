/**
 * The mail that tells a removed member they no longer belong to the company, sent by
 * `team.removeMember` once the removal has committed.
 */
import { eq } from "drizzle-orm";
import { logAudit } from "@/lib/audit";
import type { Database } from "@/lib/db";
import { memberRemovedEmail, sendMail } from "@/lib/mail";
import { wasDelivered } from "@/lib/mail/delivery";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { company } from "@/schema";

/** Reads the company's name, then sends without waiting: the removal stands either way. */
export async function mailMemberRemoved(input: {
  readonly db: Database;
  readonly companyId: string;
  readonly actorId: string;
  readonly member: {
    readonly name: string;
    readonly email: string;
    readonly locale: string | null;
  };
}): Promise<void> {
  const { db, companyId, actorId, member } = input;
  const companyRow = await db.query.company.findFirst({
    where: eq(company.id, companyId),
    columns: { name: true },
  });

  memberRemovedEmail({
    companyName: companyRow?.name ?? "your company",
    memberName: member.name,
    locale: resolveEmailLocale(member.locale, null),
  })
    .then((content) =>
      sendMail({ emailType: "account.member_removed", to: member.email, ...content }),
    )
    .then((r) => {
      // Only a mail that left: a suppressed send also reports success. `r.success` is there to
      // narrow the type for `r.id`; `wasDelivered` decides.
      if (r.success && wasDelivered(r)) {
        logAudit({
          companyId,
          userId: actorId,
          action: "email.member_removed",
          entityType: "email",
          entityId: r.id ?? null,
          description: `Removal email sent to ${member.email}`,
        });
      }
    })
    .catch((err) => console.error("[team] removal email not sent", err));
}
