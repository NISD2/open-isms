import { describe, expect, test } from "bun:test";
import {
  EXAMPLE_PORTAL_PATHS,
  effectiveAccessLevel,
  hasGotIn,
  isGrandfatheredPerson,
  mayOpenPortalPath,
  mayOrderFor,
  mayWalkDurchgang,
  newAccountAccessLevel,
  OFFER_PATH,
  unpaidAccessLevel,
  walkLockFor,
} from "./access";

describe("mayWalkDurchgang", () => {
  test("only a paid account walks the guided path", () => {
    expect(mayWalkDurchgang("full", false)).toBe(true);
    expect(mayWalkDurchgang("grandfathered", false)).toBe(false);
    expect(mayWalkDurchgang("free", false)).toBe(false);
    expect(mayWalkDurchgang(null, false)).toBe(false);
  });

  test("a platform admin passes, to show it on a call", () => {
    expect(mayWalkDurchgang("grandfathered", true)).toBe(true);
  });
});

describe("isGrandfatheredPerson", () => {
  test("exactly the people the launch or a promo link stamped", () => {
    expect(isGrandfatheredPerson({ grandfatheredAt: new Date("2026-09-20") })).toBe(true);
    expect(isGrandfatheredPerson({ grandfatheredAt: null })).toBe(false);
  });
});

describe("unpaidAccessLevel", () => {
  test("a grandfathered holder falls back to grandfathered, anyone else to free", () => {
    expect(unpaidAccessLevel(true)).toBe("grandfathered");
    expect(unpaidAccessLevel(false)).toBe("free");
  });
});

describe("effectiveAccessLevel", () => {
  test("the stored level is the level for an unstamped person", () => {
    expect(effectiveAccessLevel("free", false)).toBe("free");
    expect(effectiveAccessLevel("grandfathered", false)).toBe("grandfathered");
    expect(effectiveAccessLevel("full", false)).toBe("full");
  });

  test("a stamped person is grandfathered even in a free company, and keeps full", () => {
    expect(effectiveAccessLevel("free", true)).toBe("grandfathered");
    expect(effectiveAccessLevel("full", true)).toBe("full");
  });
});

describe("hasGotIn", () => {
  const never = { emailVerifiedAt: null, loginCount: 0, lastLoginAt: null };

  test("nobody who never verified, signed in or was seen has got in", () => {
    expect(hasGotIn(never)).toBe(false);
  });

  test("any one of the three signals counts, including a verified email with login_count 0", () => {
    expect(hasGotIn({ ...never, emailVerifiedAt: new Date() })).toBe(true);
    expect(hasGotIn({ ...never, loginCount: 1 })).toBe(true);
    expect(hasGotIn({ ...never, lastLoginAt: new Date() })).toBe(true);
  });
});

describe("newAccountAccessLevel", () => {
  test("where the deployment sells: free, unless the person opening it was grandfathered", () => {
    expect(newAccountAccessLevel(true, false)).toBe("free");
    expect(newAccountAccessLevel(true, true)).toBe("grandfathered");
  });

  test("where it sells nothing (self-hosted, a local run): grandfathered, nobody could order", () => {
    expect(newAccountAccessLevel(false, false)).toBe("grandfathered");
    expect(newAccountAccessLevel(false, true)).toBe("grandfathered");
  });
});

describe("mayOpenPortalPath", () => {
  test("a free account reaches billing, settings, organization, notifications and its export", () => {
    for (const p of [
      "/billing",
      "/settings",
      "/organization",
      "/notifications",
      "/export",
      "/export/gesamt",
    ]) {
      expect(mayOpenPortalPath("free", p)).toBe(true);
    }
  });

  test("a free account reaches the order page under every locale's slug", () => {
    for (const p of ["/bestellen", "/order", "/commander", "/zamowic"]) {
      expect(mayOpenPortalPath("free", p)).toBe(true);
    }
  });

  test("a free account opens the registers and the activity log, which show examples", () => {
    for (const p of EXAMPLE_PORTAL_PATHS) {
      expect(mayOpenPortalPath("free", p)).toBe(true);
    }
  });

  test("a free account does not reach the journey, the team or the requirements", () => {
    for (const p of [
      "/journey",
      "/dashboard",
      "/team",
      "/compliance/x",
      "/billingx",
      "/assetsx",
      "/orders",
    ]) {
      expect(mayOpenPortalPath("free", p)).toBe(false);
    }
  });

  test("grandfathered and full reach everything", () => {
    expect(mayOpenPortalPath("grandfathered", "/journey")).toBe(true);
    expect(mayOpenPortalPath("full", "/assets")).toBe(true);
  });
});

describe("walkLockFor", () => {
  test("a free account orders from the offer and has no journey to go to", () => {
    expect(walkLockFor("free", true)).toEqual({ orderAt: OFFER_PATH, journey: false });
  });

  test("a grandfathered account, or one with no level yet, orders directly and keeps its journey", () => {
    for (const level of ["grandfathered", null] as const) {
      expect(walkLockFor(level, true)).toEqual({ orderAt: "/bestellen", journey: true });
    }
  });

  test("before ordering opens there is no order page to send anyone to, only the journey", () => {
    expect(walkLockFor("grandfathered", false)).toEqual({ orderAt: null, journey: true });
  });

  test("offers the journey exactly where the portal gate opens it", () => {
    for (const level of ["free", "grandfathered", "full"] as const) {
      for (const open of [true, false]) {
        expect(walkLockFor(level, open).journey).toBe(
          mayOpenPortalPath(level, "/journey"),
        );
      }
    }
  });
});

describe("mayOrderFor", () => {
  const holder = "holder-id";
  const fromHolder = { invitedBy: holder, role: "ceo" } as const;

  test("the account holder orders", () => {
    expect(
      mayOrderFor({ userId: holder, holderUserId: holder, jobTitle: null, invite: null }),
    ).toBe(true);
  });

  test("management the holder invited orders for the same account", () => {
    expect(
      mayOrderFor({
        userId: "gf-id",
        holderUserId: holder,
        jobTitle: "ceo",
        invite: fromHolder,
      }),
    ).toBe(true);
  });

  test("the management role alone is not enough: an admin can give it to anyone", () => {
    expect(
      mayOrderFor({
        userId: "gf-id",
        holderUserId: holder,
        jobTitle: "ceo",
        invite: null,
      }),
    ).toBe(false);
    expect(
      mayOrderFor({
        userId: "gf-id",
        holderUserId: holder,
        jobTitle: "ceo",
        invite: { invitedBy: "admin-id", role: "ceo" },
      }),
    ).toBe(false);
  });

  test("the holder's invite must have been for management, and the role still held", () => {
    expect(
      mayOrderFor({
        userId: "member-id",
        holderUserId: holder,
        jobTitle: "ceo",
        invite: { invitedBy: holder, role: null },
      }),
    ).toBe(false);
    for (const jobTitle of [null, "ciso", "dpo"]) {
      expect(
        mayOrderFor({
          userId: "gf-id",
          holderUserId: holder,
          jobTitle,
          invite: fromHolder,
        }),
      ).toBe(false);
    }
  });

  test("an account without a holder takes no order", () => {
    expect(
      mayOrderFor({ userId: "gf-id", holderUserId: null, jobTitle: "ceo", invite: null }),
    ).toBe(false);
  });
});
