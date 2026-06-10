import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { getCoursePdfFilename } from "@/lib/course-pdf";

export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    const callbackUrl = encodeURIComponent(
      "/training/nis2-ceo?download=1",
    );
    return Response.redirect(
      new URL(`/auth/signin?callbackUrl=${callbackUrl}`, request.url),
    );
  }

  if (!rateLimit(`download:course-pdf:${session.user.id}`, 10, 60_000)) {
    return new Response("Too many requests", { status: 429 });
  }

  const locale =
    request.nextUrl.searchParams.get("locale") ?? "en";

  const filename = getCoursePdfFilename(locale);
  if (!filename) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = join(process.cwd(), "public", "downloads", filename);

  let arrayBuffer: ArrayBuffer;
  try {
    const buffer = await readFile(filePath);
    arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
  } catch {
    return new Response("PDF not available", { status: 404 });
  }

  return new Response(arrayBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
