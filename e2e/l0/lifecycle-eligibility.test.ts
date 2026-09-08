/**
 * L0: the lifecycle eligibility SQL compiles to what the design claims.
 *
 * Same lesson as nis2-scope.test.ts one file over: cron-only queries are
 * executed by no browser flow and no suite, so a predicate that "reads
 * correctly in source" can ship broken and stay broken behind a green
 * pipeline. buildCandidateQuery is exported un-awaited precisely so this
 * file can hold its compiled SQL still.
 *
 * Also pins the migration snapshot for uq_notification_lifecycle_once:
 * the 'lifecycle_email' literal lives in three places that cannot import
 * each other (the TS constant, the schema index predicate, the migration
 * SQL). If they ever drift apart, claims stop matching the partial index
 * and the at-most-once guarantee silently vanishes — this is the tripwire.
 */

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  ACTIVATION_NUDGE_KEY,
  buildCandidateQuery,
} from "@/lib/lifecycle/emails/activation-nudge";
import { LIFECYCLE_ENTITY_TYPE } from "@/lib/lifecycle/types";
import * as schema from "@/schema";

const db = drizzle.mock({ schema });
const cutoff = new Date("2026-09-01T08:00:00.000Z");
const compiled = buildCandidateQuery(db, cutoff).toSQL();

describe("activation-nudge candidate query", () => {
  test("dormancy falls back lastLoginAt -> emailVerifiedAt -> createdAt, in that order", () => {
    expect(compiled.sql).toContain(
      'COALESCE("user"."last_login_at", "user"."email_verified_at", "user"."created_at")',
    );
  });

  test("the cutoff is bound as a UTC ISO string, not a Date", () => {
    // A raw-sql Date parameter serializes as LOCAL wall time (no column
    // encoder), skewing eligibility on TZ-set self-hosts. The ISO string
    // pins UTC.
    expect(compiled.params).toContain(cutoff.toISOString());
  });

  test("the never-claimed filter correlates on the outer user row", () => {
    expect(compiled.sql.toLowerCase()).toContain("not exists");
    expect(compiled.sql).toContain('"notification"."recipient_id" = "user"."id"');
    expect(compiled.params).toContain(LIFECYCLE_ENTITY_TYPE);
    expect(compiled.params).toContain(ACTIVATION_NUDGE_KEY);
  });

  test("ordered oldest-dormant first so the per-run cap defers FIFO", () => {
    const orderBy = compiled.sql.toLowerCase().split("order by")[1];
    expect(orderBy).toBeDefined();
    expect(orderBy).toContain("coalesce");
    expect(orderBy).toContain("asc");
  });
});

describe("uq_notification_lifecycle_once stays aligned with the code", () => {
  const snapshot = JSON.parse(
    readFileSync(
      join(import.meta.dir, "../../packages/isms-schema/drizzle/meta/0010_snapshot.json"),
      "utf8",
    ),
  ) as {
    tables: Record<
      string,
      {
        indexes?: Record<
          string,
          {
            isUnique: boolean;
            where?: string;
            columns: Array<{ expression: string }>;
          }
        >;
      }
    >;
  };

  const index =
    snapshot.tables["public.notification"]?.indexes?.uq_notification_lifecycle_once;

  test("the partial unique index exists on (recipient_id, trigger_field)", () => {
    expect(index).toBeDefined();
    expect(index?.isUnique).toBe(true);
    expect(index?.columns.map((c) => c.expression)).toEqual([
      "recipient_id",
      "trigger_field",
    ]);
  });

  test("its predicate matches LIFECYCLE_ENTITY_TYPE exactly", () => {
    expect(index?.where).toBe(
      `"notification"."entity_type" = '${LIFECYCLE_ENTITY_TYPE}'`,
    );
  });
});
