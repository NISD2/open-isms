/**
 * AGB B9 as code: an unpaid invoice suspends the licence the day after its due date, a payment
 * reopens it for the rest of the licence year, and nothing else moves an account. Pinned here:
 * paid, unpaid within the term, overdue, Qonto unreadable, credited, the licence year over, and
 * that a suspended account lands where B10 keeps the exports reachable.
 */
import { describe, expect, test } from "bun:test";
import { mayOpenPortalPath, unpaidAccessLevel } from "./access";
import {
  type Candidate,
  type LatestInvoice,
  needsQonto,
  nonPaymentAction,
  sweepNonPayment,
} from "./non-payment";

// Ordered on 1 October: due on 31 October (B5), licence year to 30 September.
const INVOICE: LatestInvoice = {
  issueDate: "2026-10-01",
  periodEnd: "2027-09-30",
  credited: false,
};
const DUE = "2026-10-31";

const act = (over: Partial<Parameters<typeof nonPaymentAction>[0]>) =>
  nonPaymentAction({
    level: "full",
    invoice: INVOICE,
    status: "unpaid",
    dueDate: DUE,
    today: "2026-11-01",
    ...over,
  });

describe("what B9 asks for one account", () => {
  test("unpaid by the end of the due date: suspended the next day, not on it", () => {
    expect(act({ today: DUE })).toBe("none");
    expect(act({ today: "2026-11-01" })).toBe("suspend");
  });

  test("a paid invoice keeps the licence", () => {
    expect(act({ status: "paid" })).toBe("none");
  });

  test("Qonto unreadable, or no due date on the invoice: nobody is locked out", () => {
    expect(act({ status: null })).toBe("none");
    expect(act({ dueDate: null })).toBe("none");
  });

  test("a credited invoice is no debt: the cancel already moved the account", () => {
    expect(act({ invoice: { ...INVOICE, credited: true } })).toBe("none");
    expect(
      act({ level: "free", status: "paid", invoice: { ...INVOICE, credited: true } }),
    ).toBe("none");
  });

  test("the payment reopens a suspended account for the rest of the licence year", () => {
    expect(act({ level: "free", status: "paid" })).toBe("reopen");
    expect(act({ level: "grandfathered", status: "paid" })).toBe("reopen");
    expect(act({ level: "free", status: "paid", today: "2027-09-30" })).toBe("reopen");
    expect(act({ level: "free", status: "paid", today: "2027-10-01" })).toBe("none");
  });

  test("still unpaid, or canceled in Qonto: a suspended account stays as it is", () => {
    expect(act({ level: "free", status: "unpaid" })).toBe("none");
    expect(act({ level: "free", status: "canceled" })).toBe("none");
  });
});

describe("whom the sweep asks Qonto about", () => {
  test("a full account only after the earliest due date, and not once seen paid", () => {
    expect(needsQonto("full", INVOICE, DUE, false)).toBe(false);
    expect(needsQonto("full", INVOICE, "2026-11-01", false)).toBe(true);
    expect(needsQonto("full", INVOICE, "2026-11-01", true)).toBe(false);
  });

  test("an account below full only while its licence year runs; a credited invoice never", () => {
    expect(needsQonto("free", INVOICE, "2027-09-30", false)).toBe(true);
    expect(needsQonto("free", INVOICE, "2027-10-01", false)).toBe(false);
    expect(needsQonto("full", { ...INVOICE, credited: true }, "2026-12-01", false)).toBe(
      false,
    );
  });
});

describe("a suspended account (B10)", () => {
  test("falls back like a cancel: grandfathered for a grandfathered holder, else free", () => {
    expect(unpaidAccessLevel(true)).toBe("grandfathered");
    expect(unpaidAccessLevel(false)).toBe("free");
  });

  test("still reaches Billing, Settings, Organisation, Notifications and Export", () => {
    for (const path of [
      "/billing",
      "/settings",
      "/organization",
      "/notifications",
      "/export",
    ]) {
      expect(mayOpenPortalPath("free", path)).toBe(true);
    }
    expect(mayOpenPortalPath("free", "/durchgang/nis2/3.1")).toBe(false);
  });
});

describe("the sweep", () => {
  const candidate = (accountId: string, over: Partial<Candidate> = {}): Candidate => ({
    accountId,
    level: "full",
    invoice: { ...INVOICE, qontoInvoiceId: `q-${accountId}`, number: `R-${accountId}` },
    ...over,
  });

  const run = (
    candidates: readonly Candidate[],
    answers: Record<string, "paid" | "unpaid" | null>,
    seenPaid = new Set<string>(),
  ) => {
    const asked: string[] = [];
    const moved: string[] = [];
    return sweepNonPayment({
      candidates,
      today: "2026-11-01",
      seenPaid,
      read: async (id) => {
        asked.push(id);
        return { status: answers[id] ?? null, dueDate: DUE };
      },
      suspend: async (id) => {
        moved.push(`suspend ${id}`);
        return "free";
      },
      reopen: async (id) => {
        moved.push(`reopen ${id}`);
        return true;
      },
    }).then((result) => ({ result, asked, moved, seenPaid }));
  };

  test("suspends the overdue, reopens the paid, and leaves the rest", async () => {
    const { result, moved } = await run(
      [
        candidate("late"),
        candidate("paying"),
        candidate("back", { level: "free" }),
        candidate("down"),
      ],
      { "q-late": "unpaid", "q-paying": "paid", "q-back": "paid", "q-down": null },
    );
    expect(moved).toEqual(["suspend late", "reopen back"]);
    expect(result.applied.map((a) => [a.accountId, a.action, a.level])).toEqual([
      ["late", "suspend", "free"],
      ["back", "reopen", "full"],
    ]);
    expect(result.unreadable).toEqual(["R-down"]);
  });

  test("an invoice seen paid is not asked about again", async () => {
    const first = await run([candidate("paying")], { "q-paying": "paid" });
    const second = await run(
      [candidate("paying")],
      { "q-paying": "paid" },
      first.seenPaid,
    );
    expect(first.asked).toEqual(["q-paying"]);
    expect(second.asked).toEqual([]);
  });

  test("a change someone else already made is not reported", async () => {
    const { result } = await sweepNonPayment({
      candidates: [candidate("late")],
      today: "2026-11-01",
      seenPaid: new Set(),
      read: async () => ({ status: "unpaid", dueDate: DUE }),
      suspend: async () => null,
      reopen: async () => false,
    }).then((r) => ({ result: r }));
    expect(result.applied).toEqual([]);
  });
});
