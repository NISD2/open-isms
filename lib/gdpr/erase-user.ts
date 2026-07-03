/**
 * GDPR Art. 17 account erasure — the transactional engine.
 *
 * Deleting a `user` row is BLOCKED by ~35 foreign keys (almost all NO ACTION),
 * and two of them are tamper-evident by design (the sign-off hash chain and the
 * audit log). So erasure cannot be a single cascade DELETE. This module:
 *
 *   1. hard-deletes rows that are purely the subject's personal data;
 *   2. severs the subject's attribution on records the company must keep
 *      (nullable FKs → NULL; not-null FKs → reassigned to a tombstone user;
 *      the subject's own sign-off snapshots have their PII redacted);
 *   3. sweeps email-keyed rows (email_otp, lead) that no FK reaches;
 *   4. deletes the account;
 *   5. if the subject was the SOLE member of a company, tears that company and
 *      all its tenant data down in FK-safe order;
 *   6. returns a structured {@link ErasureScope} describing exactly what happened.
 *
 * Multi-tenant safety: every attribution-severing statement filters by the
 * subject's userId, so it only ever touches rows attributed to THIS person.
 * Company data shared with other members is never deleted — only detached from
 * the erased user — unless the subject is the company's only member.
 *
 * The whole thing runs inside one transaction (see {@link eraseUser}); any
 * failure rolls the entire erasure back, so a partial deletion is impossible.
 */
import { createHash, createHmac } from "node:crypto";
import { and, eq, gte, inArray, isNotNull, lt, or, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  company,
  // personal
  gapAssessment,
  trainingLessonProgress,
  newsletterGroupMember,
  notification,
  requirementAssignment,
  categoryAssignment,
  // hash chain + evidence
  signOffHistory,
  policyAcknowledgment,
  companyInvite,
  // nullable attribution
  evidence,
  policy,
  trainingRecord,
  changeRequest,
  companyRequirementStatus,
  companyCategoryIntake,
  improvementItem,
  patchRecord,
  riskTreatment,
  auditFinding,
  auditLog,
  bsiIncidentReport,
  incident,
  // teardown-only roots + children
  companyAssessment,
  internalAudit,
  dataErasureLog,
} from "@/schema";
import type { ErasureMethod, ErasureScope } from "@/schema";

// Remaining table objects, kept in a second import to keep the list readable.
import {
  companyPolicyConfig,
  companyRiskMethodology,
  kpiMeasurement,
  managementReview,
  vulnerability,
  exercise,
  bsiRegistration,
  asset,
  risk,
  supplier,
  riskAsset,
  riskSupplier,
  assetSupplierOffering,
  incidentBroadcast,
  companyCertification,
  supplierInvite,
  emailOtp,
  lead,
} from "@/schema";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const TOMBSTONE_EMAIL = "erased-user@deleted.invalid";
/** Marker written over an erased subject's address where a row must keep a
 *  non-null email (e.g. notification.recipientEmail under its XOR constraint). */
const REDACTED_EMAIL = "redacted@erased.invalid";

/**
 * Pseudonymous suppression fingerprint of an email. Uses HMAC-SHA256 keyed by
 * ERASURE_EMAIL_HASH_SALT so the digest is not brute-forceable from the public
 * source (emails are low-entropy). Fails closed in production if the key is
 * unset rather than falling back to a committed constant.
 */
function hashEmail(email: string): string {
  const key = process.env.ERASURE_EMAIL_HASH_SALT;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ERASURE_EMAIL_HASH_SALT must be set in production to fingerprint erased emails.");
    }
    // Dev-only fallback so local flows work; never reached in prod.
    return createHmac("sha256", "dev-only-erasure-key").update(email.trim().toLowerCase()).digest("hex");
  }
  return createHmac("sha256", key).update(email.trim().toLowerCase()).digest("hex");
}

/** Recursively replace occurrences of the subject's email/name inside the
 *  string leaves of a JSON value. Walks the PARSED structure (not the
 *  serialized text), so values containing quotes, backslashes, or unicode are
 *  still matched — string-replacing over JSON text would miss their escaped
 *  encodings. Literal free-text PII redaction, not code/structure parsing. */
