import { NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyAssessment } from "@/schema";
import { eq } from "drizzle-orm";
import { loadPolicyData } from "@/lib/pdf/load-policy-data";
import { PolicyDocument } from "@/lib/pdf/policy-document";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!rateLimit(`export:policy:${session.user.id}`, 5, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const assessmentId = request.nextUrl.searchParams.get("assessmentId");
  const categoryCode = request.nextUrl.searchParams.get("categoryCode");
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  if (!assessmentId || !categoryCode) {
    return new Response("Missing assessmentId or categoryCode", { status: 400 });
  }

  // Authorization: must own the assessment
  const assessment = await db.query.companyAssessment.findFirst({
    where: eq(companyAssessment.id, assessmentId),
  });
  if (!assessment || assessment.companyId !== session.companyId) {
    return new Response("Forbidden", { status: 403 });
  }

  const data = await loadPolicyData(assessmentId, categoryCode);
  const buffer = await renderToBuffer(
    PolicyDocument({ data, locale }),
  );

  const date = new Date().toISOString().split("T")[0];
  const filename = `${categoryCode.toLowerCase()}-policy-${date}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
