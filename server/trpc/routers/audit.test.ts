/**
 * Rows the platform operator's procedures wrote before they moved to the
 * platform audit scope still sit under the operator's own open company, with
 * inputs naming other customers. The log is append-only, so both tenant reads
 * must leave them out by the router keys those rows carry as entity_type.
 *
 * There is no database here: the fake returns no rows and keeps the condition
 * each read passed, which the Postgres dialect renders for the assertions.
 */
import { describe, expect, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { TRPCContext } from "../init";
import { createCallerFactory } from "../init";
import { auditRouter } from "./audit";

const COMPANY = "33333333-3333-4333-8333-333333333333";
const REVIEWER = "44444444-4444-4444-8444-444444444444";
const ENTITY = "55555555-5555-4555-8555-555555555555";

function harness() {
  const wheres: SQL[] = [];
  const db = {
    query: {
      auditLog: {
        findMany: async ({ where }: { where: SQL }) => {
          wheres.push(where);
          return [];
        },
      },
    },
  };
  const caller = createCallerFactory(auditRouter)({
    db: db as unknown as TRPCContext["db"],
    session: {
      user: { id: REVIEWER },
      role: "reviewer",
      companyId: COMPANY,
      accessLevel: "full",
    } as TRPCContext["session"],
    userId: REVIEWER,
    companyId: COMPANY,
    ip: "test",
    userAgent: null,
  });
  return { wheres, caller };
}

const rendered = (where: SQL | undefined) => {
  if (!where) throw new Error("the read passed no condition");
  return new PgDialect().sqlToQuery(where);
};

const expectTenantRowsOnly = (where: SQL | undefined) => {
  const { sql, params } = rendered(where);
  expect(params).toContain(COMPANY);
  expect(sql).toContain('"entity_type" not in');
  expect(params).toEqual(expect.arrayContaining(["platformAdmin", "newsletter"]));
};

describe("audit reads leave out rows the platform operator's procedures filed", () => {
  test("list", async () => {
    const { wheres, caller } = harness();

    await caller.list({});

    expect(wheres).toHaveLength(1);
    expectTenantRowsOnly(wheres[0]);
  });

  test("list, even when asked for that entity type", async () => {
    const { wheres, caller } = harness();

    await caller.list({ entityType: "platformAdmin" });

    expectTenantRowsOnly(wheres[0]);
  });

  test("getByEntity", async () => {
    const { wheres, caller } = harness();

    await caller.getByEntity({ entityType: "platformAdmin", entityId: ENTITY });

    expect(wheres).toHaveLength(1);
    expectTenantRowsOnly(wheres[0]);
  });
});