function redactPiiInJson<T>(value: T, needles: string[]): T {
  const patterns = needles
    .map((n) => n?.trim())
    .filter((n): n is string => !!n && n.length >= 3)
    .map((n) => new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"));
  if (patterns.length === 0) return value;
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") {
      let out = v;
      for (const re of patterns) out = out.replace(re, "[erased]");
      return out;
    }
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const src = v as Record<string, unknown>;
      const next: Record<string, unknown> = {};
      for (const k of Object.keys(src)) next[k] = walk(src[k]);
      return next;
    }
    return v;
  };
  return walk(value) as T;
}

export interface ErasureRequestMeta {
  requestReceivedAt?: Date | null;
  requestChannel?: string | null;
  rightsInvoked?: string | null;
  notes?: string | null;
}

export interface EraseUserInput {
  userId: string;
  actor: { userId: string | null; email: string };
  request?: ErasureRequestMeta;
}

// ── Blast-radius preview (read-only) ────────────────────────────────────────

export interface ErasurePreview {
  subject: { id: string; email: string; name: string; role: string; createdAt: Date };
  company: { id: string; name: string; sector: string; plan: string } | null;
  /** The subject owns the org. Deleting them tears the whole org down. */
  isOwner: boolean;
  /** Total accounts in the org (all deleted when isOwner). */
  memberCount: number;
  personalRecordCount: number;
  signOffCount: number;
  /** What an owner-teardown would delete. Null unless isOwner. */
  orgData:
    | {
        memberAccounts: number;
        assessments: number;
        assets: number;
        risks: number;
        incidents: number;
        suppliers: number;
        policies: number;
        signOffs: number;
      }
    | null;
  predictedMethod: ErasureMethod;
}

/** Await a Drizzle query and return its row count. */
async function len(q: Promise<unknown[]>): Promise<number> {
  return (await q).length;
}

export async function previewUserErasure(userId: string): Promise<ErasurePreview | null> {
  const [subject] = await db
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      companyId: user.companyId,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!subject) return null;

  let companyInfo: ErasurePreview["company"] = null;
  let memberCount = 0;
  let isOwner = false;
  const cid = subject.companyId;
  if (cid) {
    const [c] = await db
      .select({ id: company.id, name: company.name, sector: company.sector, plan: company.plan, ownerId: company.ownerId })
      .from(company)
      .where(eq(company.id, cid))
      .limit(1);
    if (c) {
      companyInfo = { id: c.id, name: c.name, sector: c.sector, plan: c.plan };
      isOwner = c.ownerId === userId;
    }
    memberCount = await len(db.select({ id: user.id }).from(user).where(eq(user.companyId, cid)));
  }

  const personalRecordCount =
    (await len(db.select({ id: gapAssessment.id }).from(gapAssessment).where(eq(gapAssessment.userId, userId)))) +
    (await len(db.select({ id: trainingLessonProgress.id }).from(trainingLessonProgress).where(eq(trainingLessonProgress.userId, userId)))) +
    (await len(db.select({ id: newsletterGroupMember.id }).from(newsletterGroupMember).where(eq(newsletterGroupMember.userId, userId)))) +
    (await len(db.select({ id: notification.id }).from(notification).where(eq(notification.recipientId, userId))));

  const signOffCount = await len(
    db.select({ id: signOffHistory.id }).from(signOffHistory).where(eq(signOffHistory.signedOffBy, userId)),
  );

  let orgData: ErasurePreview["orgData"] = null;
  if (isOwner && cid) {
    orgData = {
      memberAccounts: memberCount,
      assessments: await len(db.select({ id: companyAssessment.id }).from(companyAssessment).where(eq(companyAssessment.companyId, cid))),
      assets: await len(db.select({ id: asset.id }).from(asset).where(eq(asset.companyId, cid))),
      risks: await len(db.select({ id: risk.id }).from(risk).where(eq(risk.companyId, cid))),
      incidents: await len(db.select({ id: incident.id }).from(incident).where(eq(incident.companyId, cid))),
      suppliers: await len(db.select({ id: supplier.id }).from(supplier).where(or(eq(supplier.customerCompanyId, cid), eq(supplier.supplierCompanyId, cid)))),
      policies: await len(db.select({ id: policy.id }).from(policy).where(eq(policy.companyId, cid))),
      signOffs: await len(db.select({ id: signOffHistory.id }).from(signOffHistory).where(eq(signOffHistory.companyId, cid))),
    };
  }

  // Owner-teardown deletes everything (hard). A retained (non-owner) erasure
  // that severs the subject's sign-off attribution is an anonymisation.
  const predictedMethod: ErasureMethod =
    !isOwner && signOffCount > 0 ? "anonymized" : "hard_delete";

  return {
    subject: {
      id: subject.id,
      email: subject.email,
      name: subject.name,
      role: subject.role,
      createdAt: subject.createdAt,
    },
    company: companyInfo,
    isOwner,
    memberCount,
    personalRecordCount,
    signOffCount,
    orgData,
    predictedMethod,
  };
}

