import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { type WalkLocale, walkLocaleOf } from "@/lib/durchgang/types";
import { resolveContentLocale } from "@/lib/mail/locale";
import { company, user } from "@/schema";

/**
 * The walk's language for what an account chose: the account-language resolver (user.locale, then
 * company.country, then German), narrowed to the languages the defaults and the walk are written
 * in. Czech stays Czech, German German, every other language gets English.
 */
export const seedLocaleOf = (
  userLocale: string | null,
  country: string | null,
): WalkLocale => walkLocaleOf(resolveContentLocale(userLocale, country));

/**
 * The language default text is written in when a company's row is first created: the BSI 200-3
 * risk scales, the policy editors' defaults, and the notes, risks and documents the walk writes.
 * Those rows are then the company's own, edited in place, so the language is decided once, from
 * what the account chose.
 */
export async function seedLocale(
  db: Database,
  userId: string | null,
  companyId: string,
): Promise<WalkLocale> {
  const [account, org] = await Promise.all([
    userId
      ? db.query.user.findFirst({ where: eq(user.id, userId), columns: { locale: true } })
      : undefined,
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { country: true },
    }),
  ]);
  return seedLocaleOf(account?.locale ?? null, org?.country ?? null);
}
