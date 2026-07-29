/**
 * L3 cross-tenant isolation — the company-ending failure mode. The whole
 * suite otherwise runs as one seeded company, so a dropped `companyId`
 * filter in any ownership guard would go unnoticed. This provisions a
 * SECOND company (Rival GmbH) with its own asset, then, as the Dev GmbH
 * admin (the authenticated session every spec uses), attacks Rival's asset
 * over the real tRPC endpoint and asserts Rival's data is untouched.
 *
 * Ground truth is always Postgres after the attack, not the HTTP envelope,
 * so the assertions hold regardless of how tRPC reports a rejected call.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { e2eQuery } from "../lib/db";

const RIVAL_ASSET_NAME = "RIVAL Kronjuwelen Server";

/** superjson httpBatchLink call shapes. */
async function trpcMutation(
  request: APIRequestContext,
  proc: string,
  input: unknown,
) {
  return request.post(`/api/trpc/${proc}?batch=1`, {
    data: { "0": { json: input } },
    headers: { "content-type": "application/json" },
    failOnStatusCode: false,
  });
}
async function trpcQuery(
  request: APIRequestContext,
  proc: string,
  input: unknown,
) {
  const q = encodeURIComponent(JSON.stringify({ "0": { json: input } }));
  return request.get(`/api/trpc/${proc}?batch=1&input=${q}`, {
    failOnStatusCode: false,
  });
}

test("cross-tenant: one company cannot read, update or delete another's asset", async ({ request }) => {
  // Provision Rival GmbH + its asset directly (a real second tenant).
  const [company] = await e2eQuery<{ id: string }>(
    `INSERT INTO company (name, sector, entity_type, activated_at, acts_as_nis2_entity)
     VALUES ('Rival GmbH (Testdaten)', 'energy', 'important', NOW(), true)
     RETURNING id`,
  );
  const rivalCompanyId = company.id;
  const [asset] = await e2eQuery<{ id: string }>(
    `INSERT INTO asset (company_id, name, type)
     VALUES ($1, $2, 'server')
     RETURNING id`,
    [rivalCompanyId, RIVAL_ASSET_NAME],
  );
  const rivalAssetId = asset.id;

  // The acting session is the Dev GmbH admin (chromium storageState). Confirm
  // Rival's company id differs from the attacker's, so this is truly cross-tenant.
  const [attacker] = await e2eQuery<{ company_id: string }>(
    `SELECT company_id FROM "user" WHERE email = 'dev@nis2.local'`,
  );
  expect(attacker.company_id).not.toBe(rivalCompanyId);

  // Attack 1 — read: asset.list returns only the caller's own assets.
  const listRes = await trpcQuery(request, "asset.list", null);
  expect(listRes.status(), "asset.list endpoint reachable").toBe(200);
  const listBody = await listRes.text();
  // Non-vacuity: the call actually ran AS Dev GmbH (its own seeded asset is
  // present), so the absence of Rival's asset is real isolation, not a
  // 404/unauthenticated no-op.
  expect(listBody, "attacker's own assets returned (call was authenticated)").toContain(
    "Customer Database",
  );
  expect(listBody).not.toContain(rivalAssetId);
  expect(listBody).not.toContain(RIVAL_ASSET_NAME);

  // Attack 2 — update someone else's asset by id. tRPC answers (not 404),
  // proving the mutation ran; its effect on Rival is checked in the DB below.
  const updRes = await trpcMutation(request, "asset.update", {
    id: rivalAssetId,
    name: "PWNED BY DEV GMBH",
  });
  expect(updRes.status(), "asset.update endpoint reachable").not.toBe(404);

  // Attack 3 — delete someone else's asset by id.
  const delRes = await trpcMutation(request, "asset.delete", { id: rivalAssetId });
  expect(delRes.status(), "asset.delete endpoint reachable").not.toBe(404);

  // Ground truth: Rival's asset still exists with its original name.
  const rows = await e2eQuery<{ name: string }>(
    `SELECT name FROM asset WHERE id = $1`,
    [rivalAssetId],
  );
  expect(rows.length, "Rival asset was deleted across tenants").toBe(1);
  expect(rows[0].name, "Rival asset was renamed across tenants").toBe(RIVAL_ASSET_NAME);
});
