/**
 * Every part of the export reads one company's rows and only the fields the export names, in an
 * order that pages neither repeat nor skip. An assistant reads these parts a page at a time
 * (records.readPart), so a missing company filter or a whole row would reach it directly.
 *
 * There is no database here: the fake keeps what each read asked for, and the Postgres dialect
 * renders its condition for the assertions.
 */
import { describe, expect, test } from "bun:test";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { DbOrTx } from "@/lib/db";
import {
  EXPORT_FIELDS,
  EXPORT_PARTS,
  type ExportPart,
  type Window,
} from "./company-export";

const COMPANY = "33333333-3333-4333-8333-333333333333";

type Read = {
  readonly table: string;
  readonly config: {
    readonly where: SQL;
    readonly columns: Record<string, true>;
    readonly orderBy?: readonly SQL[];
    readonly limit?: number;
    readonly offset?: number;
  };
};

/** A database that answers every read with `rows` and keeps what each asked for. */
function fakeDb(rows: readonly unknown[] = []) {
  const reads: Read[] = [];
  const joins: SQL[] = [];
  const query = new Proxy(
    {},
    {
      get: (_target, table: string) => ({
        findMany: async (config: Read["config"]) => {
          reads.push({ table, config });
          return rows;
        },
        findFirst: async (config: Read["config"]) => {
          reads.push({ table, config });
          return rows[0];
        },
      }),
    },
  );
  const select = () => ({
    from: () => ({
      innerJoin: () => ({
        where: async (where: SQL) => {
          joins.push(where);
          return [];
        },
      }),
    }),
  });
  return { db: { query, select } as unknown as DbOrTx, reads, joins };
}

const rendered = (condition: SQL) => new PgDialect().sqlToQuery(condition);

/** Each register part: the table it reads, its field list, and the column that names the company. */
const REGISTERS = [
  ["suppliers", "supplier", "supplier", "customer_company_id"],
  ["risks", "risk", "risk", "company_id"],
  ["trainings", "trainingRecord", "training", "company_id"],
  ["managementReviews", "managementReview", "managementReview", "company_id"],
  ["incidents", "incident", "incident", "company_id"],
  ["vulnerabilities", "vulnerability", "vulnerability", "company_id"],
  ["patches", "patchRecord", "patch", "company_id"],
  ["changes", "changeRequest", "change", "company_id"],
  ["exercises", "exercise", "exercise", "company_id"],
  ["improvements", "improvementItem", "improvement", "company_id"],
  ["internalAudits", "internalAudit", "internalAudit", "company_id"],
  ["kpis", "kpiMeasurement", "kpi", "company_id"],
  ["processingActivities", "processingActivity", "processingActivity", "company_id"],
] as const satisfies ReadonlyArray<
  readonly [ExportPart, string, keyof typeof EXPORT_FIELDS, string]
>;

/** Column names that must never leave the database with a record. */
const NEVER = ["id", "companyId", "customerCompanyId", "unsubscribeToken"];

describe("each register reads only the company's rows and the export's fields", () => {
  for (const [part, table, record, companyColumn] of REGISTERS) {
    test(part, async () => {
      const { db, reads } = fakeDb();
      const window: Window = { offset: 100, limit: 51 };
      await EXPORT_PARTS[part](db, COMPANY, window);

      expect(reads).toHaveLength(1);
      const [read] = reads;
      if (!read) throw new Error("no read");
      expect(read.table).toBe(table);

      // Only this company: one condition, on its company column, with its id.
      const where = rendered(read.config.where);
      expect(where.sql).toBe(`"${companyColumnTable(table)}"."${companyColumn}" = $1`);
      expect(where.params).toEqual([COMPANY]);

      // Only the export's fields, the supplier's name besides; never an id or a token.
      const columns = Object.keys(read.config.columns).toSorted();
      const expected = [
        ...EXPORT_FIELDS[record],
        ...(record === "supplier" ? ["name"] : []),
      ].toSorted();
      expect(columns).toEqual(expected);
      for (const column of NEVER) expect(columns).not.toContain(column);

      // The page asked for, in an order that ends on the id, so pages neither repeat nor skip.
      expect(read.config.limit).toBe(51);
      expect(read.config.offset).toBe(100);
      const last = read.config.orderBy?.at(-1);
      if (!last) throw new Error("no order");
      expect(rendered(last).sql).toMatch(/"id" asc$/);
    });
  }

  test("the export files read every row: no limit, no offset", async () => {
    const { db, reads } = fakeDb();
    await EXPORT_PARTS.vulnerabilities(db, COMPANY, null);
    expect(reads[0]?.config.limit).toBeUndefined();
    expect(reads[0]?.config.offset).toBeUndefined();
  });
});

/** The SQL name of the table a relational query key reads. */
function companyColumnTable(table: string): string {
  const names: Record<string, string> = {
    supplier: "supplier",
    risk: "risk",
    trainingRecord: "training_record",
    managementReview: "management_review",
    incident: "incident",
    vulnerability: "vulnerability",
    patchRecord: "patch_record",
    changeRequest: "change_request",
    exercise: "exercise",
    improvementItem: "improvement_item",
    internalAudit: "internal_audit",
    kpiMeasurement: "kpi_measurement",
    processingActivity: "processing_activity",
  };
  const name = names[table];
  if (!name) throw new Error(`no SQL name for ${table}`);
  return name;
}

describe("the assets, with who provides them", () => {
  test("reads the company's assets, then only its own suppliers' links, and drops the id", async () => {
    const asset = { id: "asset-1", name: "Website", type: "application" };
    const { db, reads, joins } = fakeDb([asset]);
    const rows = await EXPORT_PARTS.assets(db, COMPANY, { offset: 0, limit: 51 });

    const where = rendered(reads[0]?.config.where ?? failed());
    expect(where.sql).toBe(`"asset"."company_id" = $1`);
    expect(where.params).toEqual([COMPANY]);
    expect(Object.keys(reads[0]?.config.columns ?? {})).toContain("id");

    // The providers' links: through suppliers of this company only, for these assets only.
    const providers = rendered(joins[0] ?? failed());
    expect(providers.sql).toContain(`"supplier"."customer_company_id" = $1`);
    expect(providers.params).toEqual([COMPANY, "asset-1"]);

    expect(rows).toEqual([{ name: "Website", type: "application", providers: [] }]);
  });

  test("no assets, no second read", async () => {
    const { db, joins } = fakeDb([]);
    expect(await EXPORT_PARTS.assets(db, COMPANY, null)).toEqual([]);
    expect(joins).toHaveLength(0);
  });
});

describe("the company's master data", () => {
  test("is this company's row, with the export's fields", async () => {
    const { db, reads } = fakeDb([{ name: "Beispielwerke GmbH" }]);
    await EXPORT_PARTS.company(db, COMPANY, null);
    const where = rendered(reads[0]?.config.where ?? failed());
    expect(where.sql).toBe(`"company"."id" = $1`);
    expect(where.params).toEqual([COMPANY]);
    expect(Object.keys(reads[0]?.config.columns ?? {}).toSorted()).toEqual(
      ["name", ...EXPORT_FIELDS.company].toSorted(),
    );
  });

  test("a company that does not exist is an error, never an empty export", async () => {
    const { db } = fakeDb([]);
    await expect(EXPORT_PARTS.company(db, COMPANY, null)).rejects.toThrow("No company");
  });
});

function failed(): never {
  throw new Error("the read was not made");
}
