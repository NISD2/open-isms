/**
 * A database that answers from a small world, for the continuity router's tests
 * (durchgang-continuity.test.ts): reads filter by the ids the WHERE names, as Postgres would, so a
 * foreign id comes back missing; the type and critical clauses are read off the rendered SQL;
 * every WHERE and every write is kept for the tests to check. The tests mock the audit and
 * recheck modules first and then call `harness`, so the router is imported after the mocks.
 */
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { asset, companyRequirementStatus, processAsset } from "@/schema";

export const COMPANY = "44444444-4444-4444-8444-444444444444";
export const USER = "11111111-1111-4111-8111-111111111111";
export const STATUS = "66666666-6666-4666-8666-666666666666";
export const SALES = "99999999-9999-4999-8999-999999999981";
export const BOOKS = "99999999-9999-4999-8999-999999999982";
export const ERP = "99999999-9999-4999-8999-999999999983";
export const SERVER = "99999999-9999-4999-8999-999999999984";
export const FOREIGN = "99999999-9999-4999-8999-999999999985";

const dialect = new PgDialect();
export const queryOf = (where: SQL) => dialect.sqlToQuery(where);
export const paramsOf = (where: SQL) => queryOf(where).params;

export type Write = {
  op: "insert" | "update" | "delete";
  table: unknown;
  values: unknown;
  where?: SQL;
};

export interface Thing {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly isCritical?: boolean | null;
  readonly maxOutage?: string | null;
  readonly restoreTime?: string | null;
  readonly restoreTimeUnknown?: boolean;
}

export interface World {
  readonly assets: readonly Thing[];
  /** 4.2's links as stored: which system each process needs. */
  readonly needs?: ReadonlyArray<{ processId: string; assetId: string }>;
  readonly accessLevel?: "full" | "free";
}

type TRPCContext = import("../init").TRPCContext;

