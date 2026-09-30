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

const at = new Date("2026-09-30T10:00:00Z");
const event = (action: string, newValue: unknown = null): DurchgangEvent => ({
  action,
  newValue,
  createdAt: at,
});
const row = (status: Status, signedOffAt: Date | null = null): StatusRow => ({
  status,
  signedOffAt,
});

const EVENTS = {
  none: null,
  waiting: event("durchgang.waiting", { reason: "letter" }),
  resumed: event("durchgang.resumed"),
  itemDone: event("durchgang.item_done"),
  foreign: event("assessment.sign_off"),
} as const;

/** What each status means before any event is read. A new status fails to compile here. */
const BY_STATUS: Readonly<Record<Status, ItemState["kind"] | "by_event">> = {
  not_started: "by_event",
  in_progress: "by_event",
  needs_review: "by_event",
  rejected: "by_event",
  completed: "signed",
  approved: "signed",
  not_applicable: "not_applicable",
};

const BY_EVENT: Readonly<Record<keyof typeof EVENTS, ItemState["kind"]>> = {
  none: "open",
  waiting: "waiting",
  resumed: "open",
  itemDone: "filled",
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
