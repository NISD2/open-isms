import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import type { WalkLocale } from "@/lib/durchgang/types";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { company, user } from "@/schema";

/** What decides an account's language: the language its user chose, and its company's country. */
async function accountLanguage(
  db: Database,
  userId: string | null,
  companyId: string,
): Promise<{ readonly userLocale: string | null; readonly country: string | null }> {
  const [account, org] = await Promise.all([
    userId
      ? db.query.user.findFirst({ where: eq(user.id, userId), columns: { locale: true } })
      : undefined,
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { country: true },
    }),
  ]);
  return { userLocale: account?.locale ?? null, country: org?.country ?? null };
}

/**
 * The language default text is written in when a company's row is first created: the BSI 200-3
 * risk scales, the policy editors' defaults, and the notes, risks and documents the walk writes.
 * Those rows are then the company's own, edited in place, so the language is decided once, from
 * what the account chose.
 *
 * Reuses the account-language resolver (user.locale, then company.country, then German). The
 * defaults and the walk exist in German, English and Czech: an account that chose Czech, or one in
 * Czechia that chose nothing, gets Czech; every other language gets English.
 */
export async function seedLocale(
  db: Database,
  userId: string | null,
  companyId: string,
): Promise<WalkLocale> {
  const { userLocale, country } = await accountLanguage(db, userId, companyId);
  if (userLocale === "cs" || (userLocale === null && country?.toUpperCase() === "CZ")) return "cs";
  return resolveEmailLocale(userLocale, country) === "de" ? "de" : "en";
}
