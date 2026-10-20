import "@/lib/server-guard";
import type { WalkPerson } from "@/components/organization/WalkPeople";
import { getSession } from "@/lib/auth";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { db } from "@/lib/db";
import { dpoOf, itemsFor, personFieldsOf, WALKS } from "@/lib/durchgang";
import { api } from "@/lib/trpc/server";
import { answersOf, DPO_ITEM } from "@/server/trpc/helpers/durchgang-policy";
import { ensureAssessment } from "@/server/trpc/helpers/framework-assessment";
import { wordsOf } from "./steps";

/**
 * Everyone the company's walks name for a role, in walk order: the incident lead, the data
 * protection officer, who takes charge of a breach, who answers requests. Each with the answer as
 * the step stores it and what saving it there takes, so the Organisation page changes the same
 * answer. Only the steps the caller may see.
 */
export async function loadWalkPeople(): Promise<readonly WalkPerson[]> {
  const [session, company] = await Promise.all([
    getSession(),
    api.assessment.getCompany(),
  ]);
  if (!session?.companyId || !company) return [];
  const { companyId } = session;
  const perWalk = await Promise.all(
    Object.values(WALKS).map(async (walk) => {
      const walked = new Set(itemsFor(walk, company).map((i) => i.code));
      const fields = personFieldsOf(walk).filter((p) => walked.has(p.code));
      if (fields.length === 0) return [];
      const assessmentId = await ensureAssessment(db, companyId, walk.framework);
      const access = await getUserAccess(assessmentId, session.user.id, session.role);
      const rows = await Promise.all(
        fields.map(async ({ code, field, at }) => {
          const item = walk.items.find((i) => i.code === code);
          const [req, answers, words] = await Promise.all([
            api.requirement.getByCode({ code }),
            answersOf(db, companyId, code),
            item ? wordsOf(item) : null,
          ]);
          const screen = words?.screens[at];
          const copy =
            screen?.kind === "fields"
              ? screen.copy.fields.find((f) => f.key === field)
              : undefined;
          if (
            !req?.category ||
            !copy ||
            !words ||
            !canSeeCategory(access, req.category.id)
          )
            return [];
          const value = answers[field];
          return [
            {
              framework: walk.framework,
              code,
              at,
              field,
              label: copy.label,
              headline: words.headline,
              other: copy.other ?? null,
              value: typeof value === "string" && value.trim() !== "" ? value : null,
              // A company that designates no DPO names nobody; the walk changes that decision.
              none: code === DPO_ITEM && dpoOf(answers).kind === "none",
              assessmentId,
              categoryId: req.category.id,
            } satisfies WalkPerson,
          ];
        }),
      );
      return rows.flat();
    }),
  );
  return perWalk.flat();
}
