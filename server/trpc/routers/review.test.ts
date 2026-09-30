/**
 * A review decision is mailed to whoever completed the requirement, and that
 * mail carries the reviewer's feedback on the company's work. Someone removed
 * from the company since then must not get it.
 */
import { describe, expect, test } from "bun:test";

const { reviewDecisionRecipient } = await import("./review");
type Database = import("@/lib/db").Database;

const COMPANY = "company-1";
const SUBMITTER = "11111111-1111-4111-8111-111111111111";

function fakeDb(opts: { completedBy: string | null; isMember: boolean }) {
  return {
    query: {
      companyRequirementStatus: {
        findFirst: async () => ({
          completedBy: opts.completedBy,
          requirementId: "requirement-1",
        }),
      },
      user: {
        findFirst: async () => ({
          email: "submitter@example.test",
          name: "Sam Submitter",
          locale: "de",
          companyId: COMPANY,
        }),
      },
      requirement: { findFirst: async () => ({ code: "1.1" }) },
      companyMembership: {
        findFirst: async () => (opts.isMember ? { role: "member" } : undefined),
      },
    },
  } as unknown as Database;
}

describe("reviewDecisionRecipient", () => {
  test("is the submitter while they are a member", async () => {
    const recipient = await reviewDecisionRecipient(
      fakeDb({ completedBy: SUBMITTER, isMember: true }),
      "status-1",
      COMPANY,
    );
    expect(recipient).toMatchObject({
      userId: SUBMITTER,
      requirementCode: "1.1",
      submitter: { email: "submitter@example.test" },
    });
  });

  test("is nobody once the submitter has been removed from the company", async () => {
    const recipient = await reviewDecisionRecipient(
      fakeDb({ completedBy: SUBMITTER, isMember: false }),
      "status-1",
      COMPANY,
    );
    expect(recipient).toBeNull();
  });

  test("is nobody when nobody completed the requirement", async () => {
    const recipient = await reviewDecisionRecipient(
      fakeDb({ completedBy: null, isMember: true }),
      "status-1",
      COMPANY,
    );
    expect(recipient).toBeNull();
  });
});
