import type { SignedWording } from "@nisd2/isms-schema/tables/sign-off-history";
import { eq } from "drizzle-orm";
import type { DbOrTx } from "@/lib/db";
import { resolveContentLocale } from "@/lib/mail/locale";
import {
  getRequirementDescription,
  getRequirementsMessages,
  getRequirementTitle,
} from "@/lib/messages";
import { company, requirement, user } from "@/schema";

/**
 * The requirement's wording as the signer reads it at the moment of signing: its title and
 * description in their language (their account's, else their company's country), and its
 * citations. Recorded with every sign-off, so what was signed is known after the text changes.
 */
export async function signedWording(
  db: DbOrTx,
  args: {
    readonly requirementId: string;
    readonly signerId: string;
    readonly companyId: string;
  },
): Promise<SignedWording> {
  const [req, signer, org] = await Promise.all([
    db.query.requirement.findFirst({
      where: eq(requirement.id, args.requirementId),
      columns: { code: true, legalRef: true, frameworkRef: true, cirReference: true },
    }),
    db.query.user.findFirst({
      where: eq(user.id, args.signerId),
      columns: { locale: true },
    }),
    db.query.company.findFirst({
      where: eq(company.id, args.companyId),
      columns: { country: true },
    }),
  ]);
  if (!req) throw new Error(`requirement ${args.requirementId} not found`);
  const locale = resolveContentLocale(signer?.locale ?? null, org?.country ?? null);
  const messages = await getRequirementsMessages(locale);
  return {
    code: req.code,
    locale,
    title: getRequirementTitle(messages, req.code),
    description: getRequirementDescription(messages, req.code),
    legalRef: req.legalRef,
    frameworkRef: req.frameworkRef,
    cirReference: req.cirReference,
  };
}