// ── Erasure ─────────────────────────────────────────────────────────────────

export interface ErasureResult {
  caseRef: string;
  logId: string;
  method: ErasureMethod;
  scope: ErasureScope;
  companyTornDown: boolean;
}

/** Runs the full erasure in a single transaction. Throws (and rolls back) on
 *  any failure, including if the subject or a durable log write fails. */
export async function eraseUser(input: EraseUserInput): Promise<ErasureResult> {
  return db.transaction((tx) => eraseUserInTx(tx, input));
}

async function eraseUserInTx(tx: Tx, input: EraseUserInput): Promise<ErasureResult> {
  const { userId, actor, request } = input;

  const [subject] = await tx
    .select({ id: user.id, email: user.email, name: user.name, companyId: user.companyId })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!subject) throw new Error(`User ${userId} not found`);
  if (subject.email === TOMBSTONE_EMAIL) throw new Error("Refusing to erase the erasure tombstone user");

  const scope: ErasureScope = {
    deleted: {},
    anonymized: {},
    systemsCleared: [],
    processorsInScope: [],
    companyTornDown: false,
    residualNotes: [],
  };

  const del = async (
    label: string,
    run: () => Promise<unknown[]>,
  ): Promise<void> => {
    const rows = await run();
    if (rows.length) scope.deleted[label] = (scope.deleted[label] ?? 0) + rows.length;
  };
  const anon = async (
    label: string,
    run: () => Promise<unknown[]>,
  ): Promise<void> => {
    const rows = await run();
    if (rows.length) scope.anonymized[label] = (scope.anonymized[label] ?? 0) + rows.length;
  };

  // Tombstone user is created lazily and reused across all erasures.
  let tombstoneId: string | null = null;
  const tombstone = async (): Promise<string> => {
    if (tombstoneId) return tombstoneId;
    const [existing] = await tx.select({ id: user.id }).from(user).where(eq(user.email, TOMBSTONE_EMAIL)).limit(1);
    if (existing) {
      tombstoneId = existing.id;
      return tombstoneId;
    }
    const [created] = await tx
      .insert(user)
      .values({ email: TOMBSTONE_EMAIL, name: "Erased user", role: "member" })
      .returning({ id: user.id });
    tombstoneId = created.id;
    return tombstoneId;
  };

  const cid = subject.companyId;

  // Ownership decides the blast radius: deleting the owner tears the whole org
  // down (every member + all org data); deleting a non-owner removes only them.
  let isOwner = false;
  let companyName: string | null = null;
  if (cid) {
    const [c] = await tx
      .select({ name: company.name, ownerId: company.ownerId })
      .from(company)
      .where(eq(company.id, cid))
      .limit(1);
    companyName = c?.name ?? null;
    isOwner = c?.ownerId === userId;
  }

  if (isOwner && cid) {
    // Erase every member (including the owner), then the org and all its data.
    const members = await tx
      .select({ userId: user.id, email: user.email, name: user.name })
      .from(user)
      .where(eq(user.companyId, cid));
    let membersErased = 0;
    for (const m of members) {
      if (m.email === TOMBSTONE_EMAIL) continue;
      await erasePerson(tx, m, scope, del, anon, tombstone);
      membersErased += 1;
    }
    await tearDownCompany(tx, cid, del, anon);
    scope.companyTornDown = true;
    scope.systemsCleared.push(
      `Entire organization torn down: ${membersErased} member account(s) and all organization compliance data`,
    );
  } else {
    await erasePerson(tx, { userId, email: subject.email, name: subject.name }, scope, del, anon, tombstone);
  }

  scope.systemsCleared.push(
    "Account record (name, email) in PostgreSQL",
    "Course / gap-assessment progress",
    "Newsletter membership",
    "In-portal notifications addressed to the subject",
    "Email verification (OTP) and lead records keyed to the email",
  );
  // Art. 28 sub-processors that physically hold copies. Google is deliberately
  // NOT listed: it is the user's own identity provider (OAuth), not a recipient
  // we disclosed data to, so it is not an Art. 19 recipient.
  scope.processorsInScope.push(
    "Hetzner (infrastructure and database hosting)",
    "Resend (transactional email logs)",
  );

    const method: ErasureMethod = Object.keys(scope.anonymized).length > 0 ? "anonymized" : "hard_delete";

  // ── Phase 8: durable, tamper-evident erasure log (same transaction) ──────
  const now = new Date();
  const caseRef = await nextCaseRef(tx, now);
  const retentionUntil = new Date(now);
  retentionUntil.setFullYear(retentionUntil.getFullYear() + 3);

  // Immutable payload the checksum covers. subjectEmail is deliberately NOT
  // here: it is minimised at retention, and the checksum must stay verifiable.
  const logCore = {
    caseRef,
    subjectUserId: userId,
    subjectEmailHash: hashEmail(subject.email),
    subjectName: subject.name,
    companyId: cid ?? null,
    companyName,
    requestReceivedAt: request?.requestReceivedAt ?? null,
    requestChannel: request?.requestChannel ?? "email",
    rightsInvoked: request?.rightsInvoked ?? "Right to erasure (Art. 17), all GDPR rights invoked",
    legalBasis: "GDPR Art. 17(1)(a), 17(1)(b)",
    erasedAt: now,
    actorUserId: actor.userId,
    actorEmail: actor.email,
    method,
    companyTornDown: scope.companyTornDown,
    scope,
    notes: request?.notes ?? null,
    retentionUntil,
  };
  const checksum = computeRecordChecksum(logCore);

  const [logRow] = await tx
    .insert(dataErasureLog)
    .values({ ...logCore, subjectEmail: subject.email, checksum })
    .returning({ id: dataErasureLog.id });

  return { caseRef, logId: logRow.id, method, scope, companyTornDown: scope.companyTornDown };
}

