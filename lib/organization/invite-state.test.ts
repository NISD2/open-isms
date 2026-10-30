import { describe, expect, test } from "bun:test";
import { inviteLinkState, isInviteExpired, reusableInviteToken } from "./invite-state";

const NOW = new Date("2026-10-26T09:00:00Z");
const LATER = new Date("2026-11-02T09:00:00Z");
const EARLIER = new Date("2026-10-14T09:00:00Z");

describe("isInviteExpired", () => {
  test("an invite stops working at the instant it expires", () => {
    expect(isInviteExpired(NOW, NOW)).toBe(true);
    expect(isInviteExpired(EARLIER, NOW)).toBe(true);
    expect(isInviteExpired(LATER, NOW)).toBe(false);
  });
});

describe("reusableInviteToken", () => {
  test("keeps the link of an open invite, so the mail already sent still works", () => {
    expect(
      reusableInviteToken({ token: "mailed", status: "pending", expiresAt: LATER }, NOW),
    ).toBe("mailed");
  });

  test("never revives an expired link", () => {
    expect(
      reusableInviteToken(
        { token: "mailed", status: "pending", expiresAt: EARLIER },
        NOW,
      ),
    ).toBeNull();
  });

  test("a withdrawn or accepted invite gets a new link, so withdrawing ends the old one", () => {
    for (const status of ["revoked", "accepted"]) {
      expect(
        reusableInviteToken({ token: "mailed", status, expiresAt: LATER }, NOW),
      ).toBeNull();
    }
  });

  test("a first invite has nothing to keep", () => {
    expect(reusableInviteToken(undefined, NOW)).toBeNull();
  });
});

describe("inviteLinkState", () => {
  test("says why a link does not open, case by case", () => {
    expect(inviteLinkState(undefined, NOW)).toBe("invalid");
    expect(inviteLinkState({ status: "accepted", expiresAt: LATER }, NOW)).toBe(
      "accepted",
    );
    expect(inviteLinkState({ status: "revoked", expiresAt: LATER }, NOW)).toBe("revoked");
    expect(inviteLinkState({ status: "pending", expiresAt: EARLIER }, NOW)).toBe(
      "expired",
    );
    expect(inviteLinkState({ status: "pending", expiresAt: LATER }, NOW)).toBe("open");
  });

  test("an accepted or withdrawn invite says so even after its date", () => {
    expect(inviteLinkState({ status: "accepted", expiresAt: EARLIER }, NOW)).toBe(
      "accepted",
    );
    expect(inviteLinkState({ status: "revoked", expiresAt: EARLIER }, NOW)).toBe(
      "revoked",
    );
  });

  test("an unknown status opens nothing", () => {
    expect(inviteLinkState({ status: "archived", expiresAt: LATER }, NOW)).toBe(
      "invalid",
    );
  });
});
