/**
 * getByToken is reachable with a 64-hex token and no account. These assert the
 * two joined selects stay projected: a `select({ incident })` spread would put
 * the supplier's post-mortem — root cause, countermeasures, financial damage —
 * in front of every token holder, and a `select({ asset })` spread would hand
 * out their internal hostnames and unpatched-host dates.
 *
 * Reading the source is the point. The alternative is an integration test that
 * only fails once someone has already shipped the leak.
 */
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync(new URL("./public.ts", import.meta.url), "utf8");

const NEVER_EXPOSED = [
  "rootCause", "countermeasures", "estimatedFinancialDamage",
  "affectedUsersCount", "affectedSystemsCount", "gdprNotifiedAt", "internalRef",
  "ipAddress", "hostname", "operatingSystem", "softwareVersion",
  "lastPatchDate", "lastVulnScanDate", "privilegedAccountCount",
];

describe("supplier-portal getByToken projection", () => {
  test("neither joined select spreads a whole table", () => {
    expect(SRC).not.toContain("select({ incident: incident");
    expect(SRC).not.toContain("select({ asset: asset");
  });

  test("no sensitive column is named in the file at all", () => {
    const named = NEVER_EXPOSED.filter((c) => SRC.includes(`incident.${c}`) || SRC.includes(`asset.${c}`));
    expect(named).toEqual([]);
  });

  test("the customer-facing columns are still selected", () => {
    for (const c of ["incident.title", "incident.severity", "asset.name", "asset.hasMfa"]) {
      expect(SRC).toContain(c);
    }
  });
});
