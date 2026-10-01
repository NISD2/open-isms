/**
 * What frames every email: who sends it, and whether it can be switched off.
 *
 * The footer names the company the way § 35a Abs. 1 GmbHG asks of a business letter, but only on
 * nisd2.eu: a self-hosted install runs the same templates, and its mail must not carry our register
 * entry or our managing director. The opt-out links appear on optional mail only; a sign-in code or
 * an invoice offering an unsubscribe link would be a lie.
 */
import { afterEach, describe, expect, mock, test } from "bun:test";

mock.module("@/lib/env", () => ({
  env: {
    DATABASE_URL: "postgres://unused:unused@localhost:5432/unused",
    AUTH_SECRET: "test-secret-test-secret-test-secret",
  },
  mailSupportEmail: () => "support@example.test",
}));

const { letterReplyTo, letterSignOff } = await import("./layout");
const { EmailFrame } = await import("./components/frame");
const { renderEmail } = await import("./render");
const { isSellerInstance } = await import("@/lib/billing/seller");

type Chrome = Parameters<typeof EmailFrame>[0]["chrome"];

/** The shared frame around a one-word body, rendered the way every email is. */
const frame = (chrome: Chrome) => renderEmail(EmailFrame, { chrome, children: "Body" });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const servedFrom = (url: string) => {
  process.env.NEXT_PUBLIC_APP_URL = url;
};
afterEach(() => {
  if (APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = APP_URL;
});

const OPT_OUT = {
  unsubscribeUrl: "https://www.nisd2.eu/api/email/unsubscribe?u=x",
  preferencesUrl: "https://www.nisd2.eu/email/preferences?u=x&lang=de",
  locale: "de",
} as const;

describe("isSellerInstance", () => {
  test("is nisd2.eu with or without www, and nothing else", () => {
    expect(isSellerInstance("https://www.nisd2.eu")).toBe(true);
    expect(isSellerInstance("https://nisd2.eu/de")).toBe(true);
    expect(isSellerInstance("http://localhost:3026")).toBe(false);
    expect(isSellerInstance("https://isms.example.org")).toBe(false);
    expect(isSellerInstance("https://nisd2.eu.example.org")).toBe(false);
    expect(isSellerInstance("not a url")).toBe(false);
    expect(isSellerInstance("")).toBe(false);
  });

  test("an install that never configured its address is not taken for nisd2.eu", async () => {
    // lib/env fills the gap with nisd2.eu for links; the gate must not follow that default.
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(isSellerInstance()).toBe(false);
    expect(await frame({ locale: "de" })).not.toContain("Kardashev");
    expect(letterSignOff("de")).not.toContain("Simon Orzel");
  });
});

describe("the frame on nisd2.eu", () => {
  test("names the company, its register entry and its managing director", async () => {
    servedFrom("https://www.nisd2.eu");
    const html = await frame({ locale: "de" });
    expect(html).toContain("Kardashev Catalyst UG (haftungsbeschränkt)");
    expect(html).toContain("Amtsgericht Köln, HRB 126993");
    expect(html).toContain("Geschäftsführer: Simon Orzel");
    expect(html).toContain("USt-IdNr. DE462889433");
  });

  test("links the legal pages in the reader's language", async () => {
    servedFrom("https://www.nisd2.eu");
    const en = await frame({ locale: "en" });
    const nl = await frame({ locale: "nl" });
    expect(en).toContain('href="https://www.nisd2.eu/en/imprint"');
    expect(en).toContain("Managing director: Simon Orzel");
    expect(nl).toContain('href="https://www.nisd2.eu/nl/colofon"');
    expect(nl).toContain('href="https://www.nisd2.eu/nl/voorwaarden"');
  });

  test("holds the card at 560px for Outlook, which ignores max-width", async () => {
    servedFrom("https://www.nisd2.eu");
    expect(await frame({ locale: "de" })).toContain('width="560"');
  });

  test("the managing director signs letters", () => {
    servedFrom("https://www.nisd2.eu");
    expect(letterSignOff("de")).toEqual([
      "Mit freundlichen Grüßen",
      "Simon Orzel",
      "Geschäftsführer, nisd2.eu",
    ]);
  });

  test("replies go to the published contact address, never the no-reply sender", () => {
    servedFrom("https://nisd2.eu");
    expect(letterReplyTo()).toBe("contact@nisd2.eu");
  });

  test("carries no slogan in the header", async () => {
    servedFrom("https://www.nisd2.eu");
    expect(await frame({ locale: "en" })).not.toContain("Halve Europe");
  });
});

describe("the frame on a self-hosted install", () => {
  test("names no company and no person", async () => {
    servedFrom("https://isms.example.org");
    const html = await frame({ locale: "de" });
    expect(html).not.toContain("Kardashev");
    expect(html).not.toContain("Simon Orzel");
    expect(html).toContain("Open NIS2 compliance platform");
    expect(letterSignOff("de")).toEqual(["Mit freundlichen Grüßen", "nisd2.eu"]);
    // No address we know is read, so its letters invite no reply.
    expect(letterReplyTo()).toBeNull();
  });
});

describe("opt-out links", () => {
  test("optional mail carries them, essential mail does not", async () => {
    servedFrom("https://www.nisd2.eu");
    const optional = await frame(OPT_OUT);
    const essential = await frame({ locale: "de" });
    expect(optional).toContain(OPT_OUT.unsubscribeUrl);
    expect(optional).toContain("E-Mails abbestellen");
    expect(essential).not.toContain("abbestellen");
    expect(essential).not.toContain("unsubscribe");
  });
});
