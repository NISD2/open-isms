import { describe, expect, test } from "bun:test";
import { redactPiiInJson } from "@/lib/gdpr/redact-pii";
import { itemStatusEnum } from "@/schema";
import {
  type DurchgangEvent,
  type ItemState,
  itemState,
  resumeAt,
  type StatusRow,
  WAIT_REASONS,
} from "./index";

type Status = StatusRow["status"];

const before = new Date("2026-09-29T10:00:00Z");
const at = new Date("2026-09-30T10:00:00Z");
const after = new Date("2026-10-01T10:00:00Z");
const event = (
  action: string,
  newValue: unknown = null,
  createdAt: Date = at,
): DurchgangEvent => ({ action, newValue, createdAt });
const row = (
  status: Status,
  signedOffAt: Date | null = null,
  reviewedAt: Date | null = null,
): StatusRow => ({ status, signedOffAt, reviewedAt });

const EVENTS = {
  none: null,
  waiting: event("durchgang.waiting", { reason: "letter" }),
  resumed: event("durchgang.resumed"),
  itemDone: event("durchgang.item_done"),
  withdrawn: event("requirement.sign_off_withdrawn"),
  foreign: event("assessment.sign_off"),
} as const;

/** What each status means before any event is read. A new status fails to compile here. */
const BY_STATUS: Readonly<Record<Status, ItemState["kind"] | "by_event">> = {
  not_started: "by_event",
  in_progress: "by_event",
  needs_review: "by_event",
  // With no review date to compare against, no event provably follows the rejection.
  rejected: "open",
  completed: "signed",
  approved: "signed",
  not_applicable: "not_applicable",
};

const BY_EVENT: Readonly<Record<keyof typeof EVENTS, ItemState["kind"]>> = {
  none: "open",
  waiting: "waiting",
  resumed: "open",
  itemDone: "filled",
  withdrawn: "open",
  foreign: "open",
};

describe("item state", () => {
  test("follows the status first and the latest Durchgang event second, for every pair", () => {
    for (const status of itemStatusEnum.enumValues) {
      for (const [name, latest] of Object.entries(EVENTS)) {
        const expected = BY_STATUS[status];
        expect({ status, name, kind: itemState(row(status), latest).kind }).toEqual({
          status,
          name,
          kind:
            expected === "by_event" ? BY_EVENT[name as keyof typeof EVENTS] : expected,
        });
      }
    }
  });

  test("a signature on the row wins over any event, whatever the status says", () => {
    expect(itemState(row("in_progress", at), EVENTS.itemDone)).toEqual({
      kind: "signed",
    });
    expect(itemState(row("needs_review", at), EVENTS.waiting)).toEqual({
      kind: "signed",
    });
  });

  test("a rejected item is open again, although review.reject keeps the old signature", () => {
    // review.reject turns a completed row into a rejected one and clears nothing.
    const rejected = row("rejected", before, at);
    expect(itemState(rejected, null)).toEqual({ kind: "open" });
    expect(itemState(rejected, event("durchgang.item_done", null, before))).toEqual({
      kind: "open",
    });
    expect(itemState(rejected, event("durchgang.item_done", null, after))).toEqual({
      kind: "filled",
      since: after,
    });
    expect(
      itemState(rejected, event("durchgang.waiting", { reason: "ask" }, after)),
    ).toEqual({ kind: "waiting", reason: "ask", since: after });
  });

  test("a withdrawn sign-off undoes an earlier 'filled in'", () => {
    // withdrawSignOff leaves the row in progress with no signature and logs the withdrawal,
    // which is then the latest event for the requirement.
    const reopened = row("in_progress");
    expect(itemState(reopened, event("durchgang.item_done", null, before)).kind).toBe(
      "filled",
    );
    expect(
      itemState(reopened, event("requirement.sign_off_withdrawn", null, at)),
    ).toEqual({
      kind: "open",
    });
  });

  test("waiting carries its reason and since when", () => {
    expect(itemState(row("in_progress"), EVENTS.waiting)).toEqual({
      kind: "waiting",
      reason: "letter",
      since: at,
    });
    expect(itemState(row("not_started"), EVENTS.itemDone)).toEqual({
      kind: "filled",
      since: at,
    });
  });

  test("an unreadable reason keeps the item waiting and drops only the reason", () => {
    for (const newValue of [{ reason: "holiday" }, {}, null, "[redacted]"]) {
      expect(itemState(row("in_progress"), event("durchgang.waiting", newValue))).toEqual(
        {
          kind: "waiting",
          reason: null,
          since: at,
        },
      );
    }
  });

  test("the reason survives GDPR erasure of the person who set it", () => {
    for (const reason of WAIT_REASONS) {
      const erased = redactPiiInJson({ reason }, [
        "erika.mustermann@example.com",
        "Erika Mustermann",
      ]);
      expect(itemState(row("in_progress"), event("durchgang.waiting", erased))).toEqual({
        kind: "waiting",
        reason,
        since: at,
      });
    }
  });
});

describe("resume", () => {
  const state = (kind: "open" | "waiting" | "filled" | "signed"): ItemState =>
    kind === "waiting"
      ? { kind, reason: "ask", since: at }
      : kind === "filled"
        ? { kind, since: at }
        : { kind };

  test("goes to the first open item, past items that wait", () => {
    const items = [state("filled"), state("waiting"), state("open"), state("open")];
    expect(resumeAt(items, (s) => s)).toBe(items[2] ?? null);
  });

  test("goes back to the first waiting item once nothing else is open", () => {
    const items = [state("signed"), state("waiting"), state("filled"), state("waiting")];
    expect(resumeAt(items, (s) => s)).toBe(items[1] ?? null);
  });

  test("goes nowhere when everything is filled in or signed", () => {
    expect(resumeAt([state("filled"), state("signed")], (s) => s)).toBeNull();
  });
});
