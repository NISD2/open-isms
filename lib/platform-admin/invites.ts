import "@/lib/server-guard";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { DbOrTx } from "@/lib/db";
import { company, companyInvite, supplierInvite, user } from "@/schema";

/**
 * Everyone invited onto the platform, and by whom, for the platform admin's "Invited users" tab:
 * colleagues invited into a company (`company_invite`) and suppliers sent the security
 * questionnaire (`supplier_invite`). The team invite row names its sender; the supplier invite row
 * does not, so its sender is the person whose `supplierInvite.create` audit row first sent it.
 */

export type InviteStatus = "pending" | "joined" | "expired" | "revoked";

export interface InviteFacts {
  readonly accepted: boolean;
  readonly revoked: boolean;
  readonly expiresAt: Date;
}

/** Where an invite stands: taken up, withdrawn, past its date, or still open. */
export const inviteStatus = (facts: InviteFacts, now: Date): InviteStatus =>
  facts.accepted
    ? "joined"
    : facts.revoked
      ? "revoked"
      : facts.expiresAt <= now
        ? "expired"
        : "pending";

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}

export interface InviteRow {
  readonly id: string;
  readonly kind: "team" | "supplier";
  readonly invitedAt: Date;
  readonly email: string;
  /** The role a colleague was invited to; null for a supplier. */
  readonly role: string | null;
  readonly status: InviteStatus;
  /** Who sent it; null when no account or audit row names them any more (erased). */
  readonly inviter: Person | null;
  /** The account the invited address has now, joined or not; null while it has none. */
  readonly invitee: Person | null;
  readonly companyId: string;
  readonly companyName: string;
}

const inviter = alias(user, "inviter");

const teamInvites = (db: DbOrTx) =>
  db
    .select({
      id: companyInvite.id,
      invitedAt: companyInvite.createdAt,
      email: companyInvite.email,
      role: companyInvite.role,
      status: companyInvite.status,
      expiresAt: companyInvite.expiresAt,
      companyId: company.id,
      companyName: company.name,
      inviterId: inviter.id,
      inviterName: inviter.name,
      inviterEmail: inviter.email,
    })
    .from(companyInvite)
    .innerJoin(company, eq(company.id, companyInvite.companyId))
    .leftJoin(inviter, eq(inviter.id, companyInvite.invitedBy));

const supplierInvites = (db: DbOrTx) =>
  db
    .select({
      id: supplierInvite.id,
      invitedAt: supplierInvite.createdAt,
      email: supplierInvite.toEmail,
      expiresAt: supplierInvite.expiresAt,
      accepted: sql<boolean>`${supplierInvite.acceptedAt} is not null`,
      companyId: company.id,
      companyName: company.name,
      // The procedure's own audit row: its input names the address as typed, so compared lowercased
      // as the invite row stores it.
      inviterId: sql<string | null>`(
        select a.user_id from audit_log a
         where a.action = 'supplierInvite.create'
           and a.company_id = ${supplierInvite.fromCompanyId}
           and lower(a.new_value->>'toEmail') = ${supplierInvite.toEmail}
         order by a.created_at asc limit 1)`,
      // Revoking only moves the end date to now, so the audit row is what tells it from expiry.
      revoked: sql<boolean>`exists (
        select 1 from audit_log a
         where a.action = 'supplierInvite.revoke'
           and a.company_id = ${supplierInvite.fromCompanyId}
           and a.new_value->>'id' = ${supplierInvite.id}::text
           and a.created_at >= ${supplierInvite.createdAt})`,
    })
    .from(supplierInvite)
    .innerJoin(company, eq(company.id, supplierInvite.fromCompanyId));

/** People by id and by lowercased email, for the senders and the invited addresses. */
async function peopleOf(
  db: DbOrTx,
  ids: readonly string[],
  emails: readonly string[],
): Promise<{
  readonly byId: ReadonlyMap<string, Person>;
  readonly byEmail: ReadonlyMap<string, Person>;
}> {
  const columns = { id: user.id, name: user.name, email: user.email };
  const [withId, withEmail] = await Promise.all([
    ids.length
      ? db
          .select(columns)
          .from(user)
          .where(inArray(user.id, [...ids]))
      : [],
    emails.length
      ? db
          .select(columns)
          .from(user)
          .where(inArray(sql`lower(${user.email})`, [...emails]))
      : [],
  ]);
  return {
    byId: new Map(withId.map((p) => [p.id, p])),
    byEmail: new Map(withEmail.map((p) => [p.email.toLowerCase(), p])),
  };
}

/** Every invite of both kinds, the newest first. */
export async function allInvites(db: DbOrTx, now: Date): Promise<readonly InviteRow[]> {
  const [team, suppliers] = await Promise.all([
    teamInvites(db).orderBy(desc(companyInvite.createdAt)),
    supplierInvites(db).orderBy(desc(supplierInvite.createdAt)),
  ]);
  const people = await peopleOf(
    db,
    suppliers.flatMap((s) => (s.inviterId ? [s.inviterId] : [])),
    [...new Set([...team, ...suppliers].map((i) => i.email.toLowerCase()))],
  );
  const inviteeOf = (email: string) => people.byEmail.get(email.toLowerCase()) ?? null;

  const rows: InviteRow[] = [
    ...team.map((t) => ({
      id: t.id,
      kind: "team" as const,
      invitedAt: t.invitedAt,
      email: t.email,
      role: t.role,
      status: inviteStatus(
        {
          accepted: t.status === "accepted",
          revoked: t.status === "revoked",
          expiresAt: t.expiresAt,
        },
        now,
      ),
      inviter:
        t.inviterId && t.inviterName !== null && t.inviterEmail !== null
          ? { id: t.inviterId, name: t.inviterName, email: t.inviterEmail }
          : null,
      invitee: inviteeOf(t.email),
      companyId: t.companyId,
      companyName: t.companyName,
    })),
    ...suppliers.map((s) => ({
      id: s.id,
      kind: "supplier" as const,
      invitedAt: s.invitedAt,
      email: s.email,
      role: null,
      status: inviteStatus(
        { accepted: s.accepted, revoked: s.revoked, expiresAt: s.expiresAt },
        now,
      ),
      inviter: s.inviterId ? (people.byId.get(s.inviterId) ?? null) : null,
      invitee: inviteeOf(s.email),
      companyId: s.companyId,
      companyName: s.companyName,
    })),
  ];
  return rows.toSorted((a, b) => b.invitedAt.getTime() - a.invitedAt.getTime());
}
