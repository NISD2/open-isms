import { describe, expect, test } from "bun:test";
import {
  effectiveAccessLevel,
  hasGotIn,
  isGrandfatheredPerson,
  mayOpenPortalPath,
  newAccountAccessLevel,
  unpaidAccessLevel,
} from "./access";

describe("isGrandfatheredPerson", () => {
  const never = {
    grandfatheredAt: null,
    emailVerifiedAt: null,
    loginCount: 0,
    lastLoginAt: null,
  };
  const gotIn = { ...never, emailVerifiedAt: new Date("2026-09-01") };
  const stamped = { ...gotIn, grandfatheredAt: new Date("2026-09-20") };

  test("after the launch, exactly the people it stamped", () => {
    expect(isGrandfatheredPerson(stamped, true)).toBe(true);
    expect(isGrandfatheredPerson(gotIn, true)).toBe(false);
  });

  test("before the launch, everyone who has got in", () => {
    expect(isGrandfatheredPerson(gotIn, false)).toBe(true);
    expect(isGrandfatheredPerson(never, false)).toBe(false);
  });
});

describe("unpaidAccessLevel", () => {
  test("a grandfathered holder falls back to grandfathered, anyone else to free", () => {
    expect(unpaidAccessLevel(true)).toBe("grandfathered");
    expect(unpaidAccessLevel(false)).toBe("free");
  });
});

describe("effectiveAccessLevel", () => {
  test("before launch nobody is gated: free and grandfathered both read as grandfathered", () => {
    expect(effectiveAccessLevel("free", false, false)).toBe("grandfathered");
    expect(effectiveAccessLevel("grandfathered", false, false)).toBe("grandfathered");
  });

  test("a paid account keeps full, before and after launch", () => {
    expect(effectiveAccessLevel("full", false, false)).toBe("full");
    expect(effectiveAccessLevel("full", true, false)).toBe("full");
  });

  test("after launch the stored level is the level for an unstamped person", () => {
    expect(effectiveAccessLevel("free", true, false)).toBe("free");
    expect(effectiveAccessLevel("grandfathered", true, false)).toBe("grandfathered");
  });

  test("after launch a stamped person is grandfathered even in a free company", () => {
    expect(effectiveAccessLevel("free", true, true)).toBe("grandfathered");
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
  test("grandfathered before launch, whoever opens it", () => {
    expect(newAccountAccessLevel(false, false)).toBe("grandfathered");
    expect(newAccountAccessLevel(false, true)).toBe("grandfathered");
  });

  test("after launch free, unless the person opening it was grandfathered", () => {
    expect(newAccountAccessLevel(true, false)).toBe("free");
    expect(newAccountAccessLevel(true, true)).toBe("grandfathered");
  });
});

describe("mayOpenPortalPath", () => {
  test("a free account reaches billing, settings, organization and notifications", () => {
    for (const p of ["/billing", "/settings", "/organization", "/notifications"]) {
      expect(mayOpenPortalPath("free", p)).toBe(true);
    }
  });

  test("a free account does not reach the journey or the registers", () => {
    for (const p of ["/journey", "/dashboard", "/assets", "/compliance/x", "/billingx"]) {
      expect(mayOpenPortalPath("free", p)).toBe(false);
    }
  });

  test("grandfathered and full reach everything", () => {
    expect(mayOpenPortalPath("grandfathered", "/journey")).toBe(true);
    expect(mayOpenPortalPath("full", "/assets")).toBe(true);
  });
});
