import { describe, expect, test } from "bun:test";
import { effectiveAccessLevel, mayOpenPortalPath, newAccountAccessLevel } from "./access";

describe("effectiveAccessLevel", () => {
  test("before launch nobody is gated: free and grandfathered both read as grandfathered", () => {
    expect(effectiveAccessLevel("free", false)).toBe("grandfathered");
    expect(effectiveAccessLevel("grandfathered", false)).toBe("grandfathered");
  });

  test("before launch a paid account keeps full", () => {
    expect(effectiveAccessLevel("full", false)).toBe("full");
  });

  test("after launch the stored level is the level", () => {
    expect(effectiveAccessLevel("free", true)).toBe("free");
    expect(effectiveAccessLevel("grandfathered", true)).toBe("grandfathered");
    expect(effectiveAccessLevel("full", true)).toBe("full");
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
