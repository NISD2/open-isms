/**
 * L3 supplier portal — the token-gated customer view.
 *
 * `supplierPortal.public.getByToken` and `.revoke` are the only two
 * publicProcedures in the app: the one place tenant data leaves the platform
 * with no authenticated context. A 64-hex token in a URL is the entire gate,
 * and the person holding it is an invited customer who has no account here.
 *
 * Four properties matter, and none of them were covered before:
 *
 *  1. The token reads exactly one relationship. Customer A's link must never
 *     surface the assets or incidents the same supplier serves customer B.
 *  2. The payload is a declaration about a service, not a copy of the
 *     supplier's internals. Both queries in public.ts list their columns
 *     rather than spreading the row, because the asset row carries the
 *     supplier's own hostnames and patch dates and the incident row carries
 *     its post-mortem. A future `...asset` would re-open that silently, so
 *     the sentinel values below are planted specifically to catch it.
 *  3. Revoking is real, immediate and audited.
 *  4. What the server scoped actually reaches the customer. #137 wired up
 *     the two sections that had been computed and dropped; before it, a DOM
 *     assertion about them could not fail, which is why the isolation check
 *     below lives on the wire first and on the page second.
 *
 * The fixture is provisioned in SQL, the way l3/cross-tenant.spec.ts
 * provisions Rival GmbH: it needs a second tenant that the shared e2e company
 * must not become. Every assertion afterwards goes through the real HTTP
 * surface, unauthenticated.
 */
import { test, expect, type APIRequestContext } from "@playwright/test";
import { e2eQuery } from "../lib/db";

const TOKEN_A = "a1".repeat(32);
const TOKEN_B = "b2".repeat(32);
const TOKEN_C = "c3".repeat(32);
const TOKEN_UNKNOWN = "f0".repeat(32);

const SUPPLIER_NAME = "Systemhaus Musterland (Testdaten)";
const ASSET_A = "Leitsystem-Hosting Alpha";
const ASSET_B = "Klinikarchiv Beta";
const SERVICE_DESCRIPTION_A = "Betrieb der Netzleitstelle rund um die Uhr";
const ORG_A = "Stadtwerke Alpha";
const ORG_B = "Klinikum Beta";
const INCIDENT_TITLE = "Ransomware im Hosting-Cluster";

/**
 * Values that must never cross the wire. Each stands for one column the
 * whitelists in public.ts deliberately omit.
 */
const SECRETS = {
  cisoName: "GEHEIM CISO Musterland",
  stripe: "cus_GEHEIMSTRIPE123",
  ip: "10.99.99.99",
  hostname: "supplier-jumphost-intern",
  os: "Debian 12 (interne Buildchain)",
  rootCause: "GEHEIM ungepatchter Jump-Host",
  countermeasures: "GEHEIM Netztrennung und Neuaufbau",
  damage: "987654",
} as const;

const ids = { company: "", relA: "", relB: "", relC: "" };

async function getByToken(request: APIRequestContext, token: string) {
  const input = encodeURIComponent(JSON.stringify({ "0": { json: { token } } }));
  return request.get(`/api/trpc/supplierPortal.public.getByToken?batch=1&input=${input}`, {
    failOnStatusCode: false,
  });
}

