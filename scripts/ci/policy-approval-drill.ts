/**
 * Policy approvals against a real Postgres: what management approved survives an edit. An
 * approval writes a policy_version row with the approved text and its sha256 in the same
 * transaction; an edit turns the policy back into a draft; the next approval adds a second row
 * and leaves the first as it was.
 *
 *   DATABASE_URL=postgres://... AUTH_SECRET=<32+ chars> bun scripts/ci/policy-approval-drill.ts
 *
 * Expects a migrated database filled with db/framework-seed.sql (the policy hangs on NIS2 2.4,
 * as the walk's information security policy does). Creates its own user and company under a
 * fresh run id.
 */
import { asc, eq } from "drizzle-orm";
import { createBillingAccount } from "@/lib/billing/accounts";
import { db } from "@/lib/db";
import { company, policy, policyVersion, requirement, user } from "@/schema";
import {
  approvePolicies,
  sha256Hex,
  WITHDRAWN_APPROVAL,
} from "@/server/trpc/helpers/policy-approval";

const RUN = crypto.randomUUID().slice(0, 8);
const TYPE = "information_security";
const FIRST = "Leitlinie, erste Fassung";
const SECOND = "Leitlinie, zweite Fassung";

const one = <T>(rows: readonly T[], what: string): T => {
  const [row] = rows;
  if (row === undefined) throw new Error(`${what}: no row`);
  return row;
};

async function approvedTextSurvivesAnEdit(): Promise<string | null> {
  const owner = one(
    await db
      .insert(user)
      .values({ email: `policy-${RUN}@example.test`, name: "Policy drill" })
      .returning({ id: user.id }),
    "user",
  );
  const org = one(
    await db
      .insert(company)
      .values({
        name: `Policy drill ${RUN}`,
        sector: "drill",
        entityType: "important",
        ownerId: owner.id,
        billingAccountId: await createBillingAccount(db, owner.id),
      })
      .returning({ id: company.id }),
    "company",
  );
  const req = one(
    await db
      .select({ id: requirement.id })
      .from(requirement)
      .where(eq(requirement.code, "2.4")),
    "requirement 2.4",
  );
  const draft = one(
    await db
      .insert(policy)
      .values({
        companyId: org.id,
        requirementId: req.id,
        title: "Leitlinie",
        type: TYPE,
        content: FIRST,
      })
      .returning({ id: policy.id }),
    "policy",
  );
  const approve = (day: string) =>
    db.transaction((tx) =>
      approvePolicies(tx, {
        companyId: org.id,
        userId: owner.id,
        approverRole: "ceo",
        approvedOn: day,
        now: new Date(`${day}T10:00:00Z`),
        targets: [{ requirementId: req.id, type: TYPE }],
      }),
    );

  await approve("2026-10-01");
  // The walk's rewrite and policy.update both end an approval this way.
  await db
    .update(policy)
    .set({ content: SECOND, ...WITHDRAWN_APPROVAL })
    .where(eq(policy.id, draft.id));
  const afterEdit = one(
    await db
      .select({ status: policy.status })
      .from(policy)
      .where(eq(policy.id, draft.id)),
    "policy after edit",
  );
  if (afterEdit.status !== "draft")
    return `an edited policy is ${afterEdit.status}, not a draft`;
  await approve("2026-10-15");

  const versions = await db
    .select({ content: policyVersion.content, sha: policyVersion.contentSha256 })
    .from(policyVersion)
    .where(eq(policyVersion.policyId, draft.id))
    .orderBy(asc(policyVersion.approvedAt));
  const texts = versions.map((v) => v.content).join(" | ");
  if (texts !== `${FIRST} | ${SECOND}`) {
    return `approved versions are "${texts}"; expected both texts, the first unchanged`;
  }
  return versions.every((v) => v.sha === sha256Hex(v.content))
    ? null
    : "a version's sha256 does not match its text";
}

const failures = [await approvedTextSurvivesAnEdit()].filter(
  (f): f is string => f !== null,
);
for (const f of failures) console.error(`[drill] FAIL: ${f}`);
if (failures.length === 0) {
  console.log("[drill] OK: what management approved survives an edit, with its sha256");
}
process.exit(failures.length === 0 ? 0 : 1);
