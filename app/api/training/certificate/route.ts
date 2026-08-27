import { NextRequest } from "next/server";
import { hasLocale } from "next-intl";
import { renderToBuffer } from "@react-pdf/renderer";
import { routing } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { api } from "@/lib/trpc/server";
import { TrainingCertificateDocument } from "@/lib/pdf/training-certificate";
import { certificateRef } from "@/lib/training/certificate-ref";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get("courseId") ?? "nis2-ceo";
  // The query string is caller-controlled and the locale reaches Intl, which
  // throws on a malformed tag. Pin it to a locale we actually ship.
  const requestedLocale = request.nextUrl.searchParams.get("locale");
  const locale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  if (!rateLimit(`cert:${session.user.id}`, 5, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const completion = await api.trainingCertificate.getCourseCompletion({ courseId });

  if (!completion.allCompleted) {
    return new Response("Course not completed", { status: 403 });
  }

  // Intl resolves a bare language subtag, so every locale we ship gets its own
  // date order and month name rather than falling back to en-US.
  const completionDate = new Date(
    completion.completionDate ?? Date.now(),
  ).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" });

  const ref = certificateRef({
    userId: session.user.id,
    courseId,
    completionDate: completion.completionDate ?? "",
  });

  const modules = completion.courseModules.map((m) => ({
    title: m.title[locale] ?? m.title.en ?? "",
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title[locale] ?? l.title.en ?? l.id,
    })),
  }));

  const totalHours = Math.max(1, Math.round((completion.totalCount * 5) / 60));

  const buffer = await renderToBuffer(
    TrainingCertificateDocument({
      data: {
        courseTitle:
          completion.courseTitle[locale] ??
          completion.courseTitle.en ??
          "NIS2 Management Training",
        userName: completion.userName ?? "Participant",
        userEmail: completion.userEmail ?? "",
        completionDate,
        totalHours,
        totalLessons: completion.totalCount,
        certificateRef: ref,
        modules,
      },
      locale,
    }),
  );

  const date = new Date().toISOString().split("T")[0];
  const filename = `nis2-certificate-${courseId}-${date}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