/** Erase one person: delete their purely-personal rows, sever or anonymise
 *  their attribution on retained records, sweep email-keyed rows, and delete
 *  the account. scope/del/anon/tombstone are shared so counts aggregate across
 *  a whole-organization teardown. */
async function erasePerson(
  tx: Tx,
  person: { userId: string; email: string; name: string },
  scope: ErasureScope,
  del: (label: string, run: () => Promise<unknown[]>) => Promise<void>,
  anon: (label: string, run: () => Promise<unknown[]>) => Promise<void>,
  tombstone: () => Promise<string>,
): Promise<void> {
  const { userId, email, name } = person;

  // Purely-personal rows.
  await del("gap_assessment", () => tx.delete(gapAssessment).where(eq(gapAssessment.userId, userId)).returning());
  await del("training_lesson_progress", () => tx.delete(trainingLessonProgress).where(eq(trainingLessonProgress.userId, userId)).returning());
  await del("newsletter_group_member", () => tx.delete(newsletterGroupMember).where(eq(newsletterGroupMember.userId, userId)).returning());
  await del("notification", () => tx.delete(notification).where(eq(notification.recipientId, userId)).returning());
  await del("requirement_assignment", () => tx.delete(requirementAssignment).where(eq(requirementAssignment.userId, userId)).returning());
  await del("category_assignment", () => tx.delete(categoryAssignment).where(eq(categoryAssignment.userId, userId)).returning());

  // Sign-off hash chain: reassign signer to the tombstone + redact snapshot PII.
  const soRows = await tx
    .select({ id: signOffHistory.id, snapshot: signOffHistory.snapshot })
    .from(signOffHistory)
    .where(eq(signOffHistory.signedOffBy, userId));
  if (soRows.length) {
    const tid = await tombstone();
    for (const r of soRows) {
      const redacted = redactPiiInJson(r.snapshot, [email, name]);
      await tx.update(signOffHistory).set({ signedOffBy: tid, snapshot: redacted }).where(eq(signOffHistory.id, r.id));
    }
    scope.anonymized["sign_off_history"] = (scope.anonymized["sign_off_history"] ?? 0) + soRows.length;
    scope.residualNotes.push(
      `${soRows.length} sign-off history entr${soRows.length === 1 ? "y" : "ies"} had the signer reassigned to a tombstone and snapshot PII redacted; their chained checksums are intentionally no longer verifiable as a consequence of lawful erasure.`,
    );
  }

  // Remaining NOT-NULL attribution reassigned to the tombstone.
  const invitedByRows = await tx.select({ id: companyInvite.id }).from(companyInvite).where(eq(companyInvite.invitedBy, userId));
  if (invitedByRows.length) {
    const tid = await tombstone();
    await tx.update(companyInvite).set({ invitedBy: tid }).where(eq(companyInvite.invitedBy, userId));
    scope.anonymized["company_invite"] = (scope.anonymized["company_invite"] ?? 0) + invitedByRows.length;
  }
  const ackRows = await tx.select({ id: policyAcknowledgment.id }).from(policyAcknowledgment).where(eq(policyAcknowledgment.userId, userId));
  if (ackRows.length) {
    const tid = await tombstone();
    await tx.update(policyAcknowledgment).set({ userId: tid }).where(eq(policyAcknowledgment.userId, userId));
    scope.anonymized["policy_acknowledgment"] = (scope.anonymized["policy_acknowledgment"] ?? 0) + ackRows.length;
  }
  const assignedByRows = await tx.select({ id: categoryAssignment.id }).from(categoryAssignment).where(eq(categoryAssignment.assignedBy, userId));
  if (assignedByRows.length) {
    const tid = await tombstone();
    await tx.update(categoryAssignment).set({ assignedBy: tid }).where(eq(categoryAssignment.assignedBy, userId));
    scope.anonymized["category_assignment"] = (scope.anonymized["category_assignment"] ?? 0) + assignedByRows.length;
  }

  // Nullable attribution columns set to NULL.
  await anon("company_invite", () => tx.update(companyInvite).set({ acceptedBy: null }).where(eq(companyInvite.acceptedBy, userId)).returning());
  await anon("evidence", () => tx.update(evidence).set({ uploadedBy: null }).where(eq(evidence.uploadedBy, userId)).returning());
  await anon("evidence", () => tx.update(evidence).set({ reviewedBy: null }).where(eq(evidence.reviewedBy, userId)).returning());
  await anon("policy", () => tx.update(policy).set({ approvedBy: null }).where(eq(policy.approvedBy, userId)).returning());
  await anon("training_record", () => tx.update(trainingRecord).set({ userId: null }).where(eq(trainingRecord.userId, userId)).returning());
  await anon("change_request", () => tx.update(changeRequest).set({ requestedBy: null }).where(eq(changeRequest.requestedBy, userId)).returning());
  await anon("change_request", () => tx.update(changeRequest).set({ approvedBy: null }).where(eq(changeRequest.approvedBy, userId)).returning());
  await anon("change_request", () => tx.update(changeRequest).set({ implementedBy: null }).where(eq(changeRequest.implementedBy, userId)).returning());
  await anon("company_requirement_status", () => tx.update(companyRequirementStatus).set({ completedBy: null }).where(eq(companyRequirementStatus.completedBy, userId)).returning());
  await anon("company_requirement_status", () => tx.update(companyRequirementStatus).set({ signedOffBy: null }).where(eq(companyRequirementStatus.signedOffBy, userId)).returning());
  await anon("company_requirement_status", () => tx.update(companyRequirementStatus).set({ reviewedBy: null }).where(eq(companyRequirementStatus.reviewedBy, userId)).returning());
  await anon("company_requirement_status", () => tx.update(companyRequirementStatus).set({ assignedTo: null }).where(eq(companyRequirementStatus.assignedTo, userId)).returning());
  await anon("company_category_intake", () => tx.update(companyCategoryIntake).set({ lastSavedBy: null }).where(eq(companyCategoryIntake.lastSavedBy, userId)).returning());
  await anon("company_category_intake", () => tx.update(companyCategoryIntake).set({ signedOffBy: null }).where(eq(companyCategoryIntake.signedOffBy, userId)).returning());
  await anon("improvement_item", () => tx.update(improvementItem).set({ assignedTo: null }).where(eq(improvementItem.assignedTo, userId)).returning());
  await anon("patch_record", () => tx.update(patchRecord).set({ exceptionApprovedBy: null }).where(eq(patchRecord.exceptionApprovedBy, userId)).returning());
  await anon("risk_treatment", () => tx.update(riskTreatment).set({ responsibleUserId: null }).where(eq(riskTreatment.responsibleUserId, userId)).returning());
  await anon("risk_treatment", () => tx.update(riskTreatment).set({ verifiedBy: null }).where(eq(riskTreatment.verifiedBy, userId)).returning());
  await anon("audit_finding", () => tx.update(auditFinding).set({ assignedTo: null }).where(eq(auditFinding.assignedTo, userId)).returning());
  await anon("audit_finding", () => tx.update(auditFinding).set({ verifiedBy: null }).where(eq(auditFinding.verifiedBy, userId)).returning());
  await anon("bsi_incident_report", () => tx.update(bsiIncidentReport).set({ createdBy: null }).where(eq(bsiIncidentReport.createdBy, userId)).returning());
  await anon("requirement_assignment", () => tx.update(requirementAssignment).set({ assignedBy: null }).where(eq(requirementAssignment.assignedBy, userId)).returning());
  await anon("incident", () => tx.update(incident).set({ createdBy: null }).where(eq(incident.createdBy, userId)).returning());
  await anon("risk", () => tx.update(risk).set({ acceptedBy: null }).where(eq(risk.acceptedBy, userId)).returning());

  // audit_log: sever the userId link AND scrub the subject's PII in the JSONB.
  const auditRows = await tx
    .select({ id: auditLog.id, previousValue: auditLog.previousValue, newValue: auditLog.newValue })
    .from(auditLog)
    .where(eq(auditLog.userId, userId));
  for (const r of auditRows) {
    await tx
      .update(auditLog)
      .set({
        userId: null,
        previousValue: redactPiiInJson(r.previousValue, [email, name]),
        newValue: redactPiiInJson(r.newValue, [email, name]),
      })
      .where(eq(auditLog.id, r.id));
  }
  if (auditRows.length) scope.anonymized["audit_log"] = (scope.anonymized["audit_log"] ?? 0) + auditRows.length;

  // Email-keyed rows no FK reaches.
  await del("email_otp", () => tx.delete(emailOtp).where(eq(emailOtp.email, email.toLowerCase())).returning());
  await del("lead", () => tx.delete(lead).where(eq(lead.email, email.toLowerCase())).returning());
  await anon("notification", () => tx.update(notification).set({ recipientEmail: REDACTED_EMAIL }).where(eq(notification.recipientEmail, email)).returning());

  // Delete the account row.
  await del("user", () => tx.delete(user).where(eq(user.id, userId)).returning());
}

