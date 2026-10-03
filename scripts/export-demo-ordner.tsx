/**
 * Export the demo company's Prüfordner to disk, through the same code the export page serves:
 *   1. the compliance report (/api/export/report)
 *   2. the registers (/api/export/registers)
 *   3. the walk's documents (/api/export/documents)
 *   4. all data as JSON (/api/export/data)
 *
 * Run: EXPORT_DEMO_ORDNER=1 bun run --env-file=.env scripts/export-demo-ordner.tsx
 *
 * Opt-in because this reads an entire tenant out of whatever database DATABASE_URL names and
 * writes it to disk. That is a data export, and it should not happen because someone ran the
 * wrong script.
 */
if (process.env.EXPORT_DEMO_ORDNER !== "1") {
  throw new Error(
    "Refusing to run without EXPORT_DEMO_ORDNER=1.\n" +
      "This writes a full tenant export to disk from the database DATABASE_URL points at.",
  );
}

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { loadCompanyExport } from "@/lib/export/company-export";
import { exportNames } from "@/lib/export/value-names";
import { DocumentsDocument, RegistersDocument } from "@/lib/pdf/company-export";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { user } from "@/schema";
import { getNis2Assessment } from "@/server/trpc/helpers/nis2-scope";

const DEMO_EMAIL = "gf@wertstoff-nordkreis.example";

/**
 * Defaults to the Desktop for a developer running this locally, but a container has no Desktop
 * and often no HOME, so the path is overridable and created if absent.
 */
const OUT_DIR =
  process.env.DEMO_ORDNER_OUT ?? join(process.env.HOME ?? process.cwd(), "Desktop");

async function main(): Promise<readonly string[]> {
  const gf = await db.query.user.findFirst({
    where: eq(user.email, DEMO_EMAIL),
    columns: { companyId: true },
  });
  if (!gf?.companyId) throw new Error("demo company not found, run the seed first");
  // No fallback to "whichever assessment exists": the binder is titled NIS 2.
  const assessment = await getNis2Assessment(db, gf.companyId);
  if (!assessment) throw new Error("no NIS 2 assessment for the demo company");

  const [report, data, names] = await Promise.all([
    loadReportData(assessment.id, "de"),
    loadCompanyExport(db, gf.companyId),
    exportNames("de"),
  ]);
  const files: ReadonlyArray<readonly [string, Buffer | string]> = [
    [
      "pruefordner-1-bericht.pdf",
      await renderToBuffer(ComplianceReport({ data: report, locale: "de" })),
    ],
    [
      "pruefordner-2-register.pdf",
      await renderToBuffer(RegistersDocument({ data, locale: "de", names })),
    ],
    [
      "pruefordner-3-dokumente.pdf",
      await renderToBuffer(DocumentsDocument({ data, locale: "de", names })),
    ],
    ["pruefordner-4-daten.json", JSON.stringify(data, null, 2)],
  ];
  mkdirSync(OUT_DIR, { recursive: true });
  return files.map(([name, content]) => {
    const path = join(OUT_DIR, name);
    writeFileSync(path, content);
    return path;
  });
}

const outcome = await main().then(
  (paths) => ({ ok: true as const, paths }),
  (error: unknown) => ({ ok: false as const, error }),
);
if (outcome.ok) console.log(outcome.paths.join("\n"));
else console.error(outcome.error);
process.exit(outcome.ok ? 0 : 1);