/** The router under test with its caller, imported only now, after the tests' mocks. */
export async function harness() {
  const { createCallerFactory } = await import("../init");
  const { durchgangRouter } = await import("./durchgang");

  const setup = (world: World) => {
    const writes: Write[] = [];
    const wheres: Array<{ table: string; where: SQL }> = [];

    const rowsOf = (table: unknown, where: SQL): readonly unknown[] => {
      const { sql, params } = queryOf(where);
      const ids = params.filter((p) => p !== COMPANY && p !== "process");
      if (table === asset) {
        // A WHERE that names no id reads the company's whole list.
        const named =
          ids.length > 0 ? world.assets.filter((a) => ids.includes(a.id)) : world.assets;
        return sql.includes('"type" = ')
          ? named.filter((a) => a.type === "process")
          : sql.includes('"type" <> ')
            ? named.filter((a) => a.type !== "process")
            : named;
      }
      if (table === processAsset)
        return (world.needs ?? []).filter((l) => ids.includes(l.processId));
      return [];
    };

    /**
     * The joins, 4.2's links read through their process end (`processLinksOf`), answered from
     * the clauses the WHERE renders as Postgres would: `"is_critical" = ` keeps the processes
     * marked, `"type" = ` the process rows. Dropping either clause from the query shows here.
     */
    const linksOf = (where: SQL): readonly unknown[] => {
      const { sql } = queryOf(where);
      const processes = new Set(
        world.assets
          .filter((a) => !sql.includes('"is_critical" = ') || a.isCritical === true)
          .filter((a) => !sql.includes('"type" = ') || a.type === "process")
          .map((a) => a.id),
      );
      return (world.needs ?? []).filter((l) => processes.has(l.processId));
    };
    interface Joined {
      readonly innerJoin: () => Joined;
      readonly where: (
        where: SQL,
      ) => Promise<readonly unknown[]> & { orderBy: () => Promise<readonly unknown[]> };
    }
    function joined(): Joined {
      return {
        innerJoin: joined,
        where: (where) => {
          wheres.push({ table: "processAsset", where });
          const rows = linksOf(where);
          return Object.assign(Promise.resolve(rows), { orderBy: async () => rows });
        },
      };
    }

    const select = () => ({
      from: (table: unknown) => ({
        where: (where: SQL) => {
          wheres.push({
            table:
              table === asset
                ? "asset"
                : table === processAsset
                  ? "processAsset"
                  : "other",
            where,
          });
          const rows = rowsOf(table, where);
          // As a subquery (`ownedProcesses`), the WHERE is what the statement embeds.
          return Object.assign(Promise.resolve(rows), {
            getSQL: () => where,
            for: async () => rows,
            orderBy: async () => rows,
            limit: async () => rows,
          });
        },
        innerJoin: joined,
      }),
    });

    const db = {
      query: {
        complianceFramework: { findFirst: async () => ({ id: "framework-1" }) },
        companyAssessment: {
          findFirst: async () => ({ id: "22222222-2222-4222-8222-222222222222" }),
        },
        requirement: {
          findFirst: async () => ({
            id: "55555555-5555-4555-8555-555555555555",
            categoryId: "77777777-7777-4777-8777-777777777777",
            priority: "P1",
          }),
          findMany: async () => [
            { id: "55555555-5555-4555-8555-555555555555", code: "12.2" },
          ],
        },
        categoryAssignment: { findFirst: async () => undefined },
        companyRequirementStatus: {
          findFirst: async () => ({ id: STATUS }),
          findMany: async () => [],
        },
        company: {
          findFirst: async () => ({
            activatedAt: new Date(),
            country: "DE",
            name: "Muster GmbH",
          }),
        },
        user: { findFirst: async () => ({ locale: "de" }) },
        companyRiskMethodology: { findFirst: async () => undefined },
        companyCategoryIntake: { findFirst: async () => undefined },
        companyPolicyConfig: { findFirst: async () => undefined },
        asset: { findMany: async () => [] },
      },
      select,
      update: (table: unknown) => ({
        set: (values: unknown) => ({
          where: (where: SQL) => {
            writes.push({ op: "update", table, values, where });
            return Object.assign(Promise.resolve(), { returning: async () => [] });
          },
        }),
      }),
      insert: (table: unknown) => ({
        values: (values: unknown) => {
          writes.push({ op: "insert", table, values });
          return Object.assign(Promise.resolve(), { onConflictDoUpdate: async () => {} });
        },
      }),
      delete: (table: unknown) => ({
        where: async (where: SQL) => {
          writes.push({ op: "delete", table, values: undefined, where });
        },
      }),
      transaction: async <T>(work: (tx: unknown) => Promise<T>) => work(db),
    };

    const caller = createCallerFactory(durchgangRouter)({
      db: db as unknown as TRPCContext["db"],
      session: {
        role: "admin",
        jobTitle: null,
        accessLevel: world.accessLevel ?? "full",
        user: { id: USER, email: "someone@example.com" },
      } as TRPCContext["session"],
      userId: USER,
      companyId: COMPANY,
      ip: "test",
      userAgent: null,
    } as TRPCContext);

    return { caller, writes, wheres };
  };

  return { setup };
}

/** The text of the trail line an update appended, read from its SQL parameters. */
export const noteOf = (writes: readonly Write[]): string => {
  const values = writes.find(
    (w) => w.op === "update" && w.table === companyRequirementStatus,
  )?.values;
  const notes =
    typeof values === "object" && values !== null && "internalNotes" in values
      ? values.internalNotes
      : undefined;
  return notes ? paramsOf(notes as SQL).join(" ") : "";
};

export const sales: Thing = {
  id: SALES,
  name: "Vertrieb",
  type: "process",
  isCritical: false,
};
export const books: Thing = {
  id: BOOKS,
  name: "Buchhaltung",
  type: "process",
  isCritical: true,
};
export const erp: Thing = {
  id: ERP,
  name: "ERP",
  type: "application",
  restoreTime: null,
  restoreTimeUnknown: false,
};
export const server: Thing = {
  id: SERVER,
  name: "Server",
  type: "server",
  restoreTime: "day",
  restoreTimeUnknown: false,
};
