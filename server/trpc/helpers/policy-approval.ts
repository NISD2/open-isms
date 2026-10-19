import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { policy, policyVersion } from "@/schema";

export interface PolicyApproval {
  readonly companyId: string;
  readonly userId: string;
  readonly approverRole: string;
  /** The approval day: the policy's version and its start of validity. */
  readonly approvedOn: string;
  readonly now: Date;
  /** The drafts to approve, each by the requirement that owns it and its type. */
  readonly targets: readonly { readonly requirementId: string; readonly type: string }[];
}

/**
 * What an edit to an approved policy's text resets: the approval was for the old text, which
 * stays in its policy_version row. The policy goes back to a draft for management to approve.
 */
export const WITHDRAWN_APPROVAL = {
  status: "draft",
  effectiveFrom: null,
  approvedBy: null,
  approvedAt: null,
  approverRole: null,
} as const;

type PolicyText = {
  readonly title?: string;
  readonly content?: string | null;
  readonly fileKey?: string | null;
};

/**
 * Whether an edit changes the text of an approved policy, so that its approval lapses. The
 * approved text stays in its policy_version row.
 */
export const approvalLapses = (
  stored: PolicyText & { readonly status: string },
  edit: PolicyText,
): boolean =>
  stored.status === "approved" &&
  (["title", "content", "fileKey"] as const).some(
    (key) => edit[key] !== undefined && edit[key] !== stored[key],
  );

export const sha256Hex = (text: string): string =>
  createHash("sha256").update(text, "utf8").digest("hex");

/**
 * Approves the drafts and keeps each approved text as a policy_version row, in the caller's
 * transaction, so an approval is never recorded without the text it approved. Only drafts are
 * approved: a policy already approved keeps the approval it has. Returns the titles approved.
 */
export async function approvePolicies(
  tx: DbOrTx,
  approval: PolicyApproval,
): Promise<string[]> {
  const titles: string[] = [];
  for (const { requirementId, type } of approval.targets) {
    const rows = await tx
      .update(policy)
      .set({
        status: "approved",
        version: approval.approvedOn,
        effectiveFrom: approval.approvedOn,
        approvedBy: approval.userId,
        approvedAt: approval.now,
        approverRole: approval.approverRole,
        updatedAt: approval.now,
      })
      .where(
        and(
          eq(policy.companyId, approval.companyId),
          eq(policy.requirementId, requirementId),
          eq(policy.type, type),
          eq(policy.status, "draft"),
        ),
      )
      .returning({
        id: policy.id,
        title: policy.title,
        type: policy.type,
        content: policy.content,
      });
    const versions = rows.flatMap((row) =>
      row.content
        ? [
            {
              policyId: row.id,
              companyId: approval.companyId,
              type: row.type,
              title: row.title,
              content: row.content,
              contentSha256: sha256Hex(row.content),
              approvedBy: approval.userId,
              approverRole: approval.approverRole,
              approvedOn: approval.approvedOn,
              approvedAt: approval.now,
            },
          ]
        : [],
    );
    if (versions.length > 0) await tx.insert(policyVersion).values(versions);
    titles.push(...rows.map((row) => row.title));
  }
  return titles;
}
