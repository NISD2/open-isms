import { describe, expect, test } from "bun:test";
import {
  EXAMPLE_PORTAL_PATHS,
  effectiveAccessLevel,
  hasGotIn,
  isGrandfatheredPerson,
  mayOpenPortalPath,
  mayWalkDurchgang,
  newAccountAccessLevel,
  OFFER_PATH,
  orderRightFor,
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

  test("a grandfathered account orders directly and is offered its journey", () => {
    expect(walkLockFor("grandfathered", true)).toEqual({
      orderAt: "/bestellen",
      journey: true,
    });
  });

  test("an account with no level yet orders directly, without the journey link", () => {
    expect(walkLockFor(null, true)).toEqual({ orderAt: "/bestellen", journey: false });
  });

  test("before ordering opens there is no order page to send anyone to", () => {
    expect(walkLockFor("grandfathered", false)).toEqual({ orderAt: null, journey: true });
  });

  test("offers the journey only where the portal gate opens it", () => {
    for (const level of ["free", "grandfathered", "full"] as const) {
      for (const open of [true, false]) {
        if (walkLockFor(level, open).journey) {
          expect(mayOpenPortalPath(level, "/journey")).toBe(true);
        }
      }
    }
  });
});

describe("orderRightFor", () => {
  const holder = "holder-id";
  const fromHolder = { invitedBy: holder, role: "ceo" } as const;
  const keeps = { may: true, becomesPayer: false } as const;
  const takesOver = { may: true, becomesPayer: true } as const;
  const refused = { may: false } as const;
  // Someone on a paid account who holds nothing and administers none of its organizations: each
  // test changes what it is about.
  const base = {
    userId: "gf-id",
    holderUserId: holder,
    adminOfAccount: false,
    jobTitle: null,
    invite: null,
    unpaid: false,
  } as const;

  test("the account holder orders and stays the payer", () => {
    expect(orderRightFor({ ...base, userId: holder })).toEqual(keeps);
    expect(orderRightFor({ ...base, userId: holder, unpaid: true })).toEqual(keeps);
  });

  test("management the holder invited orders for the same account; the holder stays the payer", () => {
    expect(orderRightFor({ ...base, jobTitle: "ceo", invite: fromHolder })).toEqual(
      keeps,
    );
  });

  test("the management role alone is not enough: an admin can give it to anyone", () => {
    expect(orderRightFor({ ...base, jobTitle: "ceo" })).toEqual(refused);
    expect(
      orderRightFor({
        ...base,
        jobTitle: "ceo",
        invite: { invitedBy: "admin-id", role: "ceo" },
      }),
    ).toEqual(refused);
  });

  test("the holder's invite must have been for management, and the role still held", () => {
    expect(
      orderRightFor({
        ...base,
        jobTitle: "ceo",
        invite: { invitedBy: holder, role: null },
      }),
    ).toEqual(refused);
    for (const jobTitle of [null, "ciso", "dpo"]) {
      expect(orderRightFor({ ...base, jobTitle, invite: fromHolder })).toEqual(refused);
    }
  });

  test("while nobody has paid, an admin of every organization on it orders and becomes the payer", () => {
    expect(orderRightFor({ ...base, adminOfAccount: true, unpaid: true })).toEqual(
      takesOver,
    );
    expect(
      orderRightFor({ ...base, adminOfAccount: true, unpaid: true, holderUserId: null }),
    ).toEqual(takesOver);
  });

  test("once paid, an admin who is not the payer does not order", () => {
    expect(orderRightFor({ ...base, adminOfAccount: true })).toEqual(refused);
  });

  test("an unpaid account takes no order from someone who is not an admin of all its organizations", () => {
    // A member, a reviewer, or an admin of only one of a consultant's client organizations.
    expect(orderRightFor({ ...base, unpaid: true })).toEqual(refused);
  });

  test("an account without a holder takes no order from management", () => {
    expect(orderRightFor({ ...base, holderUserId: null, jobTitle: "ceo" })).toEqual(
      refused,
    );
  });
});
