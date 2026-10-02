import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName, is } from "drizzle-orm";
import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import * as schema from "@/schema";
import {
  isLocalDatabase,
  KEPT_ON_RESET,
  RESET_BY_COMPANY,
  RESET_OTHERWISE,
} from "./dev-reset";

/** Columns that tie a row to one company or to its assessment. */
const COMPANY_KEYS = new Set([
  "company_id",
  "customer_company_id",
  "supplier_company_id",
  "from_company_id",
  "accepted_by_company_id",
  "assessment_id",
]);

const tables = [...new Set(Object.values(schema).filter((v) => is(v, PgTable)))];

describe("the dev reset", () => {
  test("decides about every table that holds a company's rows", () => {
    // A table added later fails here instead of surviving the reset, or stopping it on a key.
    const decided = new Set<string>([
      ...RESET_BY_COMPANY.map((t) => getTableName(t)),
      ...RESET_OTHERWISE,
      ...Object.keys(KEPT_ON_RESET),
    ]);
    const companyScoped = tables.filter(
      (t) =>
        Object.values(getTableColumns(t)).some((c) => COMPANY_KEYS.has(c.name)) ||
        getTableConfig(t).foreignKeys.some(
          (fk) => getTableName(fk.reference().foreignTable) === "company",
        ),
    );
    expect(
      companyScoped.map((t) => getTableName(t)).filter((name) => !decided.has(name)),
    ).toEqual([]);
  });

  test("never both resets and keeps a table", () => {
    const reset = [...RESET_BY_COMPANY.map((t) => getTableName(t)), ...RESET_OTHERWISE];
    expect(reset.filter((name) => name in KEPT_ON_RESET)).toEqual([]);
  });

  test("runs only against a database on this machine, compared on the parsed host", () => {
    expect(isLocalDatabase("postgres://u:p@localhost:5432/db")).toBe(true);
    expect(isLocalDatabase("postgres://u:p@127.0.0.1:5434/db")).toBe(true);
    expect(isLocalDatabase("postgres://u:p@[::1]/db")).toBe(true);
    expect(isLocalDatabase("postgres://u:p@db.example.com/db")).toBe(false);
    expect(isLocalDatabase("postgres://u:p@localhost.example.com/db")).toBe(false);
    expect(isLocalDatabase("postgres://u:p@postgres:5432/db")).toBe(false);
    expect(isLocalDatabase("not a url")).toBe(false);
  });
});
