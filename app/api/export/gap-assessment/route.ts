import { renderToBuffer } from "@react-pdf/renderer";
import { and, desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getGapAssessmentData } from "@/lib/gap-assessment";
import type { AssessmentScores } from "@/lib/gap-assessment/schema";
import { GapAssessmentReport } from "@/lib/pdf/gap-assessment-report";
import { rateLimit } from "@/lib/rate-limit";
import { gapAssessment } from "@/schema";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!(await rateLimit(`export:gap:${session.user.id}`, 5, 60_000))) {
    return new Response("Too many requests", { status: 429 });
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  // With a sessionId the id alone picks the row, so the ordering only acts without one.
  const assessment = await db.query.gapAssessment.findFirst({
    where: sessionId
      ? and(eq(gapAssessment.id, sessionId), eq(gapAssessment.userId, session.user.id))
      : eq(gapAssessment.userId, session.user.id),
    orderBy: [desc(gapAssessment.completedAt)],
  });

  if (!assessment || !assessment.completedAt || !assessment.scores) {
    return new Response("No completed assessment found", { status: 404 });
  }

  const data = getGapAssessmentData();
  const date = new Date().toISOString().split("T")[0];

  const buffer = await renderToBuffer(
    GapAssessmentReport({
      scores: assessment.scores as AssessmentScores,
      domains: data.domains,
      questions: data.questions,
      locale,
      companyName: undefined,
      date,
    }),
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="nis2-gap-assessment-${date}.pdf"`,
    },
  });
}
