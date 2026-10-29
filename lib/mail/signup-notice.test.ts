import { describe, expect, test } from "bun:test";
import { newUserSignupEmail } from "./signup-notice";

const base = {
  userEmail: "new.person@example.invalid",
  userName: "New Person",
  provider: "credentials",
  locale: "en",
} as const;

describe("newUserSignupEmail", () => {
  test("names the entry door the visitor was sent away from on its own line", async () => {
    const email = await newUserSignupEmail({
      ...base,
      campaign: {
        utm_source: "linkedin",
        from_path: "/training/nis2-ceo",
        gate_path: "/training/courses/nis2-ceo/0.1",
      },
    });
    const lines = email.text.split("\n");
    expect(lines).toContain("Source: utm_source=linkedin / from_path=/training/nis2-ceo");
    expect(lines).toContain("Wanted to open: /training/courses/nis2-ceo/0.1");
    expect(email.html).toContain("Wanted to open");
    expect(email.html).toContain("/training/courses/nis2-ceo/0.1");
  });

  test("the source line does not repeat the gate", async () => {
    const email = await newUserSignupEmail({
      ...base,
      campaign: { gate_path: "/journey" },
    });
    expect(email.text).not.toContain("Source:");
    expect(email.text).toContain("Wanted to open: /journey");
  });

  test("neither line appears for a signup without a source", async () => {
    const email = await newUserSignupEmail({ ...base, campaign: null });
    expect(email.text).not.toContain("Source:");
    expect(email.text).not.toContain("Wanted to open");
    expect(email.html).not.toContain("Wanted to open");
  });
});
