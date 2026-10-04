/**
 * The announcement group: everyone grandfathered at the pricing launch (NIS2 plan, slice 5), frozen
 * into a newsletter group by the launch, so the Pricing tab can send them the announcement. The
 * launch named it "Bestandskonten <day>" and wrote it at the same instant as the stamps on the
 * people it grandfathered, so the group is the one created at a stamp's instant, never one somebody
 * later named alike.
 */
import "@/lib/server-guard";
import { and, count, desc, eq, exists, like } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { newsletterGroup, newsletterGroupMember, user } from "@/schema";

const GROUP_PREFIX = "Bestandskonten";

export const announcementGroup = async (db: DbOrTx) => {
  const [group] = await db
    .select({ id: newsletterGroup.id, name: newsletterGroup.name })
    .from(newsletterGroup)
    .where(
      and(
        like(newsletterGroup.name, `${GROUP_PREFIX} %`),
        exists(
          db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.grandfatheredAt, newsletterGroup.createdAt)),
        ),
      ),
    )
    .orderBy(desc(newsletterGroup.createdAt))
    .limit(1);
  if (!group) return null;
  const [members] = await db
    .select({ n: count() })
    .from(newsletterGroupMember)
    .where(eq(newsletterGroupMember.groupId, group.id));
  return { ...group, members: members?.n ?? 0 };
};
