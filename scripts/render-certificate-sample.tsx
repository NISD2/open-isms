/**
 * Renders the NIS 2 management training certificate for a made-up participant, as the picture the
 * course shows in its first lesson ("this is what you get at the end"). It runs the same document
 * and the same course data as the real download (app/api/training/certificate/route.ts), so the
 * picture changes when the certificate does: re-run after any change to either.
 *
 *   bun run scripts/render-certificate-sample.tsx
 *
 * Needs `pdftoppm` (poppler) on the PATH. Writes public/images/training/certificate-sample-<locale>.webp.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import sharp from "sharp";
import { pickLocalized } from "@/lib/locale";
import { TrainingCertificateDocument } from "@/lib/pdf/training-certificate";
import { certificateRef } from "@/lib/training/certificate-ref";
import { loadCourse, loadLesson } from "@/lib/training/course-loader";

const COURSE_ID = "nis2-ceo";

/** Made-up people only: this picture is public. */
const SAMPLES = [
  { locale: "en", name: "Alex Example", email: "alex@example.com" },
  { locale: "de", name: "Anna Beispiel", email: "anna@example.com" },
] as const;

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
const totalMinutes = modules.flatMap((m) => m.lessons).reduce((n, l) => n + l.minutes, 0);
const completionDate = "2026-10-01T09:00:00.000Z";

const outDir = path.join(process.cwd(), "public", "images", "training");
const work = mkdtempSync(path.join(tmpdir(), "cert-sample-"));
try {
  for (const sample of SAMPLES) {
    const pdf = await renderToBuffer(
      TrainingCertificateDocument({
        data: {
          courseTitle: course.title[sample.locale] ?? course.title.en ?? "",
          userName: sample.name,
          userEmail: sample.email,
          completionDate: new Date(completionDate).toLocaleDateString(sample.locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          totalHours: Math.max(1, Math.round(totalMinutes / 60)),
          totalLessons: modules.reduce((n, m) => n + m.lessons.length, 0),
          certificateRef: certificateRef({
            userId: "sample",
            courseId: COURSE_ID,
            completionDate,
          }),
          legalBasis: pickLocalized(course.certificate.legalBasis, sample.locale),
          sealLabel: course.certificate.sealLabel,
          modules: modules.map((m) => ({
            title: m.title[sample.locale] ?? m.title.en ?? "",
            lessons: m.lessons.map((l) => ({
              id: l.id,
              title: l.title[sample.locale] ?? l.title.en ?? l.id,
            })),
          })),
        },
        locale: sample.locale,
      }),
    );
    const pdfPath = path.join(work, `${sample.locale}.pdf`);
    writeFileSync(pdfPath, pdf);
    // First page only: the cover is the part anyone frames or forwards.
    execFileSync("pdftoppm", [
      "-png",
      "-r",
      "150",
      "-f",
      "1",
      "-l",
      "1",
      "-singlefile",
      pdfPath,
      path.join(work, sample.locale),
    ]);
    const out = path.join(outDir, `certificate-sample-${sample.locale}.webp`);
    await sharp(readFileSync(path.join(work, `${sample.locale}.png`)))
      .resize({ width: 1200 })
      .webp({ quality: 86 })
      .toFile(out);
    console.log(`wrote ${path.relative(process.cwd(), out)}`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
