/**
 * Setup the Durchgang specs share. The walk is open to paid accounts only, and later layers sign
 * off against the same tenant, so a spec lifts the tenant for its file and puts back everything
 * it touched. Each step returns the function that undoes it; `undoAll` runs them last first.
 */
import { e2eQuery } from "./db";
import { E2E_USER_EMAIL } from "./env";

export type Undo = () => Promise<void>;

export interface Tenant {
  readonly company_id: string;
  readonly company_name: string;
  readonly billing_account_id: string;
  readonly access_level: string;
}

export interface PolicyRow {
  readonly title: string;
  readonly content: string | null;
  readonly status: string;
  readonly version: string;
  readonly effective_from: string | null;
  readonly approved_by: string | null;
  readonly approved_at: string | null;
  readonly approver_role: string | null;
}

interface IntakeRow {
  readonly id: string;
  readonly answers: Record<string, unknown> | null;
}

/** The company and billing account the e2e user signs in to. */
export async function e2eTenant(): Promise<Tenant> {
  const [row] = await e2eQuery<Tenant>(
    `SELECT c.id AS company_id, c.name AS company_name, b.id AS billing_account_id,
            b.access_level
       FROM "user" u
       JOIN company c ON c.id = u.company_id
       JOIN billing_account b ON b.id = c.billing_account_id
      WHERE u.email = $1`,
    [E2E_USER_EMAIL],
  );
  if (!row) throw new Error("the e2e tenant has no billing account");
  return row;
}

/**
 * Keeps the e2e user's compliance role in the tenant, which a spec may change (management is
 * `ceo`), and puts it back.
 */
export async function keepJobTitle(tenant: Tenant): Promise<Undo> {
  const [before] = await e2eQuery<{ job_title: string | null }>(
    `SELECT m.job_title FROM company_membership m JOIN "user" u ON u.id = m.user_id
      WHERE u.email = $1 AND m.company_id = $2`,
    [E2E_USER_EMAIL, tenant.company_id],
  );
  return async () => {
    await e2eQuery(
      `UPDATE company_membership m SET job_title = $3 FROM "user" u
        WHERE u.id = m.user_id AND u.email = $1 AND m.company_id = $2`,
      [E2E_USER_EMAIL, tenant.company_id, before?.job_title ?? null],
    );
  };
}

/** The e2e user's id, which an approval records. */
export async function e2eUserId(): Promise<string> {
  const [row] = await e2eQuery<{ id: string }>(`SELECT id FROM "user" WHERE email = $1`, [
    E2E_USER_EMAIL,
  ]);
  if (!row) throw new Error("the e2e user does not exist");
  return row.id;
}

/** Lifts the tenant to a paid account, which the Durchgang requires. */
export async function payFor(tenant: Tenant): Promise<Undo> {
  await e2eQuery(`UPDATE billing_account SET access_level = 'full' WHERE id = $1`, [
    tenant.billing_account_id,
  ]);
  return async () => {
    await e2eQuery(`UPDATE billing_account SET access_level = $2 WHERE id = $1`, [
      tenant.billing_account_id,
      tenant.access_level,
    ]);
  };
}

/** The tenant's intake rows of one category, by its code. */
export const intakeRows = (tenant: Tenant, category: string) =>
  e2eQuery<IntakeRow>(
    `SELECT i.id, i.answers
       FROM company_category_intake i
       JOIN company_assessment a ON a.id = i.assessment_id
       JOIN requirement_category rc ON rc.id = i.category_id
      WHERE a.company_id = $1 AND rc.code = $2`,
    [tenant.company_id, category],
  );

/** Puts one category's answers back as they were, and removes an intake row the spec created. */
export async function keepAnswers(tenant: Tenant, category: string): Promise<Undo> {
  const before = await intakeRows(tenant, category);
  return async () => {
    const kept = new Set(before.map((r) => r.id));
    for (const row of before) {
      await e2eQuery(`UPDATE company_category_intake SET answers = $2 WHERE id = $1`, [
        row.id,
        JSON.stringify(row.answers ?? {}),
      ]);
    }
    for (const row of await intakeRows(tenant, category)) {
      if (!kept.has(row.id)) {
        await e2eQuery(`DELETE FROM company_category_intake WHERE id = $1`, [row.id]);
      }
    }
  };
}

