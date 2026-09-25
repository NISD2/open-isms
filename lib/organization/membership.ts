/**
 * Company membership: which companies a person belongs to, and their role in each.
 *
 * `company_membership` is the source of truth. `user.companyId` is only the company the person has
 * open right now, so every tenant filter keyed on it keeps working; it must always name a company
 * the person is a member of, or be null. These helpers are the only way to change either, so the
 * two can never disagree.
 *
 * While `user.role` still exists it mirrors the role in the open company. Nothing reads it any more;
 * roles are read from the membership.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { companyMembership, membershipRoleEnum, user } from "@/schema";

export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];

/** Narrow a role read from elsewhere (an invite row, a request) to one a membership can hold. */
export const asMembershipRole = (role: string): MembershipRole | null =>
  membershipRoleEnum.enumValues.find((r) => r === role) ?? null;

/**
 * Until the release that reconciles memberships, a member must also have the company open. Nobody
 * can hold two memberships yet, so for every row this code writes that is the same thing; it drops
 * rows a container on the previous release wrote during a deploy (a removal that nulled
 * `user.companyId` but left the membership). The reconciling release deletes those rows and
 * removes this condition, before anyone can belong to two companies.
 */
const opensCompany = (companyId: string) => eq(user.companyId, companyId);

/**
 * Condition on the `user` table: the person belongs to the company. Use this, never
 * `user.companyId` alone, to ask whether someone is a member.
 */
export const isMemberOf = (db: DbOrTx, companyId: string) =>
  and(
    inArray(
      user.id,
      db
        .select({ id: companyMembership.userId })
        .from(companyMembership)
        .where(eq(companyMembership.companyId, companyId)),
    ),
    opensCompany(companyId),
  );

/** The person's role in the company, or null if they are not a member of it. */
export const findMembershipRole = async (
  db: DbOrTx,
  input: { readonly userId: string; readonly companyId: string },
): Promise<MembershipRole | null> => {
  const row = await db.query.companyMembership.findFirst({
    where: and(
      eq(companyMembership.userId, input.userId),
      eq(companyMembership.companyId, input.companyId),
    ),
    columns: { role: true },
  });
  return row?.role ?? null;
};

/** Everyone who belongs to the company, with their role in it. */
export const listCompanyMembers = (db: DbOrTx, companyId: string) =>
  db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: companyMembership.role,
      jobTitle: user.jobTitle,
      isManagement: user.isManagement,
      locale: user.locale,
      createdAt: user.createdAt,
    })
    .from(companyMembership)
    .innerJoin(user, eq(user.id, companyMembership.userId))
    .where(and(eq(companyMembership.companyId, companyId), opensCompany(companyId)));

/**
 * Make the person a member of the company with this role, and open it. An existing membership has
 * its role updated rather than being duplicated.
 */
export const joinCompany = async (
  db: DbOrTx,
  input: {
    readonly userId: string;
    readonly companyId: string;
    readonly role: MembershipRole;
  },
): Promise<void> => {
  await db
    .insert(companyMembership)
    .values(input)
    .onConflictDoUpdate({
      target: [companyMembership.userId, companyMembership.companyId],
      set: { role: input.role },
    });
  await db
    .update(user)
    .set({ companyId: input.companyId, role: input.role, updatedAt: new Date() })
    .where(eq(user.id, input.userId));
};

/**
 * Remove the person from the company. If it was the one they had open, their oldest remaining
 * membership is opened instead, or none if they have no other company.
 */
export const leaveCompany = async (
  db: DbOrTx,
  input: { readonly userId: string; readonly companyId: string },
): Promise<void> => {
  await db
    .delete(companyMembership)
    .where(
      and(
        eq(companyMembership.userId, input.userId),
        eq(companyMembership.companyId, input.companyId),
      ),
    );
  const next = await db.query.companyMembership.findFirst({
    where: eq(companyMembership.userId, input.userId),
    orderBy: asc(companyMembership.createdAt),
  });
  await db
    .update(user)
    .set({
      companyId: next?.companyId ?? null,
      role: next?.role ?? "member",
      updatedAt: new Date(),
    })
    .where(and(eq(user.id, input.userId), eq(user.companyId, input.companyId)));
};

/** Change the person's role in one company. Does nothing if they are not a member of it. */
export const setMembershipRole = async (
  db: DbOrTx,
  input: {
    readonly userId: string;
    readonly companyId: string;
    readonly role: MembershipRole;
  },
): Promise<void> => {
  await db
    .update(companyMembership)
    .set({ role: input.role })
    .where(
      and(
        eq(companyMembership.userId, input.userId),
        eq(companyMembership.companyId, input.companyId),
      ),
    );
  await db
    .update(user)
    .set({ role: input.role, updatedAt: new Date() })
    .where(and(eq(user.id, input.userId), eq(user.companyId, input.companyId)));
};
