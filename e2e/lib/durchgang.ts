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
