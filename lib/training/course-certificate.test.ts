import { describe, test, expect } from "bun:test";
import { COURSE_IDS, loadCourse } from "./course-loader";
import { routing } from "@/i18n/routing";

const courses = await Promise.all(COURSE_IDS.map((id) => loadCourse(id)));

describe("course certificate blocks", () => {
  test.each(COURSE_IDS.map((id, i) => [id, courses[i]] as const))(
    "%s states a legal basis in every shipped locale",
    (_id, course) => {
      for (const locale of routing.locales) {
        expect(course.certificate.legalBasis[locale]?.trim()).toBeTruthy();
      }
    },
  );

  // The bug this guards: the basis used to be one hardcoded string in the PDF
  // template, so the CRA SBOM certificate claimed "Managementschulung gemäß
  // §38(3) BSIG". Two courses sharing a basis is the shape that mistake takes
  // when a new course is started by copying an existing one.
  test("no two courses claim the same legal basis", () => {
    const seen = new Map<string, string>();
    for (const course of courses) {
      const basis = course.certificate.legalBasis.en;
      const owner = seen.get(basis);
      expect(owner, `${course.id} reuses the basis of ${owner}: "${basis}"`).toBeUndefined();
      seen.set(basis, course.id);
    }
  });

  test("the seal mark is short enough to sit inside the seal", () => {
    for (const course of courses) {
      expect(course.certificate.sealLabel.length).toBeLessThanOrEqual(8);
    }
  });
});
