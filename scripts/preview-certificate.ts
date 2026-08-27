/**
 * Render the training certificate to disk with real course data, no DB and no
 * server. Lets a design change be eyeballed in a PDF viewer in one command:
 *
 *   bun run scripts/preview-certificate.ts --course cra-sbom de en
 */
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";
import { TrainingCertificateDocument } from "@/lib/pdf/training-certificate";
import { certificateRef } from "@/lib/training/certificate-ref";

const OUT_DIR = join(process.cwd(), ".preview");
const COMPLETION_ISO = "2026-07-10T09:24:00.000Z";

// bun run scripts/preview-certificate.ts [--course <id>] [locale ...]
const argv = process.argv.slice(2);
const courseFlag = argv.indexOf("--course");
const COURSE_ID = courseFlag === -1 ? "nis2-ceo" : argv[courseFlag + 1];
const rest = courseFlag === -1 ? argv : [...argv.slice(0, courseFlag), ...argv.slice(courseFlag + 2)];
const locales = rest.length ? rest : ["de", "en"];

const course = await loadCourse(COURSE_ID);
const modules = await Promise.all(
  course.modules.map(async (mod) => ({
    title: mod.title,
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

await mkdir(OUT_DIR, { recursive: true });

const written = await Promise.all(
  locales.map(async (locale) => {
    const buffer = await renderToBuffer(
      TrainingCertificateDocument({
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
          legalBasis: course.certificate.legalBasis[locale] ?? course.certificate.legalBasis.en ?? "",
          sealLabel: course.certificate.sealLabel,
          certificateRef: certificateRef({
            userId: "preview-user",
            courseId: COURSE_ID,
            completionDate: COMPLETION_ISO,
          }),
          modules: modules.map((mod) => ({
            title: mod.title[locale] ?? mod.title.en ?? "",
            lessons: mod.lessons.map((l) => ({
              id: l.id,
              title: l.title[locale] ?? l.title.en ?? l.id,
            })),
          })),
        },
      }),
    );
    const path = join(OUT_DIR, `certificate-${COURSE_ID}-${locale}.pdf`);
    await writeFile(path, buffer);
    return path;
  }),
);

console.log(written.join("\n"));
