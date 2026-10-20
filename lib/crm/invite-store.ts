/**
 * The database side of the invite step (./invite-step): which invites are still to
 * deal with, and which have been. The invites themselves are read by the function the
 * platform admin's "Invited users" tab uses, so Close and that tab cannot disagree
 * about who was invited.
 */
import "@/lib/server-guard";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { isDisposableEmail } from "@/lib/auth/disposable";
import type { DbOrTx } from "@/lib/db";
import { allInvites } from "@/lib/platform-admin/invites";
import { closeCrmSync, closeInviteSync, user } from "@/schema";
import type { CloseInvite, InviteStore } from "./invite-step";

export const inviteStore = (db: DbOrTx) =>
  ({
    openInvites: async (limit: number) => {
      const [invites, handled] = await Promise.all([
        allInvites(db, new Date()),
        db.select({ id: closeInviteSync.inviteId }).from(closeInviteSync),
      ]);
      const done = new Set(handled.map((row) => row.id));
      // Withdrawn invites are not added, and an invite whose sender was erased has no
      // company to join. A disposable address is the kind the sync keeps out for accounts.
      const wanted = invites
        .filter(
          (i) =>
            i.status !== "revoked" &&
            i.inviter !== null &&
            !done.has(i.id) &&
            !isDisposableEmail(i.email),
        )
        .toSorted((a, b) => a.invitedAt.getTime() - b.invitedAt.getTime());
      const inviterIds = [
        ...new Set(wanted.flatMap((i) => (i.inviter ? [i.inviter.id] : []))),
      ];
      const links =
        inviterIds.length === 0
          ? []
          : await db
              .select({
                userId: closeCrmSync.userId,
                leadId: closeCrmSync.leadId,
                contactId: closeCrmSync.contactId,
              })
              .from(closeCrmSync)
              .where(
                and(
                  inArray(closeCrmSync.userId, inviterIds),
                  isNotNull(closeCrmSync.leadId),
                  isNotNull(closeCrmSync.contactId),
                ),
              );
      const leadOf = new Map(
        links.flatMap((l) =>
          l.userId && l.leadId && l.contactId
            ? [[l.userId, { leadId: l.leadId, contactId: l.contactId }] as const]
            : [],
        ),
      );
      const ready = wanted.flatMap((i): CloseInvite[] => {
        const link = i.inviter ? leadOf.get(i.inviter.id) : undefined;
        return i.inviter && link
          ? [
              {
                id: i.id,
                kind: i.kind,
                email: i.email.trim().toLowerCase(),
                name: i.invitee?.name ?? null,
                invitedAt: i.invitedAt,
                inviterName: i.inviter.name,
                link,
              },
            ]
          : [];
      });
      return { invites: ready.slice(0, limit), waiting: ready.length };
    },

    inviteHandled: async (row) => {
      await db
        .insert(closeInviteSync)
        .values({
          inviteId: row.inviteId,
          kind: row.kind,
          outcome: row.outcome,
          leadId: row.link?.leadId ?? null,
          contactId: row.link?.contactId ?? null,
        })
        .onConflictDoNothing();
    },

    /** The companies of the synced people whose lead in Close this is. */
    leadCompanies: async (leadId: string): Promise<ReadonlySet<string>> => {
      const rows = await db
        .select({ companyId: user.companyId })
        .from(closeCrmSync)
        .innerJoin(user, eq(user.id, closeCrmSync.userId))
        .where(and(eq(closeCrmSync.leadId, leadId), isNotNull(user.companyId)));
      return new Set(rows.flatMap((row) => (row.companyId ? [row.companyId] : [])));
    },
  }) satisfies InviteStore & {
    leadCompanies(leadId: string): Promise<ReadonlySet<string>>;
  };
