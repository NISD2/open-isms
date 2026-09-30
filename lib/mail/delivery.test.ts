/**
 * sendMail reports success for mail it never sent (dev block, mail disabled,
 * no transport) and resolves rather than throws when a send fails. An erasure
 * certificate may only say its files were handed to an operator once the mail
 * actually went out, so "sent" has to mean sent.
 */
import { describe, expect, spyOn, test } from "bun:test";
import { deliverToOperators, type SendOutcome, wasDelivered } from "./delivery";

describe("wasDelivered", () => {
  test.each([
    ["a suppressed send", { success: true, id: "no-transport" }],
    ["mail switched off", { success: true, id: "disabled" }],
    ["the dev block", { success: true, id: "dev-blocked" }],
    ["an opted-out skip", { success: true, skipped: "opted-out" }],
    ["a failed send", { success: false }],
  ] as const)("does not count %s", (_, outcome) => {
    expect(wasDelivered(outcome)).toBe(false);
  });

  test("counts a send the transport accepted, with or without an id", () => {
    expect(wasDelivered({ success: true, id: "re_123" })).toBe(true);
    expect(wasDelivered({ success: true })).toBe(true);
  });
});

describe("deliverToOperators", () => {
  const quietly = async (run: () => Promise<boolean>) => {
    const errors = spyOn(console, "error").mockImplementation(() => {});
    try {
      return { delivered: await run(), logged: errors.mock.calls.flat().join(" ") };
    } finally {
      errors.mockRestore();
    }
  };
  const ADMINS = ["ops@example.test"];

  test("says so, without sending, when no admin address is configured", async () => {
    const sent: string[][] = [];
    const { delivered, logged } = await quietly(() =>
      deliverToOperators(
        [],
        async (to) => {
          sent.push(to);
          return { success: true, id: "re_1" };
        },
        "gdpr operator alert",
      ),
    );
    expect(delivered).toBe(false);
    expect(sent).toEqual([]);
    expect(logged).toContain("PLATFORM_ADMIN_EMAILS");
  });

  test.each([
    [
      "mail has no transport",
      async (): Promise<SendOutcome> => ({ success: true, id: "no-transport" }),
    ],
    ["the send fails", async (): Promise<SendOutcome> => ({ success: false })],
    [
      "the send throws",
      async (): Promise<SendOutcome> => {
        throw new Error("smtp down");
      },
    ],
  ] as const)("reports not sent when %s, and logs no address", async (_, send) => {
    const { delivered, logged } = await quietly(() =>
      deliverToOperators(ADMINS, send, "gdpr operator alert"),
    );
    expect(delivered).toBe(false);
    expect(logged).toContain("not sent");
    expect(logged).not.toContain("ops@example.test");
  });

  test("reports sent when the transport accepted it", async () => {
    const { delivered } = await quietly(() =>
      deliverToOperators(ADMINS, async () => ({ success: true, id: "re_2" }), "alert"),
    );
    expect(delivered).toBe(true);
  });
});