/** Removes the policies the spec wrote, and the clause choice for `type` if there was none. */
export async function keepPolicies(tenant: Tenant, type: string): Promise<Undo> {
  const ids = async () =>
    (
      await e2eQuery<{ id: string }>(`SELECT id FROM policy WHERE company_id = $1`, [
        tenant.company_id,
      ])
    ).map((p) => p.id);
  const before = new Set(await ids());
  const hadConfig =
    (
      await e2eQuery(
        `SELECT 1 FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
        [tenant.company_id, type],
      )
    ).length > 0;
  return async () => {
    for (const id of (await ids()).filter((written) => !before.has(written))) {
      await e2eQuery(`DELETE FROM policy WHERE id = $1`, [id]);
    }
    if (!hadConfig) {
      await e2eQuery(
        `DELETE FROM company_policy_config WHERE company_id = $1 AND policy_type = $2`,
        [tenant.company_id, type],
      );
    }
  };
}

/**
 * Keeps the tenant's requirement rows as they are, for a spec whose approval signs them off, and
 * puts back everything a sign-off writes: the status columns, the sign-off chain rows and the
 * reminders it schedules or cancels.
 */
export async function keepSignOffs(tenant: Tenant): Promise<Undo> {
  const [statuses] = await e2eQuery<{ rows: unknown }>(
    `SELECT coalesce(json_agg(s), '[]'::json) AS rows
       FROM company_requirement_status s
       JOIN company_assessment a ON a.id = s.assessment_id
      WHERE a.company_id = $1`,
    [tenant.company_id],
  );
  const chain = (
    await e2eQuery<{ id: string }>(
      `SELECT id FROM sign_off_history WHERE company_id = $1`,
      [tenant.company_id],
    )
  ).map((r) => r.id);
  const reminders = await e2eQuery<{ id: string; status: string }>(
    `SELECT id, status FROM notification WHERE company_id = $1`,
    [tenant.company_id],
  );
  return async () => {
    await e2eQuery(
      `DELETE FROM sign_off_history WHERE company_id = $1 AND NOT (id = ANY($2::uuid[]))`,
      [tenant.company_id, chain],
    );
    await e2eQuery(
      `DELETE FROM notification WHERE company_id = $1 AND NOT (id = ANY($2::uuid[]))`,
      [tenant.company_id, reminders.map((r) => r.id)],
    );
    for (const { id, status } of reminders) {
      await e2eQuery(`UPDATE notification SET status = $2 WHERE id = $1`, [id, status]);
    }
    await e2eQuery(
      `UPDATE company_requirement_status t
          SET status = r.status, completed_at = r.completed_at, completed_by = r.completed_by,
              signed_off_by = r.signed_off_by, signed_off_at = r.signed_off_at,
              signed_off_role = r.signed_off_role,
              signed_off_template_version = r.signed_off_template_version,
              sign_off_snapshot = r.sign_off_snapshot, next_review_date = r.next_review_date,
              last_reviewed_at = r.last_reviewed_at, updated_at = r.updated_at
         FROM json_populate_recordset(NULL::company_requirement_status, $1::json) r
        WHERE t.id = r.id`,
      [JSON.stringify(statuses?.rows ?? [])],
    );
  };
}

/**
 * Puts the walk item `code` where a finished walk leaves it: unsigned, in progress, with the
 * walk's "filled in" event as its newest. Run after `keepSignOffs`, which puts the status row
 * back; the undo removes the event.
 */
export async function fillWalkItem(tenant: Tenant, code: string): Promise<Undo> {
  const [row] = await e2eQuery<{ status_id: string; requirement_id: string }>(
    `SELECT s.id AS status_id, s.requirement_id
       FROM company_requirement_status s
       JOIN company_assessment a ON a.id = s.assessment_id
       JOIN compliance_framework f ON f.id = a.framework_id
       JOIN requirement r ON r.id = s.requirement_id
      WHERE a.company_id = $1 AND f.code = 'nis2' AND r.code = $2`,
    [tenant.company_id, code],
  );
  if (!row) throw new Error(`the e2e tenant has no status row for ${code}`);
  await e2eQuery(
    `UPDATE company_requirement_status
        SET status = 'in_progress', signed_off_at = NULL, signed_off_by = NULL,
            signed_off_role = NULL, sign_off_snapshot = NULL, completed_at = NULL,
            completed_by = NULL
      WHERE id = $1`,
    [row.status_id],
  );
  const [event] = await e2eQuery<{ id: string }>(
    `INSERT INTO audit_log (company_id, user_id, action, entity_type, entity_id, description)
     VALUES ($1, $2, 'durchgang.item_done', 'requirement', $3, $4)
     RETURNING id`,
    [tenant.company_id, await e2eUserId(), row.requirement_id, `${code} filled in (e2e)`],
  );
  return async () => {
    if (event) await e2eQuery(`DELETE FROM audit_log WHERE id = $1`, [event.id]);
  };
}

/** The requirement row of `code` in the tenant's NIS 2 assessment. */
export async function requirementStatus(
  tenant: Tenant,
  code: string,
): Promise<{ status: string; signed_off_role: string | null } | null> {
  const [row] = await e2eQuery<{ status: string; signed_off_role: string | null }>(
    `SELECT s.status, s.signed_off_role
       FROM company_requirement_status s
       JOIN company_assessment a ON a.id = s.assessment_id
       JOIN compliance_framework f ON f.id = a.framework_id
       JOIN requirement r ON r.id = s.requirement_id
      WHERE a.company_id = $1 AND f.code = 'nis2' AND r.code = $2`,
    [tenant.company_id, code],
  );
  return row ?? null;
}

/** The policy of `type` the walk wrote for the tenant, or null. */
export async function walkPolicy(
  tenant: Tenant,
  type: string,
): Promise<PolicyRow | null> {
  const [row] = await e2eQuery<PolicyRow>(
    `SELECT title, content, status, version, effective_from::text, approved_by, approved_at,
            approver_role
       FROM policy WHERE company_id = $1 AND type = $2`,
    [tenant.company_id, type],
  );
  return row ?? null;
}

/** Runs the undos in reverse order of the setup steps that returned them. */
export async function undoAll(undos: readonly Undo[]): Promise<void> {
  for (const undo of [...undos].reverse()) await undo();
}
