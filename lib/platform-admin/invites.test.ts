/**
 * Where an invite stands on the "Invited users" tab. Pinned: acceptance wins over everything, a
 * revoked invite reads as revoked even after its date, and an open invite expires at its date.
 */
import { describe, expect, test } from "bun:test";
import { inviteStatus } from "./invites";

const NOW = new Date("2026-10-20T12:00:00Z");
const LATER = new Date("2026-10-27T12:00:00Z");
const EARLIER = new Date("2026-10-13T12:00:00Z");

describe("invite status", () => {
  test("an accepted invite has joined, whatever its date", () => {
    expect(
      inviteStatus({ accepted: true, revoked: false, expiresAt: EARLIER }, NOW),
    ).toBe("joined");
  });

  test("a revoked invite is revoked, not expired, once its date passed", () => {
    expect(
      inviteStatus({ accepted: false, revoked: true, expiresAt: EARLIER }, NOW),
    ).toBe("revoked");
  });

  test("an open invite is pending until its date and expired from it", () => {
    expect(inviteStatus({ accepted: false, revoked: false, expiresAt: LATER }, NOW)).toBe(
      "pending",
    );
    expect(inviteStatus({ accepted: false, revoked: false, expiresAt: NOW }, NOW)).toBe(
      "expired",
    );
  });
});
