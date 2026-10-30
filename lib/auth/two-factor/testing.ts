/**
 * For tests only: a stand-in for the database that holds what two-factor sign-in reads and
 * writes (people, their user_two_factor row, whether a company of theirs requires it), and answers
 * the statements lib/auth/two-factor issues the way Postgres would. Conditions are read from the
 * rendered SQL, as server/trpc/routers/assistant-switches.test.ts does, so a guard that went
 * missing from a WHERE (the step that must be later, the recovery code that must be there) makes
 * the fake behave as Postgres would without it.
 */
import { getTableName, SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import type { DbOrTx } from "@/lib/db";
import type { TwoFactorRow } from "./store";

export type FakePerson = {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly companyId: string | null;
  readonly passwordHash: string | null;
  readonly emailVerifiedAt: Date | null;
  readonly locale?: string | null;
};

const dialect = new PgDialect();
const render = (condition: SQL) => dialect.sqlToQuery(condition);

const emptyRow = (userId: string): TwoFactorRow => ({
  userId,
  secretEncrypted: null,
  enabledAt: null,
  recoveryCodeHashes: [],
  lastUsedStep: 0,
  pendingSecretEncrypted: null,
  pendingRecoveryCodeHashes: null,
  pendingStartedAt: null,
  updatedAt: new Date(0),
});

const asTime = (value: unknown) => new Date(String(value)).getTime();

export function fakeTwoFactorDb(people: readonly FakePerson[]) {
  const state = {
    rows: new Map<string, TwoFactorRow>(),
    /** Whether some company of the person's requires two-factor sign-in. */
    companyRequires: false,
    companyUpdates: [] as Array<{ set: Record<string, unknown>; companyId: unknown }>,
  };

  /** Whether `row` meets the rendered WHERE: the user id first, then any guard after it. */
  const matches = (row: TwoFactorRow | undefined, where: SQL): row is TwoFactorRow => {
    const { sql, params } = render(where);
    if (!row || params[0] !== row.userId) return false;
    const guard = params[1];
    if (sql.includes('"pending_started_at" =')) {
      return (
        row.pendingStartedAt !== null && row.pendingStartedAt.getTime() === asTime(guard)
      );
    }
    if (sql.includes('"last_used_step" <')) return row.lastUsedStep < Number(guard);
    if (sql.includes("= any(")) return row.recoveryCodeHashes.includes(String(guard));
    if (sql.includes('"enabled_at" is not null')) return row.enabledAt !== null;
    return true;
  };

  const rowOf = (where: SQL) => state.rows.get(String(render(where).params[0]));

  const db = {
    query: {
      user: {
        findFirst: async ({ where }: { where: SQL }) =>
          people.find((p) => p.email === render(where).params[0]),
      },
      userTwoFactor: {
        findFirst: async ({ where }: { where: SQL }) => {
          const row = rowOf(where);
          return row ? { ...row } : undefined;
        },
      },
    },
    insert: (table: Parameters<typeof getTableName>[0]) => ({
      values: (
        values: Partial<TwoFactorRow> & { userId: string; companyId?: string },
      ) => ({
        onConflictDoUpdate: async ({ set }: { set: Partial<TwoFactorRow> }) => {
          if (getTableName(table) === "company_two_factor") {
            state.companyUpdates.push({ set, companyId: values.companyId });
            return;
          }
          const existing = state.rows.get(values.userId);
          state.rows.set(
            values.userId,
            existing
              ? { ...existing, ...set }
              : { ...emptyRow(values.userId), ...values },
          );
        },
      }),
    }),
    update: (table: Parameters<typeof getTableName>[0]) => ({
      set: (set: Record<string, unknown>) => ({
        where: (where: SQL) => {
          const row = rowOf(where);
          const hit = matches(row, where);
          if (hit) {
            const removed = render(where).params[1];
            const next = { ...row } as Record<string, unknown>;
            for (const [k, v] of Object.entries(set)) {
              next[k] =
                v instanceof SQL
                  ? row.recoveryCodeHashes.filter((h) => h !== removed)
                  : v;
            }
            state.rows.set(row.userId, next as TwoFactorRow);
          }
          const after = hit ? state.rows.get(row.userId) : undefined;
          const out = after ? [{ ...after, left: after.recoveryCodeHashes.length }] : [];
          return Object.assign(Promise.resolve(out), { returning: async () => out });
        },
      }),
    }),
    delete: () => ({
      where: (where: SQL) => ({
        returning: async () => {
          const row = rowOf(where);
          if (!row) return [];
          state.rows.delete(row.userId);
          return [{ enabledAt: row.enabledAt }];
        },
      }),
    }),
    select: () => ({
      from: (table: Parameters<typeof getTableName>[0]) => {
        const name = getTableName(table);
        const answer = (where: SQL) => {
          if (name === "user") {
            const person = people.find((p) => p.id === render(where).params[0]);
            return person ? [{ email: person.email, locale: person.locale ?? null }] : [];
          }
          if (name === "company_two_factor") {
            return state.companyRequires ? [{ required: true }] : [];
          }
          // company_membership joined with company_two_factor, for twoFactorRequirement.
          return state.companyRequires ? [{ companyId: "required-company" }] : [];
        };
        const whereStep = (where: SQL) => ({ limit: async () => answer(where) });
        return { where: whereStep, innerJoin: () => ({ where: whereStep }) };
      },
    }),
  };

  return { db: db as unknown as DbOrTx, state };
}