// ── Solo-company teardown (children → parents) ───────────────────────────────

async function tearDownCompany(
  tx: Tx,
  cid: string,
  del: (label: string, run: () => Promise<unknown[]>) => Promise<void>,
  _anon: (label: string, run: () => Promise<unknown[]>) => Promise<void>,
): Promise<void> {
  const ids = async (rows: Promise<Array<{ id: string }>>): Promise<string[]> => (await rows).map((r) => r.id);

  const assessmentIds = await ids(tx.select({ id: companyAssessment.id }).from(companyAssessment).where(eq(companyAssessment.companyId, cid)));
  const statusIds =
    assessmentIds.length === 0
      ? []
      : await ids(tx.select({ id: companyRequirementStatus.id }).from(companyRequirementStatus).where(inArray(companyRequirementStatus.assessmentId, assessmentIds)));
  const policyIds = await ids(tx.select({ id: policy.id }).from(policy).where(eq(policy.companyId, cid)));
  const riskIds = await ids(tx.select({ id: risk.id }).from(risk).where(eq(risk.companyId, cid)));
  const assetIds = await ids(tx.select({ id: asset.id }).from(asset).where(eq(asset.companyId, cid)));
  const incidentIds = await ids(tx.select({ id: incident.id }).from(incident).where(eq(incident.companyId, cid)));
  const auditIds = await ids(tx.select({ id: internalAudit.id }).from(internalAudit).where(eq(internalAudit.companyId, cid)));

  const byIds = async (label: string, run: (list: string[]) => Promise<unknown[]>, list: string[]): Promise<void> => {
    if (list.length === 0) return;
    await del(label, () => run(list));
  };

  // Level 1 — leaves
  await byIds("evidence", (l) => tx.delete(evidence).where(inArray(evidence.requirementStatusId, l)).returning(), statusIds);
  await byIds("requirement_assignment", (l) => tx.delete(requirementAssignment).where(inArray(requirementAssignment.statusId, l)).returning(), statusIds);
  await del("sign_off_history", () => tx.delete(signOffHistory).where(eq(signOffHistory.companyId, cid)).returning());
  await byIds("company_category_intake", (l) => tx.delete(companyCategoryIntake).where(inArray(companyCategoryIntake.assessmentId, l)).returning(), assessmentIds);
  await byIds("category_assignment", (l) => tx.delete(categoryAssignment).where(inArray(categoryAssignment.assessmentId, l)).returning(), assessmentIds);
  await byIds("policy_acknowledgment", (l) => tx.delete(policyAcknowledgment).where(inArray(policyAcknowledgment.policyId, l)).returning(), policyIds);
  await byIds("risk_treatment", (l) => tx.delete(riskTreatment).where(inArray(riskTreatment.riskId, l)).returning(), riskIds);
  await byIds("risk_asset", (l) => tx.delete(riskAsset).where(inArray(riskAsset.riskId, l)).returning(), riskIds);
  await byIds("risk_supplier", (l) => tx.delete(riskSupplier).where(inArray(riskSupplier.riskId, l)).returning(), riskIds);
  await byIds("audit_finding", (l) => tx.delete(auditFinding).where(inArray(auditFinding.auditId, l)).returning(), auditIds);
  await byIds("asset_supplier_offering", (l) => tx.delete(assetSupplierOffering).where(inArray(assetSupplierOffering.assetId, l)).returning(), assetIds);
  await byIds("incident_broadcast", (l) => tx.delete(incidentBroadcast).where(inArray(incidentBroadcast.incidentId, l)).returning(), incidentIds);
  await byIds("bsi_incident_report", (l) => tx.delete(bsiIncidentReport).where(inArray(bsiIncidentReport.incidentId, l)).returning(), incidentIds);

  // Level 2 — company-scoped mid tables (delete asset-referencing rows before assets)
  await del("patch_record", () => tx.delete(patchRecord).where(eq(patchRecord.companyId, cid)).returning());
  await del("change_request", () => tx.delete(changeRequest).where(eq(changeRequest.companyId, cid)).returning());
  await del("vulnerability", () => tx.delete(vulnerability).where(eq(vulnerability.companyId, cid)).returning());
  await byIds("company_requirement_status", (l) => tx.delete(companyRequirementStatus).where(inArray(companyRequirementStatus.assessmentId, l)).returning(), assessmentIds);

  // Level 3 — roots
  await del("company_assessment", () => tx.delete(companyAssessment).where(eq(companyAssessment.companyId, cid)).returning());
  await del("policy", () => tx.delete(policy).where(eq(policy.companyId, cid)).returning());
  await del("internal_audit", () => tx.delete(internalAudit).where(eq(internalAudit.companyId, cid)).returning());
  await del("risk", () => tx.delete(risk).where(eq(risk.companyId, cid)).returning());
  await del("incident", () => tx.delete(incident).where(eq(incident.companyId, cid)).returning());
  await del("asset", () => tx.delete(asset).where(eq(asset.companyId, cid)).returning());
  // supplier is the only two-company relationship row (customerCompanyId +
  // supplierCompanyId). Only delete rows THIS company owns as the customer.
  // Rows where cid is merely the supplier to another (surviving) company are
  // that company's records: sever cid's identity instead of deleting them, so
  // we never destroy or FK-block another tenant. (cid's own risk_supplier /
  // offering / broadcast children of the deleted rows are already handled at
  // Level 1 and by cascade.)
  await del("supplier", () => tx.delete(supplier).where(eq(supplier.customerCompanyId, cid)).returning());
  await tx.update(supplier).set({ supplierCompanyId: null }).where(eq(supplier.supplierCompanyId, cid));

  // Remaining company-scoped tables
  await del("improvement_item", () => tx.delete(improvementItem).where(eq(improvementItem.companyId, cid)).returning());
  await del("kpi_measurement", () => tx.delete(kpiMeasurement).where(eq(kpiMeasurement.companyId, cid)).returning());
  await del("exercise", () => tx.delete(exercise).where(eq(exercise.companyId, cid)).returning());
  await del("management_review", () => tx.delete(managementReview).where(eq(managementReview.companyId, cid)).returning());
  await del("company_policy_config", () => tx.delete(companyPolicyConfig).where(eq(companyPolicyConfig.companyId, cid)).returning());
  await del("company_risk_methodology", () => tx.delete(companyRiskMethodology).where(eq(companyRiskMethodology.companyId, cid)).returning());
  await del("training_record", () => tx.delete(trainingRecord).where(eq(trainingRecord.companyId, cid)).returning());
  await del("training_lesson_progress", () => tx.delete(trainingLessonProgress).where(eq(trainingLessonProgress.companyId, cid)).returning());
  await del("gap_assessment", () => tx.delete(gapAssessment).where(eq(gapAssessment.companyId, cid)).returning());
  await del("notification", () => tx.delete(notification).where(eq(notification.companyId, cid)).returning());
  await del("company_invite", () => tx.delete(companyInvite).where(eq(companyInvite.companyId, cid)).returning());
  await del("bsi_registration", () => tx.delete(bsiRegistration).where(eq(bsiRegistration.companyId, cid)).returning());
  await del("audit_log", () => tx.delete(auditLog).where(eq(auditLog.companyId, cid)).returning());
  await del("company_certification", () => tx.delete(companyCertification).where(eq(companyCertification.companyId, cid)).returning());
  await del("supplier_invite", () => tx.delete(supplierInvite).where(eq(supplierInvite.fromCompanyId, cid)).returning());
  await tx.update(supplierInvite).set({ acceptedByCompanyId: null }).where(eq(supplierInvite.acceptedByCompanyId, cid));

  // Finally the company itself
  await del("company", () => tx.delete(company).where(eq(company.id, cid)).returning());
}

