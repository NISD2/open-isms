import { describe, expect, mock, test } from "bun:test";
import type { ActivationNudgeInput } from "./activation-nudge";

// activation-nudge.ts imports @/lib/email/unsubscribe, which loads lib/env,
// whose validation throws in CI (no .env there; the unit suite stays
// env-free by invariant). Mock env with its full export shape, then import
// the module under test dynamically so the mock is registered first.
mock.module("../../env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.com",
}));

const { displayableFirstName, renderActivationNudge } = await import(
  "./activation-nudge"
);

function input(overrides: Partial<ActivationNudgeInput> = {}): ActivationNudgeInput {
  return {
    name: "Simon Orzel",
    locale: "de",
    done: 3,
    total: 49,
    nextStepTitle: "Risikoanalyse dokumentieren",
    journeyUrl: "https://nisd2.eu/journey",
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=x&t=y",
    ...overrides,
  };
}

describe("displayableFirstName", () => {
  test("takes the first token of a real name", () => {
    expect(displayableFirstName("Simon Orzel")).toBe("Simon");
    expect(displayableFirstName("  Anna-Lena Schmidt ")).toBe("Anna-Lena");
  });

  test("raises the initial of lower-cased names", () => {
    expect(displayableFirstName("simon")).toBe("Simon");
  });

  test("rejects email local parts and other non-names", () => {
    expect(displayableFirstName("j.mueller")).toBeNull();
    expect(displayableFirstName("info42")).toBeNull();
    expect(displayableFirstName("a@b")).toBeNull();
    expect(displayableFirstName(null)).toBeNull();
    expect(displayableFirstName("  ")).toBeNull();
  });
});

describe("renderActivationNudge", () => {
  test("subject names the concrete next step", async () => {
    const email = await renderActivationNudge(input());
    expect(email.subject).toBe("Ihr nächster Schritt: Risikoanalyse dokumentieren");
  });

  test("progress copy carries the real numbers", async () => {
    const email = await renderActivationNudge(input());
    expect(email.text).toContain("3 von 49");
    expect(email.html).toContain("3 von 49");
  });

  test("zero progress gets the fresh-start intro, no zero-of-49 line", async () => {
    const email = await renderActivationNudge(input({ done: 0 }));
    expect(email.text).toContain("steht bereit");
    expect(email.text).not.toContain("0 von 49");
  });

  test("html and text both link the journey and the unsubscribe", async () => {
    const email = await renderActivationNudge(input());
    expect(email.text).toContain("https://nisd2.eu/journey");
    expect(email.text).toContain("https://nisd2.eu/api/email/unsubscribe?u=x&t=y");
    expect(email.html).toContain('href="https://nisd2.eu/journey"');
    // An ampersand in an attribute is written &amp;, which every mail client reads back as &.
    expect(email.html).toContain(
      'href="https://nisd2.eu/api/email/unsubscribe?u=x&amp;t=y"',
    );
  });

  test("en and nl render their own copy", async () => {
    const en = await renderActivationNudge(input({ locale: "en" }));
    expect(en.subject).toContain("Your next step:");
    expect(en.text).toContain("3 of 49");

    const nl = await renderActivationNudge(input({ locale: "nl" }));
    expect(nl.subject).toContain("Uw volgende stap:");
    expect(nl.text).toContain("3 van de 49");
    expect(nl.text).toContain("De volgende stap:");
  });

  test("named greetings per locale: DE vocative comma, NL switches to Beste", async () => {
    expect((await renderActivationNudge(input({ locale: "de" }))).text).toContain(
      "Guten Tag, Simon,",
    );
    expect((await renderActivationNudge(input({ locale: "en" }))).text).toContain(
      "Hello Simon,",
    );
    expect((await renderActivationNudge(input({ locale: "nl" }))).text).toContain(
      "Beste Simon,",
    );
    // Bare NL greeting stays Goedendag (Beste needs a name after it).
    expect(
      (await renderActivationNudge(input({ locale: "nl", name: null }))).text,
    ).toContain("Goedendag,");
  });

  test("interpolated content is HTML-escaped", async () => {
    const email = await renderActivationNudge(
      input({ nextStepTitle: 'Risiko & <img src=x onerror="x">' }),
    );
    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("Risiko &amp; &lt;img");
  });

  test("a name that fails the name pattern falls back to the bare greeting", async () => {
    const email = await renderActivationNudge(
      input({ name: "<script>alert(1)</script>" }),
    );
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("Guten Tag,");
  });

  test("newlines cannot reach the subject header", async () => {
    const email = await renderActivationNudge(
      input({ nextStepTitle: "Zeile eins\r\nBcc: evil@example.com" }),
    );
    expect(email.subject).not.toMatch(/[\r\n]/);
  });
});
