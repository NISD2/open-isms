import "@/lib/server-guard";

import { asc, eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { GDPR_WALK } from "@/lib/durchgang";
import { company, companyCategoryIntake, requirementCategory, supplier } from "@/schema";
import { processingActivityCreateSchema } from "@/schema/processing-activity-validators";
import { walkPolicyRows } from "@/server/trpc/helpers/durchgang";
import { assessmentOf } from "@/server/trpc/helpers/framework-assessment";
import {
  activitiesOf,
  controllerOf,
} from "@/server/trpc/helpers/processing-activity-record";
import { columnsOf } from "./company-export";

type Row<T extends { $inferSelect: object }> = T["$inferSelect"];

/**
 * The fields of a supplier the GDPR export carries: what the walk records of its role, its
 * contract, its sub-processors and its transfers. Never whole rows (`unsubscribeToken` is a bearer
 * token), and the NIS 2 export keeps the rest of the supplier.
 */
export const GDPR_SUPPLIER_FIELDS = [
  "relationshipType",
  "processesPersonalData",
  "processorCheckedAt",
  "dpaAvailable",
  "dpaConcluded",
  "hasSubprocessors",
  "subprocessorList",
  "subprocessorAuthorisation",
  "internationalTransfer",
  "transferMechanism",
  "transferCountries",
  "transferCheckedAt",
] as const satisfies readonly (keyof Row<typeof supplier>)[];

/** What a company writes of each processing activity (Art. 30(1)), as the table's insert shape. */
const ACTIVITY_FIELDS = Object.keys(processingActivityCreateSchema.shape);

/**
 * Everything the company recorded under the GDPR, for its export: the record of processing
 * activities with its controller, officer and security measures (Art. 30(1)), each supplier's
 * role, contract and transfers, the answers typed in each GDPR area, and the documents the GDPR
 * walk wrote with their approval. Every query is the company's.
 */
export async function loadGdprExport(db: Database, companyId: string) {
  const [co, controller, activities, suppliers, documents, assessment] =
    await Promise.all([
      db.query.company.findFirst({
        where: eq(company.id, companyId),
        columns: { name: true },
      }),
      controllerOf(db, companyId),
      activitiesOf(db, companyId),
      db.query.supplier.findMany({
        where: eq(supplier.customerCompanyId, companyId),
        columns: { name: true, ...columnsOf(GDPR_SUPPLIER_FIELDS) },
        orderBy: asc(supplier.name),
      }),
      walkPolicyRows(db, companyId, GDPR_WALK),
      assessmentOf(db, companyId, "gdpr"),
    ]);
  if (!co) throw new Error(`No company ${companyId}.`);

  const intakes = assessment
    ? await db
        .select({
          category: requirementCategory.code,
          answers: companyCategoryIntake.answers,
        })
        .from(companyCategoryIntake)
        .innerJoin(
          requirementCategory,
          eq(requirementCategory.id, companyCategoryIntake.categoryId),
        )
        .where(eq(companyCategoryIntake.assessmentId, assessment.id))
    : [];

  return {
    exportedAt: new Date(),
    company: co,
    controller,
    activities: activities.map(({ suppliers: receivers, ...activity }) => ({
      ...Object.fromEntries(
        ACTIVITY_FIELDS.map((field) => [field, Reflect.get(activity, field)]),
      ),
      suppliers: receivers.map(({ name, through }) => ({ name, through })),
    })),
    suppliers,
    /** What was typed in each GDPR area's fields, in the walk or on the requirement pages. */
    answers: Object.fromEntries(intakes.map((i) => [i.category, i.answers ?? {}])),
    documents,
  };
}

export type GdprExport = Awaited<ReturnType<typeof loadGdprExport>>;