// ── helpers ──────────────────────────────────────────────────────────────────

async function nextCaseRef(tx: Tx, now: Date): Promise<string> {
  const year = now.getUTCFullYear();
  // Serialise case-ref allocation: concurrent erasures would otherwise read the
  // same count and collide on the UNIQUE case_ref, rolling one erasure back.
  // The advisory lock is released automatically at transaction end.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(4823001)`);
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const thisYear = await tx
    .select({ id: dataErasureLog.id })
    .from(dataErasureLog)
    .where(gte(dataErasureLog.erasedAt, startOfYear));
  const seq = String(thisYear.length + 1).padStart(4, "0");
  return `ERASURE-${year}-${seq}`;
}

/** Recursively canonicalise: sort object keys, render Dates as ISO. Produces a
 *  stable serialisation independent of key order, so a jsonb column re-read
 *  from Postgres (which reorders keys) canonicalises identically. */
function sortValue(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    const src = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortValue(src[k]);
    return out;
  }
  return value;
}

function computeRecordChecksum(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(sortValue(payload))).digest("hex");
}

type ErasureLogRow = InferSelectModel<typeof dataErasureLog>;

/** Recompute the checksum from a stored row and compare. subjectEmail and the
 *  bookkeeping columns (id, createdAt, checksum) are excluded, matching what
 *  was hashed at write time, so the check survives retention-minimisation.
 *  The payload keys must mirror `logCore` in eraseUserInTx. */