test.describe("supplier portal: token-gated customer access", () => {
  // The whole point is that a customer needs no account here.
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeAll(async () => {
    const [c] = await e2eQuery<{ id: string }>(
      `INSERT INTO company (name, legal_name, sector, entity_type, acts_as_supplier,
                            activated_at, ciso_name, stripe_customer_id, country)
       VALUES ($1, $1, 'ict', 'important', true, NOW(), $2, $3, 'DE')
       RETURNING id`,
      [SUPPLIER_NAME, SECRETS.cisoName, SECRETS.stripe],
    );
    ids.company = c.id;

    const rel = async (email: string, org: string, token: string) =>
      (
        await e2eQuery<{ id: string }>(
          `INSERT INTO supplier (supplier_company_id, name, customer_email, customer_org_name,
                                 status, unsubscribe_token, confirmed_at)
           VALUES ($1, $2, $3, $4, 'active', $5, NOW()) RETURNING id`,
          [ids.company, SUPPLIER_NAME, email, org, token],
        )
      )[0].id;
    ids.relA = await rel("alpha@kunde.local", ORG_A, TOKEN_A);
    ids.relB = await rel("beta@kunde.local", ORG_B, TOKEN_B);
    ids.relC = await rel("gamma@kunde.local", "Praxis Gamma", TOKEN_C);

    // One asset per customer. Customer A's carries the sentinel internals.
    const mkAsset = async (name: string, secret: boolean) =>
      (
        await e2eQuery<{ id: string }>(
          `INSERT INTO asset (company_id, name, type, quantity, ip_address, hostname, operating_system)
           VALUES ($1, $2, 'server', 1, $3, $4, $5) RETURNING id`,
          [
            ids.company,
            name,
            secret ? SECRETS.ip : null,
            secret ? SECRETS.hostname : null,
            secret ? SECRETS.os : null,
          ],
        )
      )[0].id;
    const assetA = await mkAsset(ASSET_A, true);
    const assetB = await mkAsset(ASSET_B, false);
    await e2eQuery(
      `INSERT INTO asset_supplier_offering (asset_id, customer_relationship_id, service_type, service_description)
       VALUES ($1, $2, 'managed', $5), ($3, $4, 'saas', 'Archivhosting')`,
      [assetA, ids.relA, assetB, ids.relB, SERVICE_DESCRIPTION_A],
    );

    // One incident, broadcast to A only, carrying the sentinel post-mortem.
    const [inc] = await e2eQuery<{ id: string }>(
      `INSERT INTO incident (company_id, severity, title, description, discovered_at,
                             root_cause, countermeasures, estimated_financial_damage)
       VALUES ($1, 'significant', $2, 'Verschluesselung mehrerer Hosts', NOW(), $3, $4, $5)
       RETURNING id`,
      [ids.company, INCIDENT_TITLE, SECRETS.rootCause, SECRETS.countermeasures, SECRETS.damage],
    );
    await e2eQuery(
      `INSERT INTO incident_broadcast (incident_id, customer_relationship_id, status)
       VALUES ($1, $2, 'sent')`,
      [inc.id, ids.relA],
    );

    await e2eQuery(
      `INSERT INTO company_certification (company_id, type, scope, auditor, valid_until, storage_key, status)
       VALUES ($1, 'iso27001', 'Rechenzentrum Nord', 'TUEV Musterland', NOW() + interval '1 year',
               'certs/e2e-supplier-portal.pdf', 'active')`,
      [ids.company],
    );
  });

  test.afterAll(async () => {
    // FK-safe order. The shared tenant is untouched either way.
    await e2eQuery(
      `DELETE FROM incident_broadcast WHERE customer_relationship_id IN ($1, $2, $3)`,
      [ids.relA, ids.relB, ids.relC],
    );
    await e2eQuery(
      `DELETE FROM asset_supplier_offering WHERE customer_relationship_id IN ($1, $2, $3)`,
      [ids.relA, ids.relB, ids.relC],
    );
    await e2eQuery(`DELETE FROM incident WHERE company_id = $1`, [ids.company]);
    await e2eQuery(`DELETE FROM asset WHERE company_id = $1`, [ids.company]);
    await e2eQuery(`DELETE FROM company_certification WHERE company_id = $1`, [ids.company]);
    await e2eQuery(`DELETE FROM audit_log WHERE company_id = $1`, [ids.company]);
    await e2eQuery(`DELETE FROM supplier WHERE supplier_company_id = $1`, [ids.company]);
    await e2eQuery(`DELETE FROM company WHERE id = $1`, [ids.company]);
  });

  test("a valid token opens the supplier's profile with no account", async ({ page }) => {
    await page.goto(`/de/supplier-access/${TOKEN_A}`);
    await expect(page.getByText(SUPPLIER_NAME, { exact: false }).first()).toBeVisible({
      timeout: 20_000,
    });
    // The banner proves the token resolved to THIS relationship and not just
    // to some supplier: it greets the customer by the invited address.
    await expect(page.getByText("alpha@kunde.local", { exact: false }).first()).toBeVisible();
    // By testid, not by label: the chrome is translated into ten locales and
    // an accessible-name regex would quietly stop matching on the next one.
    await expect(page.getByTestId("revoke-access")).toBeVisible();
    // Nothing bounced us to a login: the token is the auth.
    expect(page.url()).not.toContain("/auth/signin");

    // The two per-customer halves. getByToken always returned them; until the
    // customer view was wired up, `managedAssets` was destructured and dropped
    // and `recentEvents` had no renderer anywhere, so the page showed only the
    // company-wide questionnaire while the portal's marketing page promised
    // "die Systeme, die Sie für ihn betreuen" and a per-customer incident feed.
    await expect(page.getByTestId("shared-services")).toBeVisible();
    await expect(page.getByText(ASSET_A, { exact: false }).first()).toBeVisible();
    // A declaration from the offering row, not just the asset's name: proves
    // the per-customer service profile is what reached the page.
    await expect(page.getByText(SERVICE_DESCRIPTION_A, { exact: false })).toBeVisible();

    await expect(page.getByTestId("shared-incidents")).toBeVisible();
    await expect(page.getByText(INCIDENT_TITLE, { exact: false }).first()).toBeVisible();

    // next-intl renders the key path when a message is missing, so a locale
    // that never got these strings would show "supplierPortal.customerView..."
    // to a customer rather than failing. Ten locales carry them; this is the
    // guard that says so.
    expect(await page.locator("body").innerText()).not.toContain(
      "supplierPortal.customerView",
    );
  });

  test("one customer's token cannot see another customer's service or incidents", async ({
    page,
    request,
  }) => {
    const res = await getByToken(request, TOKEN_A);
    expect(res.status(), "public getByToken reachable").toBe(200);
    const body = await res.text();

    // Non-vacuity: A's own data really is in this payload, so the absences
    // below are isolation rather than an empty/failed response.
    expect(body, "A's own service is present").toContain(ASSET_A);
    expect(body, "A's own org name is present").toContain(ORG_A);

    expect(body, "B's service leaked to A").not.toContain(ASSET_B);
    expect(body, "B's org name leaked to A").not.toContain(ORG_B);
    expect(body, "B's relationship id leaked to A").not.toContain(ids.relB);

    // And now that the services actually render, the DOM check is worth
    // something: it can only pass because A's list is present and B's entry
    // is not in it.
    await page.goto(`/de/supplier-access/${TOKEN_A}`);
    await expect(page.getByTestId("shared-services")).toBeVisible();
    await expect(page.getByText(ASSET_A, { exact: false }).first()).toBeVisible();
    await expect(page.getByText(ASSET_B, { exact: false })).toHaveCount(0);
  });

  test("the payload declares the service without shipping the supplier's internals", async ({
    request,
  }) => {
    const body = await (await getByToken(request, TOKEN_A)).text();

    // Present: what the portal exists to communicate.
    expect(body, "supplier identity").toContain(SUPPLIER_NAME);
    expect(body, "the broadcast incident").toContain(INCIDENT_TITLE);
    expect(body, "the certification").toContain("TUEV Musterland");

    // Absent: every column the whitelists in public.ts leave out. A customer
    // holding this token is not entitled to the supplier's host inventory,
    // its breach file, or its billing identity.
    for (const [field, value] of Object.entries(SECRETS)) {
      expect(body, `${field} must not reach a token holder`).not.toContain(value);
    }
  });

  test("an unknown token is a 404, not a hint", async ({ page, request }) => {
    const res = await getByToken(request, TOKEN_UNKNOWN);
    expect(res.status(), "unknown token still answers 200 with null").toBe(200);
    expect(await res.text()).not.toContain(SUPPLIER_NAME);

    const nav = await page.goto(`/de/supplier-access/${TOKEN_UNKNOWN}`);
    expect(nav?.status(), "unknown token renders notFound()").toBe(404);
    await expect(page.getByText(SUPPLIER_NAME, { exact: false })).toHaveCount(0);
  });

  test("revoking is immediate, idempotent and audited", async ({ page, request }) => {
    const revoke = () =>
      request.post("/api/trpc/supplierPortal.public.revoke?batch=1", {
        data: { "0": { json: { token: TOKEN_C } } },
        headers: { "content-type": "application/json" },
        failOnStatusCode: false,
      });

    // Access works before.
    expect(await (await getByToken(request, TOKEN_C)).text()).toContain(SUPPLIER_NAME);

    const first = await revoke();
    expect(first.status(), "revoke reachable").toBe(200);

    const [row] = await e2eQuery<{ status: string; unsubscribed_at: string | null }>(
      `SELECT status, unsubscribed_at FROM supplier WHERE id = $1`,
      [ids.relC],
    );
    expect(row.status, "relationship status after revoke").toBe("revoked");
    expect(row.unsubscribed_at, "unsubscribed_at stamped").not.toBeNull();

    // The token is dead for reads, over the API and in the browser.
    expect(await (await getByToken(request, TOKEN_C)).text()).not.toContain(SUPPLIER_NAME);
    await page.goto(`/de/supplier-access/${TOKEN_C}`);
    await expect(page.getByText(SUPPLIER_NAME, { exact: false })).toHaveCount(0);

    // Idempotent: the docstring promises re-running is a no-op, not an error.
    expect((await revoke()).status(), "second revoke").toBe(200);

    // publicProcedure carries no auto-audit middleware, so revoke logs by
    // hand. If that call is ever dropped, the only record of an unauthenticated
    // state change disappears with it.
    await expect
      .poll(
        async () =>
          (
            await e2eQuery<{ n: string }>(
              `SELECT count(*)::text AS n FROM audit_log
                WHERE company_id = $1 AND action = 'supplierPortal.public.revoke'`,
              [ids.company],
            )
          )[0].n,
        { message: "revoke audit row", timeout: 15_000 },
      )
      .toBe("1");
  });
});
