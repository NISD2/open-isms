import "@/lib/server-guard";
import { and, eq } from "drizzle-orm";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import type { DbOrTx } from "@/lib/db";
import { companyMembership, companyTwoFactor } from "@/schema";

/** Who makes a person use a second factor: the platform, one of their companies, or nobody. */
export type TwoFactorRequirement = "platform" | "company" | null;

/**
 * Platform admins always need it: their sign-in reaches every company. Everyone else needs it once
 * any company they belong to requires it (company_two_factor, an admin's switch).
 */
export async function twoFactorRequirement(
  db: DbOrTx,
  person: { readonly userId: string; readonly email: string },
): Promise<TwoFactorRequirement> {
  if (isPlatformAdmin(person.email)) return "platform";
  const [row] = await db
    .select({ companyId: companyTwoFactor.companyId })
    .from(companyMembership)
    .innerJoin(
      companyTwoFactor,
      eq(companyTwoFactor.companyId, companyMembership.companyId),
    )
    .where(
      and(
        eq(companyMembership.userId, person.userId),
        eq(companyTwoFactor.required, true),
      ),
    )
    .limit(1);
  return row ? "company" : null;
}

/** Whether this one company requires it, for its Settings switch. */
export async function companyRequiresTwoFactor(
  db: DbOrTx,
  companyId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ required: companyTwoFactor.required })
    .from(companyTwoFactor)
    .where(eq(companyTwoFactor.companyId, companyId))
    .limit(1);
  return row?.required ?? false;
}