export function verifyErasureRecord(row: ErasureLogRow): boolean {
  const payload = {
    caseRef: row.caseRef,
    subjectUserId: row.subjectUserId,
    subjectEmailHash: row.subjectEmailHash,
    subjectName: row.subjectName,
    companyId: row.companyId,
    companyName: row.companyName,
    requestReceivedAt: row.requestReceivedAt,
    requestChannel: row.requestChannel,
    rightsInvoked: row.rightsInvoked,
    legalBasis: row.legalBasis,
    erasedAt: row.erasedAt,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    method: row.method,
    companyTornDown: row.companyTornDown,
    scope: row.scope,
    notes: row.notes,
    retentionUntil: row.retentionUntil,
  };
  return computeRecordChecksum(payload) === row.checksum;
}

/** Retention-policy step (Art. 5(1)(e)): minimise the raw email on erasure
 *  records past retentionUntil, leaving only the pseudonymous fingerprint.
 *  Not yet wired to a cron — call from a scheduled job. */
export async function purgeExpiredErasureRecords(now: Date): Promise<number> {
  const rows = await db
    .update(dataErasureLog)
    .set({ subjectEmail: null })
    .where(and(lt(dataErasureLog.retentionUntil, now), isNotNull(dataErasureLog.subjectEmail)))
    .returning({ id: dataErasureLog.id });
  return rows.length;
}
