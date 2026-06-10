import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { api } from "@/lib/trpc/server";
import { TrainingCertificateDocument } from "@/lib/pdf/training-certificate";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const courseId = request.nextUrl.searchParams.get("courseId") ?? "nis2-ceo";
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!rateLimit(`cert:${session.user.id}`, 5, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const completion = await api.trainingCertificate.getCourseCompletion({ courseId });

  if (!completion.allCompleted) {
    return new Response("Course not completed", { status: 403 });
  }

  const dateLocale = locale === "de" ? "de-DE" : locale === "nl" ? "nl-NL" : "en-US";
  const completionDate = completion.completionDate
    ? new Date(completion.completionDate).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const lessonLines = completion.lessonTitles.map((l) => {
    const title = l.title[locale] ?? l.title.en ?? l.id;
    return `${l.id} ${title}`;
  });

  const totalHours = Math.max(1, Math.round((completion.totalCount * 5) / 60));

  const buffer = await renderToBuffer(
    TrainingCertificateDocument({
      data: {
        courseTitle:
          completion.courseTitle[locale] ??
          completion.courseTitle.en ??
          "NIS2 Management Training",
        userName: completion.userName ?? "Participant",
        companyName: completion.companyName ?? null,
        completionDate,
        totalHours,
        lessonLines,
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
