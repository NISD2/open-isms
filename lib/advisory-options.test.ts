/**
 * The two public endpoints behind /hilfe accept input from anyone with a
 * browser, and the request row is the artefact a referral fee is invoiced
 * against. These pin the parts where being wrong is expensive: what a caller
 * can write, and which topic a request arrives carrying.
 */
import { describe, expect, test } from "bun:test";
import {
  advisoryEnrichInput,
  advisorySubmitInput,
  categoryFromSourcePath,
  firstMatchingParam,
  REQUIREMENT_CODE_PATTERN,
  resolveDefaultTopic,
  SOURCE_PATH_PATTERN,
  topicForRequirementCode,
  topicForWikiCategory,
} from "./advisory-options";

describe("advisorySubmitInput", () => {
  const valid = { topic: "scope", email: "a@b.de", forwardConsent: true } as const;

  test("accepts the minimum a request can be acted on with", () => {
    expect(advisorySubmitInput.parse(valid).email).toBe("a@b.de");
  });

  // The whole lawful basis for passing the request to a third party. A row
  // stored without it is one we may not act on, so it must not be storable.
  test("rejects a missing consent", () => {
    expect(() =>
      advisorySubmitInput.parse({ topic: "scope", email: "a@b.de" }),
    ).toThrow();
  });

  test("rejects consent that is present but false", () => {
    expect(() =>
      advisorySubmitInput.parse({ ...valid, forwardConsent: false }),
    ).toThrow();
  });

  test("rejects a topic outside the list", () => {
    expect(() => advisorySubmitInput.parse({ ...valid, topic: "anything" })).toThrow();
  });

  // ?req= arrives from a URL a stranger can edit and lands in an email a human
  // reads, so it is shape-checked rather than trusted.
  test("rejects a requirement code that is not one", () => {
    expect(() =>
      advisorySubmitInput.parse({ ...valid, requirementCode: "../../etc/passwd" }),
    ).toThrow();
    expect(
      advisorySubmitInput.parse({ ...valid, requirementCode: "NIS2-21-2-D" }),
    ).toBeTruthy();
  });
});

describe("advisoryEnrichInput", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  // enrich is addressed by a row id the submitter was just handed. These are
  // the fields that decide who a request belongs to and what it was consented
  // to, so they must not be reachable from it.
  test("drops the contact address", () => {
    const parsed = advisoryEnrichInput.parse({ id, email: "attacker@evil.example" });
    expect(parsed).not.toHaveProperty("email");
  });

  test("drops the consent timestamp", () => {
    const parsed = advisoryEnrichInput.parse({ id, forwardConsentAt: new Date(0) });
    expect(parsed).not.toHaveProperty("forwardConsentAt");
  });

  test("drops anything to do with referrals", () => {
    const parsed = advisoryEnrichInput.parse({
      id,
      partner: "some-firm",
      feeCents: 0,
      paidAt: new Date(0),
    });
    expect(parsed).not.toHaveProperty("partner");
    expect(parsed).not.toHaveProperty("feeCents");
    expect(parsed).not.toHaveProperty("paidAt");
  });

  test("keeps the descriptive fields it exists for", () => {
    const parsed = advisoryEnrichInput.parse({
      id,
      companyName: "Stadtwerke Musterstadt",
      trigger: "customerAsked",
    });
    expect(parsed.companyName).toBe("Stadtwerke Musterstadt");
    expect(parsed.trigger).toBe("customerAsked");
  });
});

describe("firstMatchingParam", () => {
  test("takes the first value that passes, not the first value present", () => {
    // Next hands a repeated parameter over as an array. Taking values[0] would
    // drop a good code because an empty one preceded it, which is the bug this
    // helper exists to prevent.
    expect(firstMatchingParam(["", "NIS2-23"], REQUIREMENT_CODE_PATTERN)).toBe("NIS2-23");
  });

  test("returns null when nothing passes", () => {
    expect(firstMatchingParam("not a code!", REQUIREMENT_CODE_PATTERN)).toBeNull();
    expect(firstMatchingParam(undefined, REQUIREMENT_CODE_PATTERN)).toBeNull();
  });

  test("accepts a wiki category and rejects a traversal", () => {
    expect(firstMatchingParam("zeit-und-status", SOURCE_PATH_PATTERN)).toBe(
      "zeit-und-status",
    );
    expect(firstMatchingParam("../../secret", SOURCE_PATH_PATTERN)).toBeNull();
  });
});

describe("topic routing", () => {
  // Longest prefix first: NIS2-21-2-D is supply chain, not the generic
  // implementation bucket everything under NIS2-21 would otherwise fall into.
  test("maps a requirement code to the most specific topic", () => {
    expect(topicForRequirementCode("NIS2-21-2-D")).toBe("supplyChain");
    expect(topicForRequirementCode("NIS2-23-4")).toBe("incident");
  });

  test("falls back to implementation for an unmapped code", () => {
    expect(topicForRequirementCode("NIS2-99")).toBe("measures");
  });

  test("treats docs as self-hosting, never as law", () => {
    expect(topicForWikiCategory("docs")).toBe("selfHosting");
  });

  test("prefers the requirement code over the page it came from", () => {
    expect(resolveDefaultTopic("NIS2-23", "zeit-und-status")).toBe("incident");
    expect(resolveDefaultTopic(null, "zeit-und-status")).toBe("scope");
    expect(resolveDefaultTopic(null, null)).toBeUndefined();
  });

  // The stored value is the whole page path, so the category has to be read
  // out of it. "wiki" is always the first segment and never the category.
  test("reads the category out of a full wiki path", () => {
    expect(categoryFromSourcePath("wiki/troubleshooting/bsi-anfrage-erhalten")).toBe(
      "troubleshooting",
    );
    expect(categoryFromSourcePath("/wiki/umsetzung/asset-inventar")).toBe("umsetzung");
    expect(categoryFromSourcePath("docs/getting-started/quickstart")).toBe("docs");
    expect(categoryFromSourcePath("")).toBe("");
  });

  test("routes a full path to the same topic as its category", () => {
    expect(resolveDefaultTopic(null, "wiki/umsetzung/asset-inventar")).toBe("measures");
    expect(resolveDefaultTopic(null, "docs/getting-started/quickstart")).toBe(
      "selfHosting",
    );
  });
});
