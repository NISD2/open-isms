/**
 * L3 sign-off after a save: a save takes back the signatures given before it, never one given
 * after it. The recheck runs in the background once the save has landed, so management signing
 * in that moment had the signature withdrawn although nothing changed after it. Two items rely on
 * the asset register: the one signed before the save goes back to management, the one signed
 * after it keeps its signature. Both are decided by the same revert, so the first going back is
 * the sign that the recheck has run.
 */
import { type APIRequestContext, expect, test } from "@playwright/test";
import { e2eQuery } from "../lib/db";
import {
  e2eTenant,
  keepSignOffs,
  requirementStatus,
  type Tenant,
  type Undo,
  undoAll,
} from "../lib/durchgang";

const ASSET = "E2E Signatur nach dem Speichern";
const SIGNED_BEFORE = "4.3";
const SIGNED_AFTER = "4.4";

/** superjson httpBatchLink call shape, as the app's own client sends it. */
const trpcMutation = (request: APIRequestContext, proc: string, input: unknown) =>
  request.post(`/api/trpc/${proc}?batch=1`, {
    data: { "0": { json: input } },
    headers: { "content-type": "application/json" },
    failOnStatusCode: false,
  });

/**
 * Signs `code` with a sign-off time `offset` away from now, in UTC as the app writes it. A time
 * ahead of now stands for a signature that lands after the save.
 */
const signAt = (tenant: Tenant, code: string, offset: string) =>
  e2eQuery(
    `UPDATE company_requirement_status s
        SET status = 'completed', signed_off_at = (now() AT TIME ZONE 'UTC') + $3::interval
       FROM requirement r, company_assessment a, compliance_framework f
      WHERE r.id = s.requirement_id AND a.id = s.assessment_id AND f.id = a.framework_id
        AND a.company_id = $1 AND f.code = 'nis2' AND r.code = $2`,
    [tenant.company_id, code, offset],
  );

const removeOurAsset = (tenant: Tenant) =>
  e2eQuery(`DELETE FROM asset WHERE company_id = $1 AND name = $2`, [
    tenant.company_id,
    ASSET,
  ]);

test.describe("a save and management's signature", () => {
  let tenant: Tenant;
  let undos: readonly Undo[] = [];

  test.beforeAll(async () => {
    tenant = await e2eTenant();
    await removeOurAsset(tenant);
    undos = [await keepSignOffs(tenant), () => removeOurAsset(tenant).then(() => {})];
  });

  test.afterAll(() => undoAll(undos));

  test("a save takes back the signature before it and keeps the one after it", async ({
    request,
  }) => {
    await signAt(tenant, SIGNED_BEFORE, "-1 hour");
    await signAt(tenant, SIGNED_AFTER, "1 hour");

    const saved = await trpcMutation(request, "asset.create", {
      name: ASSET,
      type: "server",
    });
    expect(saved.status(), await saved.text()).toBe(200);

    await expect
      .poll(async () => (await requirementStatus(tenant, SIGNED_BEFORE))?.status, {
        message: `${SIGNED_BEFORE}, signed before the save, goes back to management`,
        timeout: 15_000,
      })
      .toBe("needs_review");
    expect((await requirementStatus(tenant, SIGNED_AFTER))?.status).toBe("completed");
  });
});
