import { describe, test, expect } from "bun:test";
import { certificateRef } from "./certificate-ref";

const completion = {
  userId: "usr_01HQ8Z2K",
  courseId: "nis2-ceo",
  completionDate: "2026-07-10T09:24:00.000Z",
};

describe("certificateRef", () => {
  test("is stable across downloads of the same completion", () => {
    expect(certificateRef(completion)).toBe(certificateRef({ ...completion }));
  });

  test("formats as three groups of four", () => {
    expect(certificateRef(completion)).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);
  });

  test("omits glyphs that misread on a printed sheet", () => {
    const refs = Array.from({ length: 500 }, (_, i) =>
      certificateRef({ ...completion, userId: `usr_${i}` }),
    );
    expect(refs.join("")).not.toMatch(/[ILOU]/);
  });

  test("differs per user, per course and per completion", () => {
    const ref = certificateRef(completion);
    expect(certificateRef({ ...completion, userId: "usr_other" })).not.toBe(ref);
    expect(certificateRef({ ...completion, courseId: "cra-sbom" })).not.toBe(ref);
    expect(certificateRef({ ...completion, completionDate: "2026-07-11T09:24:00.000Z" })).not.toBe(
      ref,
    );
  });

  test("does not leak the user id", () => {
    expect(certificateRef(completion)).not.toContain("01HQ8Z2K");
  });
});
