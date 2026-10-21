import { ReadPartInput, readPart } from "@/lib/export/read-part";
import { assistantExportProcedure, router } from "../init";

export const recordsRouter = router({
  /**
   * One part of the company's records a page at a time, exactly as the export file holds it, for
   * an assistant's key (`assistantExportProcedure` says who and when). Reads nothing outside the
   * key's own company: every part filters by `ctx.companyId`.
   */
  readPart: assistantExportProcedure
    .input(ReadPartInput)
    .query(({ ctx, input }) => readPart(ctx.db, ctx.companyId, input)),
});
