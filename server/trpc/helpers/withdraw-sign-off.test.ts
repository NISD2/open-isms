/**
 * `withdrawSignOff` writes a requirement's status row and its signer rows.
 * Every path that does both takes the status row's lock first; taking the two
 * in opposite orders let a reopen and a save of one requirement deadlock.
 */
import { describe, expect, test } from "bun:test";
import type { DbOrTx } from "@/lib/db";
import { companyRequirementStatus, requirementAssignment } from "@/schema";
import { withdrawSignOff } from "./withdraw-sign-off";

/** Locks and writes, in the order they happen. Plain reads take no lock. */
type Step = { step: "lock" | "update" | "delete"; table: unknown; values?: unknown };

function recordingTx() {
  const steps: Step[] = [];
  const tx = {
    select: () => ({
      from: (table: unknown) => ({
        where: () =>
          Object.assign(Promise.resolve([]), {
            for: async () => {
              steps.push({ step: "lock", table });
              return [{ id: "status-1", status: "completed", signedOffAt: new Date() }];
            },
          }),
      }),
    }),
    delete: (table: unknown) => ({
      where: async () => {
        steps.push({ step: "delete", table });
      },
    }),
    update: (table: unknown) => ({
      set: (values: unknown) => ({
        where: () => {
          steps.push({ step: "update", table, values });
          return Object.assign(Promise.resolve(), {
            returning: async () => [{ id: "status-1", status: "in_progress" }],
          });
        },
      }),
    }),
  };
  return { tx: tx as unknown as DbOrTx, steps };
}

const withdraw = (tx: DbOrTx) =>
  withdrawSignOff(tx, {
    statusId: "status-1",
    companyId: "company-1",
    actorId: "user-1",
    nextReviewDate: null,
    now: new Date("2026-09-30"),
  });

describe("withdrawSignOff", () => {
  test("locks the requirement status row before touching any signer row", async () => {
    const { tx, steps } = recordingTx();
    await withdraw(tx);
    expect(steps[0]).toEqual({ step: "lock", table: companyRequirementStatus });
    expect(steps.findIndex((s) => s.table === requirementAssignment)).toBeGreaterThan(0);
  });

  test("clears every signer's signature and the row's own", async () => {
    const { tx, steps } = recordingTx();
    await withdraw(tx);
    expect(steps).toContainEqual({
      step: "update",
      table: requirementAssignment,
      values: { signedOffAt: null, signedOffRole: null },
    });
    expect(steps).toContainEqual(
      expect.objectContaining({
        step: "update",
        table: companyRequirementStatus,
        values: expect.objectContaining({ signedOffBy: null, signOffSnapshot: null }),
      }),
    );
  });
});
