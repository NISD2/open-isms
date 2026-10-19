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

const { renderActivationNudge } = await import("./activation-nudge");

function input(overrides: Partial<ActivationNudgeInput> = {}): ActivationNudgeInput {
  return {
    name: "Simon Orzel",
    locale: "de",
    walk: { kind: "open", done: 3, total: 20 },
    nextStepTitle: "Aufschreiben, was Ihr Unternehmen hat",
    walkUrl: "https://nisd2.eu/durchgang/nis2",
    unsubscribeUrl: "https://nisd2.eu/api/email/unsubscribe?u=x&t=y",
    ...overrides,
  };
}

describe("renderActivationNudge, walkthrough open", () => {
  test("subject names the step Continue opens", async () => {
    const email = await renderActivationNudge(input());
    expect(email.subject).toBe(
      "Ihr nächster Schritt: Aufschreiben, was Ihr Unternehmen hat",
    );
  });

  test("progress copy carries the real numbers, and the button the home's own label", async () => {
    const email = await renderActivationNudge(input());
    expect(email.text).toContain("3 von 20 Punkten bearbeitet");
    expect(email.html).toContain("3 von 20 Punkten bearbeitet");
    expect(email.text).toContain(
      "NIS 2 Umsetzung fortsetzen: https://nisd2.eu/durchgang/nis2",
    );
    expect(email.text).not.toContain("freischalten");
  });

  test("nothing done yet: the first step, no zero-of-20 line, the home's start label", async () => {
    const email = await renderActivationNudge(
      input({ walk: { kind: "open", done: 0, total: 20 } }),
    );
    expect(email.subject).toStartWith("Ihr erster Schritt:");
    expect(email.text).toContain("ist freigeschaltet: 20 Punkte");
    expect(email.text).not.toContain("0 von 20");
    expect(email.text).toContain("Los geht's: https://nisd2.eu/durchgang/nis2");
  });
});

describe("renderActivationNudge, walkthrough locked", () => {
  const locked = () => input({ walk: { kind: "locked", total: 21 } });

  test("names the first step and says the page shows how to unlock it", async () => {
    const email = await renderActivationNudge(locked());
    expect(email.subject).toBe(
      "Ihr erster Schritt: Aufschreiben, was Ihr Unternehmen hat",
    );
    expect(email.text).toContain("Punkt für Punkt durch: 21 Punkte");
    expect(email.text).toContain("wie Sie den Durchgang freischalten");
    expect(email.text).toContain("Durchgang ansehen: https://nisd2.eu/durchgang/nis2");
  });

  test("never claims progress or an open walkthrough", async () => {
    const email = await renderActivationNudge(locked());
    expect(email.text).not.toContain("bearbeitet");
    expect(email.text).not.toContain("ist freigeschaltet");
  });

  test("en and cs render their own copy", async () => {
    const en = await renderActivationNudge({ ...locked(), locale: "en" });
    expect(en.subject).toStartWith("Your first step:");
    expect(en.text).toContain("how to unlock the walkthrough");
    expect(en.text).toContain("See the walkthrough:");

    const cs = await renderActivationNudge({ ...locked(), locale: "cs" });
    expect(cs.subject).toStartWith("Váš první krok:");
    expect(cs.text).toContain("jak průvodce odemknout");
    expect(cs.html).toContain('lang="cs"');
  });
});

describe("renderActivationNudge, the question and the sign-off", () => {
  test("someone who started is asked about their last time in the walkthrough", async () => {
    const email = await renderActivationNudge(input());
    expect(email.text).toContain(
      "Als Sie zuletzt im Durchgang waren, was hat Sie unterbrochen?",
    );
    expect(email.text).toContain("Viele Grüße\nSimon");
    expect(email.html).toContain("was hat Sie unterbrochen?");
  });

  test("someone who has not started is asked what brought them here", async () => {
    for (const walk of [
      { kind: "open", done: 0, total: 20 },
      { kind: "locked", total: 21 },
    ] as const) {
      const email = await renderActivationNudge(input({ walk }));
      expect(email.text).toContain("Was war der Anlass für Ihre Anmeldung bei nisd2.eu?");
      expect(email.text).not.toContain("unterbrochen");
    }
  });
});

describe("renderActivationNudge, every version", () => {
  test("html and text both link the walkthrough and the unsubscribe", async () => {
    const email = await renderActivationNudge(input());
    expect(email.text).toContain("https://nisd2.eu/durchgang/nis2");
    expect(email.text).toContain("https://nisd2.eu/api/email/unsubscribe?u=x&t=y");
    expect(email.html).toContain('href="https://nisd2.eu/durchgang/nis2"');
    // An ampersand in an attribute is written &amp;, which every mail client reads back as &.
    expect(email.html).toContain(
      'href="https://nisd2.eu/api/email/unsubscribe?u=x&amp;t=y"',
    );
    expect(email.text).not.toContain("/journey");
  });

  test("en and cs open versions use the home's labels in their language", async () => {
    const en = await renderActivationNudge(input({ locale: "en" }));
    expect(en.subject).toStartWith("Your next step:");
    expect(en.text).toContain("3 of 20 items are dealt with");
    expect(en.text).toContain("Continue your NIS 2 implementation:");

    const cs = await renderActivationNudge(input({ locale: "cs" }));
    expect(cs.subject).toStartWith("Váš další krok:");
    // Bare greeting: the recipient's name ("Simon Orzel" here) never follows "Dobrý den".
    expect(cs.text.split("\n")[0]).toBe("Dobrý den,");
    expect(cs.text).toContain("zpracováno 3 z 20 bodů");
    expect(cs.text).toContain("Pokračovat v zavádění NIS 2:");
    expect(cs.html).toContain("Odhlásit připomínky e-mailem");
  });

  test("named greetings per locale", async () => {
    expect((await renderActivationNudge(input({ locale: "de" }))).text).toContain(
      "Guten Tag, Simon,",
    );
    expect((await renderActivationNudge(input({ locale: "en" }))).text).toContain(
      "Hello Simon,",
    );
    expect(
      (await renderActivationNudge(input({ locale: "en", name: null }))).text,
    ).toStartWith("Hello,");
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
