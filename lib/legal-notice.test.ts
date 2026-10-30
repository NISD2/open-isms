import { describe, expect, test } from "bun:test";
import en from "../messages/common/en.json";
import { LICENSE_URL, SOURCE_URL } from "./legal-notice";

describe("legal notice", () => {
  test("the licence link sits under the source link, both https", () => {
    expect(new URL(SOURCE_URL).protocol).toBe("https:");
    expect(LICENSE_URL.startsWith(`${SOURCE_URL}/`)).toBe(true);
  });

  // LegalNotice renders these tags as the two links; a message without them would show the
  // licence and the source nowhere, which is what section 0 of the AGPL asks a notice to give.
  test("the software message carries the licence and the source link", () => {
    expect(en.legalNotice.software).toMatch(/<license>[^<]+<\/license>/);
    expect(en.legalNotice.software).toMatch(/<source>[^<]+<\/source>/);
    expect(en.legalNotice.software).toContain("warranty");
  });

  test("the independent-install message says the operator is not nisd2.eu", () => {
    expect(en.legalNotice.independent).toContain("nisd2.eu");
    expect(en.legalNotice.independent).toContain("independently");
  });
});
