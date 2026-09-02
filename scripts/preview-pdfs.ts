/**
 * Render every generated document to disk with fixture data: no server, no
 * database, no login. Lets a change to the shared PDF design be eyeballed
 * across the whole set in one command, which is the only way to catch a
 * primitive that suits the certificate and wrecks the compliance report.
 *
 *   bun run scripts/preview-pdfs.ts                # everything, en + de
 *   bun run scripts/preview-pdfs.ts certificate    # one document
 *   bun run scripts/preview-pdfs.ts --locale pl questionnaire
 *
 * Output lands in .preview/ (gitignored).
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  type AnswerMap,
  type AnswerValue,
  computeScores,
} from "@nisd2/nis2-gap-assessment-schema";
import { renderToBuffer } from "@react-pdf/renderer";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { GapAssessmentReport } from "@/lib/pdf/gap-assessment-report";
import { PolicyDocument } from "@/lib/pdf/policy-document";
import {
  type QuestionnaireLocale,
  SupplierQuestionnaireDocument,
} from "@/lib/pdf/supplier-questionnaire";
import { TrainingCertificateDocument } from "@/lib/pdf/training-certificate";
import { certificateRef } from "@/lib/training/certificate-ref";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";
import { POLICY_FIXTURE, REPORT_FIXTURE } from "./lib/pdf-fixtures";

const OUT_DIR = join(process.cwd(), ".preview");
const COMPLETION_ISO = "2026-07-10T09:24:00.000Z";
const COURSE_ID = "nis2-ceo";

const argv = process.argv.slice(2);
const localeFlag = argv.indexOf("--locale");
const locales =
  localeFlag === -1 ? ["en", "de"] : argv.slice(localeFlag + 1, localeFlag + 2);
const names = (localeFlag === -1 ? argv : argv.slice(0, localeFlag)).filter(Boolean);

async function certificate(locale: string) {
  const course = await loadCourse(COURSE_ID);
  const modules = await Promise.all(
    course.modules.map(async (mod) => ({
      title: mod.title[locale] ?? mod.title.en ?? "",
      lessons: await Promise.all(
        mod.lessonIds.map(async (id) => {
          const lesson = await loadLesson(COURSE_ID, id);
          return { id, title: lesson.title, minutes: lesson.estimatedMinutes };
        }),
      ),
    })),
  );
  const totalLessons = modules.reduce((n, m) => n + m.lessons.length, 0);
  const totalMinutes = modules.reduce(
    (total, m) => total + m.lessons.reduce((n, l) => n + l.minutes, 0),
    0,
  );

  return TrainingCertificateDocument({
    locale,
    data: {
      courseTitle: course.title[locale] ?? course.title.en ?? COURSE_ID,
      userName: "Simon Peter Orzel",
      userEmail: "simon@nisd2.eu",
      completionDate: new Date(COMPLETION_ISO).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalHours: Math.max(1, Math.round(totalMinutes / 60)),
      totalLessons,
      legalBasis:
        course.certificate.legalBasis[locale] ?? course.certificate.legalBasis.en ?? "",
      sealLabel: course.certificate.sealLabel,
      certificateRef: certificateRef({
        userId: "preview-user",
        courseId: COURSE_ID,
        completionDate: COMPLETION_ISO,
      }),
      modules: modules.map((mod) => ({
        title: mod.title,
        lessons: mod.lessons.map((l) => ({
          id: l.id,
          title: l.title[locale] ?? l.title.en ?? l.id,
        })),
      })),
    },
  });
}

function gapAssessment(locale: string) {
  const data = getGapAssessmentData();
  // A deterministic spread of answers: enough yes/partial/no to exercise every
  // maturity band and produce a gap list worth looking at.
  const byDomain: AnswerValue[][] = [
    [2, 2, 2, 2], // optimized
    [2, 2, 2, 1], // managed
    [2, 1, 1, 2, 1], // developing
    [1, 0, 1, 0], // initial
    [0, 0, 0, 1], // critical
  ];
  const answers: AnswerMap = Object.fromEntries(
    data.questions.map((q, i) => {
      const band = byDomain[q.domain % byDomain.length];
      return [q.id, band[i % band.length]];
    }),
  );
  return GapAssessmentReport({
    scores: computeScores(data.questions, answers),
    domains: data.domains,
    questions: data.questions,
    locale,
    companyName: "Wertstoff Nordkreis GmbH",
    date: new Date(COMPLETION_ISO).toLocaleDateString(
      locale === "de" ? "de-DE" : "en-US",
    ),
  });
}

const DOCUMENTS: Record<string, (locale: string) => unknown | Promise<unknown>> = {
  certificate,
  report: (locale) => ComplianceReport({ data: REPORT_FIXTURE, locale }),
  policy: (locale) => PolicyDocument({ data: POLICY_FIXTURE, locale }),
  gap: gapAssessment,
  questionnaire: (locale) =>
    SupplierQuestionnaireDocument({
      locale: (["de", "en", "nl", "fr", "it", "es", "pl"].includes(locale)
        ? locale
        : "en") as QuestionnaireLocale,
    }),
};

const selected = names.length > 0 ? names : Object.keys(DOCUMENTS);
const unknown = selected.filter((name) => !(name in DOCUMENTS));
if (unknown.length > 0) {
  throw new Error(
    `Unknown document(s): ${unknown.join(", ")}. Known: ${Object.keys(DOCUMENTS).join(", ")}`,
  );
}

await mkdir(OUT_DIR, { recursive: true });

for (const name of selected) {
  for (const locale of locales) {
    const element = await DOCUMENTS[name](locale);
    const buffer = await renderToBuffer(element as never);
    const path = join(OUT_DIR, `${name}-${locale}.pdf`);
    await writeFile(path, buffer);
    console.log(`${path}  ${(buffer.length / 1024).toFixed(0)} kB`);
  }
}
