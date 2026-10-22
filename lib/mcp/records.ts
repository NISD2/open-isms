import "@/lib/server-guard";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getPathname } from "@/i18n/navigation";
import type { WalkLocale } from "@/lib/durchgang";
import { READ_PART_FIELDS } from "@/lib/export/read-part";
import { getAppUrl } from "@/lib/utils";
import type { KeyHolder } from "./context";
import { language, notInPlan, refuse, type ToolOutcome } from "./gates";
import { confirmFirst, notAllowed, notExporter, toolAnswer } from "./records-rules";

export const ReadRecordsInput = z.object({ ...READ_PART_FIELDS, language });

const appLinkOf = (href: "/export" | "/settings", locale: WalkLocale): string =>
  `${getAppUrl()}${getPathname({ href, locale })}`;

/** The money back's hold (AGB B7), as `assistantExportProcedure` raises it through `requireBillingAct`. */
const isMoneyBackHold = (error: unknown): boolean =>
  error instanceof TRPCError && error.code === "PRECONDITION_FAILED";

/**
 * One part of the company's records, a page at a time, through the procedure every other read
 * of the assistant goes through: `records.readPart`, on the key's list (procedures.ts), behind
 * `assistantExportProcedure` (the key's company, the access gate, the admin's switch, `mayExport`,
 * the money back). The plan, the switch and `mayExport` are checked here first only to answer in
 * the assistant's language; the procedure is what refuses.
 */
export async function readRecords(
  holder: KeyHolder,
  input: z.output<typeof ReadRecordsInput>,
): Promise<ToolOutcome> {
  const { part, page } = input;
  const locked = notInPlan(holder, input.language);
  if (locked) return locked;
  if (!holder.readRecords)
    return refuse(notAllowed(input.language, appLinkOf("/settings", input.language)));
  if (!holder.mayExport) return refuse(notExporter(input.language));
  const answer = await holder.caller.records
    .readPart({ part, page })
    .catch((error: unknown) => {
      if (isMoneyBackHold(error)) return null;
      throw error;
    });
  if (answer === null)
    return refuse(confirmFirst(input.language, appLinkOf("/export", input.language)));
  return toolAnswer(part, page, answer);
}
