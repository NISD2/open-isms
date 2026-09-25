/**
 * Company membership: which companies a person belongs to, and their role in each.
 *
 * `company_membership` is the source of truth. `user.companyId` is only the company the person has
 * open right now, so every tenant filter keyed on it keeps working; it must always name a company
 * the person is a member of, or be null. These helpers are the only way to change either, so the
 * two can never disagree.
 *
 * While `user.role` still exists it mirrors the role in the open company, so code that reads it
 * keeps seeing the right value until it is removed.
 */
import { and, asc, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { companyMembership, membershipRoleEnum, user } from "@/schema";

export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];

/** Narrow a role read from elsewhere (an invite row, a request) to one a membership can hold. */
export const asMembershipRole = (role: string): MembershipRole | null =>
  membershipRoleEnum.enumValues.find((r) => r === role) ?? null;

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
