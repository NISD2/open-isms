/**
 * The demo company as it stands the day after it ordered the walk: two people, a paid account, an
 * activated company profile and the assessments every signup gets, and nothing filled in. The walk
 * itself is done through the browser (./walk.ts), so every row it leaves is one the app wrote.
 *
 * A previous run is removed with the app's own account erasure: erasing the owner tears the
 * company and all its data down, and the IT lead with it, who belongs nowhere else. Each reset
 * leaves an erasure record, as every erasure does.
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eraseUser } from "@/lib/gdpr/erase-user";
import { joinCompany, setMembershipJobTitle } from "@/lib/organization/membership";
import { billingAccount, company, user } from "@/schema";
import { createAssessmentsForFrameworks } from "@/server/trpc/helpers/setup-helpers";
import { COMPANY, IT_LEAD, MANAGEMENT } from "./persona";

const PEOPLE = [MANAGEMENT, IT_LEAD] as const;
const ACTOR = { userId: null, email: "scripts/demo-walk" } as const;

/**
 * Removes the demo people and their company. Refuses when the company found through them is not
 * the demo company, or when someone else has joined it, since nothing here can tell a renamed
 * demo from a real tenant.
 */
async function removePreviousRun(): Promise<void> {
  for (const person of PEOPLE) {
    const found = await db.query.user.findFirst({
      where: eq(user.email, person.email),
      columns: { id: true, companyId: true },
    });
    if (!found) continue;
    if (found.companyId) {
      const tenant = await db.query.company.findFirst({
        where: eq(company.id, found.companyId),
        columns: { name: true },
      });
      const members = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.companyId, found.companyId));
      const demoEmails: readonly string[] = PEOPLE.map((p) => p.email);
      const strangers = members.filter((m) => !demoEmails.includes(m.email));
      if (tenant && tenant.name !== COMPANY.name) {
        throw new Error(
          `Refusing to reset: ${person.email} belongs to "${tenant.name}", not "${COMPANY.name}".`,
        );
      }
      if (strangers.length > 0) {
        throw new Error(
          `Refusing to reset: ${strangers.length} account(s) this script did not create joined "${COMPANY.name}".`,
        );
      }
    }
    await eraseUser({ userId: found.id, actor: ACTOR });
  }
}

/** Creates the demo company and its two people, signed in with `password`. */
export async function seedDemoCompany(password: string): Promise<{ companyId: string }> {
  await removePreviousRun();

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date();
  // Tours dismissed, so no overlay sits on the screens the browser fills in.
  const [gf, it] = await db
    .insert(user)
    .values(
      PEOPLE.map((person) => ({
        email: person.email,
        name: person.name,
        isManagement: person === MANAGEMENT,
        passwordHash,
        emailVerifiedAt: now,
        locale: "de",
        journeyTourTeamDismissedAt: now,
        journeyTourGuidedDismissedAt: now,
        requirementTourDismissedAt: now,
        helpOfferDismissedAt: now,
      })),
    )
    .returning({ id: user.id });
  if (!gf || !it) throw new Error("user insert returned no rows");

  // Paid: the company ordered the walk.
  const [account] = await db
    .insert(billingAccount)
    .values({ ownerUserId: gf.id, accessLevel: "full" })
    .returning({ id: billingAccount.id });
  if (!account) throw new Error("billing account insert returned no row");

  const [created] = await db
    .insert(company)
    .values({
      ...COMPANY,
      billingAccountId: account.id,
      ownerId: gf.id,
      actsAsNis2Entity: true,
      activatedAt: now,
    })
    .returning({ id: company.id });
  if (!created) throw new Error("company insert returned no row");

  await joinCompany(db, { userId: gf.id, companyId: created.id, role: "admin" });
  await joinCompany(db, { userId: it.id, companyId: created.id, role: "admin" });
  await setMembershipJobTitle(db, {
    userId: gf.id,
    companyId: created.id,
    jobTitle: MANAGEMENT.jobTitle,
  });
  await setMembershipJobTitle(db, {
    userId: it.id,
    companyId: created.id,
    jobTitle: IT_LEAD.jobTitle,
  });
  await createAssessmentsForFrameworks(db, created.id, COMPANY.entityType);

  return { companyId: created.id };
}
