import "@/lib/server-guard";

import { z } from "zod";
import type { PdfLocale } from "@/lib/pdf/format";

/**
 * The stored codes the export prints by name, each with the message file and key the app's own
 * screens name them from, so a file says what the screen says.
 */
const SOURCES = {
  sector: ["organization", ["organization", "sectors"]],
  entityType: ["organization", ["organization", "entityTypes"]],
  type: ["assets", ["assets", "types"]],
  riskLevel: ["suppliers", ["suppliers", "riskLevel"]],
  treatment: ["risks", ["risks", "treatment"]],
  severity: ["incidents", ["incidents", "severity"]],
  approverRole: ["team", ["team", "roles"]],
  mfaMethod: ["durchgang", ["durchgang", "items", "11_1", "screens", "logins", "methods"]],
  backupFrequency: ["durchgang", ["durchgang", "items", "4_4", "screens", "systems", "options"]],
} as const satisfies Record<string, readonly [string, readonly string[]]>;

export type CodedField = keyof typeof SOURCES;
export type ValueNames = Readonly<Record<CodedField, Readonly<Record<string, string>>>>;

/** Message files are data: a map that does not parse names nothing, and the code prints. */
const NAMES = z.record(z.string(), z.string()).catch({});

/** The value under `path` in a message file's JSON, or undefined. */
const at = (json: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>(
    (node, key) =>
      typeof node === "object" && node !== null ? new Map(Object.entries(node)).get(key) : undefined,
    json,
  );

/**
 * The name of every coded value the export prints, in `locale`, read the way `lib/messages`
 * reads its files, so it works on a route and in a script alike.
 */
export async function valueNames(locale: PdfLocale): Promise<ValueNames> {
  const named = async ([file, path]: readonly [string, readonly string[]]) => {
    const json: unknown = (await import(`../../messages/${file}/${locale}.json`)).default;
    return NAMES.parse(at(json, path));
  };
  const [
    sector,
    entityType,
    type,
    riskLevel,
    treatment,
    severity,
    approverRole,
    mfaMethod,
    backupFrequency,
  ] = await Promise.all([
    named(SOURCES.sector),
    named(SOURCES.entityType),
    named(SOURCES.type),
    named(SOURCES.riskLevel),
    named(SOURCES.treatment),
    named(SOURCES.severity),
    named(SOURCES.approverRole),
    named(SOURCES.mfaMethod),
    named(SOURCES.backupFrequency),
  ]);
  return {
    sector,
    entityType,
    type,
    riskLevel,
    treatment,
    severity,
    approverRole,
    mfaMethod,
    backupFrequency,
  };
}
