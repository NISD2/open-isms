import { describe, expect, test } from "bun:test";
import {
  cleanReplacer,
  MAX_DESCRIPTION_CHARS,
  MAX_STRING_CHARS,
  MAX_VALUE_CHARS,
  maskPersonal,
  plain,
  shownDescription,
  shownValue,
} from "./sanitize";

// Built from the code point (U+202E), never typed: a literal bidi character in a source file hides
// code from a reader, and a formatter may turn an escape back into one.
const BIDI_OVERRIDE = String.fromCodePoint(0x202e);

/** How long a call takes, in milliseconds. */
const timed = (run: () => unknown): number => {
  const start = performance.now();
  run();
  return performance.now() - start;
};

describe("what reaches the model", () => {
  test("masks email and IP addresses inside free text", () => {
    expect(
      maskPersonal("Invite email sent to anna.muster@example.org from 203.0.113.7"),
    ).toBe("Invite email sent to a***@example.org from [ip]");
    expect(maskPersonal("peer 2001:db8:85a3::8a2e:370:7334 saw it")).toBe(
      "peer [ip] saw it",
    );
    expect(maskPersonal("nothing personal here")).toBe("nothing personal here");
    expect(maskPersonal("saved at 12:30:45 on 2026-10-20")).toBe(
      "saved at 12:30:45 on 2026-10-20",
    );
  });

  test("masks an address with a long local part and several domain labels", () => {
    expect(maskPersonal("to first.last+tag@mail.example.co.uk now")).toBe(
      "to f***@mail.example.co.uk now",
    );
  });

  test("masks a 100,000-character single token in well under 100 ms", () => {
    for (const token of [
      "a".repeat(100_000),
      "x".repeat(100_000),
      "1.".repeat(50_000),
      "a:".repeat(50_000),
      `${"a".repeat(50_000)}@${"b".repeat(50_000)}`,
    ]) {
      expect(timed(() => maskPersonal(token))).toBeLessThan(100);
    }
  });

  test("bounds a description before masking it", () => {
    const out = shownDescription("y".repeat(MAX_DESCRIPTION_CHARS * 50));
    expect(out.length).toBe(MAX_DESCRIPTION_CHARS + 1);
    expect(shownDescription("sent to anna@example.org")).toBe("sent to a***@example.org");
  });

  test("takes out control, format and bidi characters, and cuts a long string", () => {
    expect(plain(`a\u0000b${BIDI_OVERRIDE}c\nd`)).toBe("a b c d");
    const cut = plain("x".repeat(MAX_STRING_CHARS + 50));
    expect(cut.length).toBe(MAX_STRING_CHARS + 1);
    expect(cut.endsWith("…")).toBe(true);
  });

  test("cleans every string of a result, nested ones included, and leaves numbers alone", () => {
    const out = JSON.parse(
      JSON.stringify({ n: 2, a: { b: [`x${BIDI_OVERRIDE}y`] } }, cleanReplacer),
    );
    expect(out).toEqual({ n: 2, a: { b: ["x y"] } });
  });
});

describe("a stored value", () => {
  test("is nothing when nothing was stored", () => {
    expect(shownValue(null)).toBeNull();
    expect(shownValue(undefined)).toBeNull();
  });

  test("keeps its shape, masked, while it is short", () => {
    expect(shownValue({ email: "bob@example.org", n: 3 })).toEqual({
      email: "b***@example.org",
      n: 3,
    });
  });

  test("is a cut preview with its full length once its JSON passes the limit", () => {
    const shown = shownValue({ text: "z".repeat(MAX_VALUE_CHARS) });
    expect(shown).toMatchObject({ cut: true });
    expect(JSON.stringify(shown).length).toBeLessThan(MAX_STRING_CHARS + 100);
    expect(shown).toHaveProperty("totalChars", MAX_VALUE_CHARS + 11);
  });

  test("a huge value costs a bounded amount of masking", () => {
    expect(timed(() => shownValue({ text: "a".repeat(5_000_000) }))).toBeLessThan(100);
  });
});
