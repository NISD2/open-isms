import { describe, expect, test } from "bun:test";
import { EMAIL_LOCALES, isApprovedMailLocale } from "@/lib/mail/locale";
import {
  courseResumeUrl,
  followupCourseTitle,
  followupLanguageOf,
} from "./course-followup";

const APP = "https://nisd2.example";

// Until every email language is in APPROVED_MAIL_LOCALES these are switched off, not deleted.
const whenLocalised = EMAIL_LOCALES.every(isApprovedMailLocale) ? test : test.skip;

describe("followupLanguageOf", () => {
  whenLocalised(
    "a Czech reader gets the Czech mail, by choice or by the company's country",
    () => {
      expect(followupLanguageOf("cs", null)).toEqual({ locale: "cs", mailLocale: "cs" });
      expect(followupLanguageOf(null, "CZ")).toEqual({ locale: "cs", mailLocale: "cs" });
    },
  );

  whenLocalised(
    "German and English readers keep the English mail; the footer follows their language",
    () => {
      expect(followupLanguageOf("de", null)).toEqual({ locale: "de", mailLocale: "en" });
      expect(followupLanguageOf("en", "CZ")).toEqual({ locale: "en", mailLocale: "en" });
      expect(followupLanguageOf(null, null)).toEqual({ locale: "de", mailLocale: "en" });
    },
  );
});

describe("courseResumeUrl", () => {
  test("a Czech mail links to the Czech course", () => {
    expect(courseResumeUrl(APP, "ceo-nis2", "cs")).toBe(
      `${APP}/cs/training/courses/ceo-nis2`,
    );
  });

  test("an English mail keeps the unprefixed link it always had", () => {
    expect(courseResumeUrl(APP, "ceo nis2", "en")).toBe(
      `${APP}/training/courses/ceo%20nis2`,
    );
  });
});

describe("followupCourseTitle", () => {
  const titles = {
    en: "Management training",
    de: "Geschäftsleitung",
    cs: "Školení vedení",
  };

  test("the mail's language, English for a mail in English", () => {
    expect(followupCourseTitle(titles, "cs")).toBe("Školení vedení");
    expect(followupCourseTitle(titles, "en")).toBe("Management training");
  });

  test("English where the course has no Czech title", () => {
    expect(followupCourseTitle({ en: "Management training" }, "cs")).toBe(
      "Management training",
    );
  });
});
