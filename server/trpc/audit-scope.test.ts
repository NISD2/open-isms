/**
 * The company an automatic audit row is filed under decides who can read it:
 * audit.list returns the rows whose company_id is the caller's. The platform
 * operator also has an open company of their own, and while platform-admin
 * procedures sat on protectedProcedure every one of their mutations, with
 * inputs naming other customers, was filed under that company.
 *
 * The setup is built here with a recording logAudit rather than through
 * server/trpc/init.ts, because bun shares one module cache across test files:
 * whichever file loads init first fixes the logAudit it captured, so a module
 * mock of @/lib/audit would pass or fail depending on file order.
 */
import { describe, expect, test } from "bun:test";
import type { AuditEntry } from "@nisd2/isms-trpc/audit";
import { type BaseContext, createTRPCSetup } from "@nisd2/isms-trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const OPERATOR = "11111111-1111-4111-8111-111111111111";
const MEMBER = "22222222-2222-4222-8222-222222222222";
const OPERATOR_COMPANY = "33333333-3333-4333-8333-333333333333";

function harness() {
  const logged: AuditEntry[] = [];
  const t = createTRPCSetup<BaseContext>({
    logAudit: async (entry) => {
      logged.push(entry);
    },
    hasReviewAccess: () => true,
  });
  // Shaped like server/trpc/init.ts: the platform tier plus an allowlist gate.
  const platformAdmin = t.platformProcedure.use(({ ctx, next }) => {
    if (ctx.userId !== OPERATOR) throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
  });
  const appRouter = t.router({
    tenant: t.router({
      save: t.protectedProcedure.input(z.unknown()).mutation(() => "ok"),
    }),
    platformAdmin: t.router({
      closeDeal: platformAdmin.input(z.unknown()).mutation(() => "ok"),
      eraseUser: platformAdmin.input(z.unknown()).mutation(() => "ok"),
    }),
  });
  // Both callers sit in the operator's open company: a colleague is exactly
  // the person who could read a row filed there.
  const callerAs = (userId: string) =>
    t.createCallerFactory(appRouter)({
      session: { user: { id: userId }, role: "member", companyId: OPERATOR_COMPANY },
      userId,
      companyId: OPERATOR_COMPANY,
      ip: "unknown",
      userAgent: null,
    });
  return { logged, callerAs };
}

const CLOSE_DEAL_INPUT = {
  customerEmail: "kunde@example.test",
  customerName: "Erika Musterfrau",
  order: {
    companyName: "Beispiel Entsorgung GmbH",
    street: "Musterweg 1",
    zip: "12345",
    city: "Musterstadt",
    countryCode: "DE",
    vatNumber: "DE123456788",
    invoiceEmail: "buchhaltung@example.test",
    copyToEmail: "einkauf@example.test",
    purchaseOrder: "PO-4711",
  },
  netCents: 480_000,
  quotedGrossCents: 571_200,
  termsAcceptedOnCall: true,
};

describe("audit scope per procedure tier", () => {
  test("a tenant mutation is filed under the caller's company", async () => {
    const { logged, callerAs } = harness();

    await callerAs(MEMBER).tenant.save({ note: "x" });

    expect(logged).toHaveLength(1);
    expect(logged[0]?.companyId).toBe(OPERATOR_COMPANY);
  });

  test("a platform-admin mutation is not filed under the operator's open company", async () => {
    const { logged, callerAs } = harness();

    await callerAs(OPERATOR).platformAdmin.closeDeal(CLOSE_DEAL_INPUT);

    expect(logged).toHaveLength(1);
    expect(logged[0]?.action).toBe("platformAdmin.closeDeal");
    expect(logged[0]?.companyId).toBeNull();
  });

  test("a refused platform-admin call is not filed under the caller's company either", async () => {
    const { logged, callerAs } = harness();

    await expect(
      callerAs(MEMBER).platformAdmin.closeDeal(CLOSE_DEAL_INPUT),
    ).rejects.toThrow();

    expect(logged.map((e) => e.companyId)).toEqual([null]);
  });
});

describe("audit redaction", () => {
  test("billing identity fields keep their names and lose their values", async () => {
    const { logged, callerAs } = harness();

    await callerAs(MEMBER).tenant.save(CLOSE_DEAL_INPUT);

    expect(logged[0]?.newValue).toEqual({
      customerEmail: "[REDACTED]",
      customerName: "[REDACTED]",
      order: {
        companyName: "[REDACTED]",
        street: "[REDACTED]",
        zip: "[REDACTED]",
        city: "[REDACTED]",
        countryCode: "DE",
        vatNumber: "[REDACTED]",
        invoiceEmail: "[REDACTED]",
        copyToEmail: "[REDACTED]",
        purchaseOrder: "[REDACTED]",
      },
      netCents: 480_000,
      quotedGrossCents: 571_200,
      termsAcceptedOnCall: true,
    });
  });

  test("the erasure confirmations are redacted", async () => {
    const { logged, callerAs } = harness();

    await callerAs(OPERATOR).platformAdmin.eraseUser({
      userId: MEMBER,
      confirmEmail: "person@example.test",
      confirmOrgName: "Beispiel Entsorgung GmbH",
    });

    expect(logged[0]?.newValue).toEqual({
      userId: MEMBER,
      confirmEmail: "[REDACTED]",
      confirmOrgName: "[REDACTED]",
    });
  });
});
