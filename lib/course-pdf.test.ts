import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "bun:test";
import { COURSE_PDF_FILES, COURSE_PDF_VERSION, getCoursePdfFilename } from "./course-pdf";

/**
 * COURSE_PDF_VERSION names a file that has to exist on disk, and nothing used
 * to check that. app/api/download/course-pdf/route.ts swallows the readFile
 * error and returns 404 "PDF not available", so a mistyped version, an
 * uncommitted rebuild or a third locale added to the map is invisible until a
 * signed-in user who just finished the course clicks download and gets
 * nothing.
 *
 * .gitignore previously carried `public/downloads/*.pdf`, which would have
 * made exactly that happen on the next version bump. That rule is gone; this
 * is the check that would have caught it either way.
 */
describe("course PDF mapping", () => {
  it("every locale in the map has its file in public/downloads", () => {
    for (const [locale, filename] of Object.entries(COURSE_PDF_FILES)) {
      const path = join(process.cwd(), "public", "downloads", filename);
      expect(existsSync(path), `${locale}: missing ${filename}`).toBe(true);
    }
  });

  it("filenames carry the current version", () => {
    for (const filename of Object.values(COURSE_PDF_FILES)) {
      expect(filename).toContain(COURSE_PDF_VERSION);
    }
  });

  it("returns null for a locale with no edition", () => {
    expect(getCoursePdfFilename("nl")).toBeNull();
  });
});
