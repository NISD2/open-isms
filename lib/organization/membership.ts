/**
 * Company membership: which companies a person belongs to, and their role in each.
 *
 * `company_membership` is the source of truth. `user.companyId` is only the company the person has
 * open right now, so every tenant filter keyed on it keeps working; it must always name a company
 * the person is a member of, or be null. These helpers are the only way to change either, so the
 * two can never disagree.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { company, companyMembership, membershipRoleEnum, user } from "@/schema";

export type MembershipRole = (typeof membershipRoleEnum.enumValues)[number];

/** Narrow a role read from elsewhere (an invite row, a request) to one a membership can hold. */
export const asMembershipRole = (role: string): MembershipRole | null =>
  membershipRoleEnum.enumValues.find((r) => r === role) ?? null;

const membershipOf = (userId: string, companyId: string) =>
  and(eq(companyMembership.userId, userId), eq(companyMembership.companyId, companyId));

/**
 * Condition on the `user` table: the person belongs to the company. Use this, never
 * `user.companyId`, to ask whether someone is a member, because a member may have another of their
 * companies open.
 */
export const isMemberOf = (db: DbOrTx, companyId: string) =>
  inArray(
    user.id,
    db
      .select({ id: companyMembership.userId })
      .from(companyMembership)
      .where(eq(companyMembership.companyId, companyId)),
  );

/** The person's role in the company, or null if they are not a member of it. */
export const findMembershipRole = async (
  db: DbOrTx,
  input: { readonly userId: string; readonly companyId: string },
): Promise<MembershipRole | null> => {
  const row = await db.query.companyMembership.findFirst({
    where: membershipOf(input.userId, input.companyId),
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
      jobTitle: companyMembership.jobTitle,
      isManagement: user.isManagement,
      locale: user.locale,
      createdAt: user.createdAt,
    })
    .from(companyMembership)
    .innerJoin(user, eq(user.id, companyMembership.userId))
    .where(eq(companyMembership.companyId, companyId));

/** Every company the person belongs to, with their role in each, by name. */
export const listUserCompanies = (db: DbOrTx, userId: string) =>
  db
    .select({
      id: company.id,
      name: company.name,
      activatedAt: company.activatedAt,
      billingAccountId: company.billingAccountId,
      ownerId: company.ownerId,
      role: companyMembership.role,
    })
    .from(companyMembership)
    .innerJoin(company, eq(company.id, companyMembership.companyId))
    .where(eq(companyMembership.userId, userId))
    .orderBy(asc(company.name));

/**
 * The draft every verified user gets at signup, while it is still the only organization they are in
 * and their own: the one a first invite or a supplier signup replaces. Null otherwise, so a draft
 * started from an existing organization is never discarded.
 */
export const signupDraftOf = <
  C extends { readonly activatedAt: Date | null; readonly ownerId: string | null },
>(
  companies: readonly C[],
  userId: string,
): C | null => {
  const [only] = companies;
  return companies.length === 1 &&
    only &&
    only.activatedAt === null &&
    only.ownerId === userId
    ? only
    : null;
};

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
    .set({ companyId: input.companyId, updatedAt: new Date() })
    .where(eq(user.id, input.userId));
};

/**
 * Open one of the person's companies. The membership check and the write are one statement, so a
 * company the person does not belong to is never opened. Returns whether it was opened.
 */
export const openCompany = async (
  db: DbOrTx,
  input: { readonly userId: string; readonly companyId: string },
): Promise<boolean> => {
  const opened = await db
    .update(user)
    .set({ companyId: input.companyId, updatedAt: new Date() })
    .where(
      and(
        eq(user.id, input.userId),
        inArray(
          user.id,
          db
            .select({ id: companyMembership.userId })
            .from(companyMembership)
            .where(membershipOf(input.userId, input.companyId)),
        ),
      ),
    )
    .returning({ id: user.id });
  return opened.length > 0;
};

/**
 * Remove the person from the company. If it was the one they had open, their oldest remaining
 * membership is opened instead, or none if they have no other company.
 */
export const leaveCompany = async (
  db: DbOrTx,
  input: { readonly userId: string; readonly companyId: string },
): Promise<void> => {
  await db.delete(companyMembership).where(membershipOf(input.userId, input.companyId));
  const next = await db.query.companyMembership.findFirst({
    where: eq(companyMembership.userId, input.userId),
    orderBy: asc(companyMembership.createdAt),
    columns: { companyId: true },
  });
  await db
    .update(user)
    .set({ companyId: next?.companyId ?? null, updatedAt: new Date() })
    .where(and(eq(user.id, input.userId), eq(user.companyId, input.companyId)));
};

/**
 * Set the compliance role the person holds in one company. Other companies they belong to are not
 * affected. Does nothing if they are not a member of it.
 */
export const setMembershipJobTitle = async (
  db: DbOrTx,
  input: {
    readonly userId: string;
    readonly companyId: string;
    readonly jobTitle: string;
  },
): Promise<void> => {
  await db
    .update(companyMembership)
    .set({ jobTitle: input.jobTitle })
    .where(membershipOf(input.userId, input.companyId));
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
    .where(membershipOf(input.userId, input.companyId));
};
