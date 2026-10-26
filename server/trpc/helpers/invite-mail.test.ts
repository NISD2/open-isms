/**
 * `mailInvite` decides what the person sending an invite is told: "sent" only when the mail left.
 * Before it, the team page reported a send whenever a mail transport existed, whether or not the
 * send itself worked.
 */
import { describe, expect, test } from "bun:test";
import type { SendOutcome } from "@/lib/mail/delivery";
import { mailInvite } from "./invite-mail";

const content = async () => ({ subject: "Join", html: "<p>Join</p>", text: "Join" });

async function attempt(outcome: SendOutcome | Error) {
  const recorded: { action: string; description: string }[] = [];
  const sentTo: string[] = [];
  const delivered = await mailInvite({
    companyId: "company-1",
    actorId: "user-1",
    to: "anna@example.test",
    content,
    sentDescription: "Invite email sent to anna@example.test",
    send: async (opts) => {
      sentTo.push(opts.to);
      if (outcome instanceof Error) throw outcome;
      return outcome;
    },
    record: async (entry) => {
      recorded.push({ action: entry.action, description: entry.description ?? "" });
    },
  });
  return { delivered, recorded, sentTo };
}

describe("mailInvite", () => {
  test("a mail the transport took is reported sent and recorded", async () => {
    const { delivered, recorded, sentTo } = await attempt({ success: true, id: "msg-1" });
    expect(delivered).toBe(true);
    expect(sentTo).toEqual(["anna@example.test"]);
    expect(recorded).toEqual([
      {
        action: "email.invite_sent",
        description: "Invite email sent to anna@example.test",
      },
    ]);
  });

  test("a failed send is reported as not sent, with no 'sent' row", async () => {
    const { delivered, recorded } = await attempt({ success: false });
    expect(delivered).toBe(false);
    expect(recorded).toEqual([]);
  });

  test("a suppressed send (no transport, mail disabled) is not a send", async () => {
    for (const id of ["no-transport", "disabled", "dev-blocked"]) {
      const { delivered, recorded } = await attempt({ success: true, id });
      expect(delivered).toBe(false);
      expect(recorded).toEqual([]);
    }
  });

  test("never throws, even when the transport does", async () => {
    const { delivered, recorded } = await attempt(new Error("socket hang up"));
    expect(delivered).toBe(false);
    expect(recorded).toEqual([]);
  });

  test("a mail whose text cannot be built is not sent and does not throw", async () => {
    const sent: string[] = [];
    const delivered = await mailInvite({
      companyId: "company-1",
      actorId: "user-1",
      to: "anna@example.test",
      content: async () => {
        throw new Error("template failed");
      },
      sentDescription: "unused",
      send: async (opts) => {
        sent.push(opts.to);
        return { success: true, id: "msg-1" };
      },
      record: async () => {},
    });
    expect(delivered).toBe(false);
    expect(sent).toEqual([]);
  });
});
