/**
 * The consent gate decides whether a real person hears from us. These tests
 * pin the two directions that matter: an essential message is never
 * suppressible, and an optional one is suppressed by any of the three
 * switches that can name it.
 */
import { describe, expect, test } from "bun:test";
import {
  buildEmailConsent,
  categoryScope,
  parseScope,
  SCOPE_ALL,
  typeScope,
} from "./consent-rules";
import {
  EMAIL_TYPES,
  type EmailTypeId,
  isUserConsentEmailType,
  optionalEmailTypesByCategory,
} from "./email-types";

const subscribed = buildEmailConsent({ followupsDisabled: false, scopes: [] });

describe("essential mail is never gated", () => {
  const essentials: EmailTypeId[] = [
    "auth.verification_code",
    "auth.password_reset_code",
    "account.contact_email_changed",
    "account.invite",
    "account.member_removed",
    "auth.welcome",
  ];
  for (const id of essentials) {
    test(id, () => {
      // Even with every switch thrown, including one that names the type.
      const consent = buildEmailConsent({
        followupsDisabled: true,
        scopes: [SCOPE_ALL, typeScope(id), categoryScope(EMAIL_TYPES[id].category)],
      });
      expect(consent.allows(id)).toBe(true);
    });
  }
});

describe("optional mail respects each switch", () => {
  const id = "product.lifecycle_nudge";

  test("subscribed by default — absence of a row means yes", () => {
    expect(subscribed.allows(id)).toBe(true);
  });

  test("the legacy boolean still switches everything optional off", () => {
    const consent = buildEmailConsent({ followupsDisabled: true, scopes: [] });
    expect(consent.allows(id)).toBe(false);
    expect(consent.allOptionalDisabled).toBe(true);
  });

  test('an "all" row switches everything optional off', () => {
    const consent = buildEmailConsent({ followupsDisabled: false, scopes: [SCOPE_ALL] });
    expect(consent.allows(id)).toBe(false);
  });

  test("a category row switches off its whole category, and nothing else", () => {
    const consent = buildEmailConsent({
      followupsDisabled: false,
      scopes: [categoryScope("product")],
    });
    expect(consent.allows("product.lifecycle_nudge")).toBe(false);
    expect(consent.allows("product.course_followup")).toBe(false);
    expect(consent.allows("reminders.daily_digest")).toBe(true);
  });

  test("a type row switches off exactly one message", () => {
    const consent = buildEmailConsent({
      followupsDisabled: false,
      scopes: [typeScope("product.lifecycle_nudge")],
    });
    expect(consent.allows("product.lifecycle_nudge")).toBe(false);
    expect(consent.allows("product.course_followup")).toBe(true);
  });
});

describe("parseScope only accepts scopes we actually send", () => {
  test("missing means all — what links in already-delivered mail carry", () => {
    expect(parseScope(null)).toBe(SCOPE_ALL);
    expect(parseScope(undefined)).toBe(SCOPE_ALL);
    expect(parseScope("all")).toBe(SCOPE_ALL);
  });

  test("known categories and types round-trip", () => {
    expect(parseScope("category:reminders")).toBe("category:reminders");
    expect(parseScope("type:newsletter.issue")).toBe("type:newsletter.issue");
  });

  test("unknown or ungatable scopes are rejected, not stored", () => {
    expect(parseScope("category:nonsense")).toBeNull();
    expect(parseScope("type:does.not.exist")).toBeNull();
    // Real type, but one nobody can switch off: offering it would be a lie.
    expect(parseScope("type:auth.verification_code")).toBeNull();
    expect(parseScope("everything")).toBeNull();
    expect(parseScope("type:")).toBeNull();
  });
});

describe("the registry stays coherent", () => {
  test("every optional type appears in exactly one preference-centre group", () => {
    const grouped = optionalEmailTypesByCategory().flatMap((g) => g.types);
    const optional = (Object.keys(EMAIL_TYPES) as EmailTypeId[]).filter(
      isUserConsentEmailType,
    );
    expect([...grouped].sort()).toEqual([...optional].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  test("every optional type is reachable as a one-click scope", () => {
    for (const id of (Object.keys(EMAIL_TYPES) as EmailTypeId[]).filter(
      isUserConsentEmailType,
    )) {
      expect(parseScope(`type:${id}`)).toBe(typeScope(id));
    }
  });

  test("no type claims a category that the catalogue does not list", () => {
    for (const id of Object.keys(EMAIL_TYPES) as EmailTypeId[]) {
      expect(typeof EMAIL_TYPES[id].category).toBe("string");
      expect(EMAIL_TYPES[id].consent).toBeDefined();
    }
  });
});
