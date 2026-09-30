import { eq } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { resolveEmailLocale } from "@/lib/mail/locale";
import { company, user } from "@/schema";

/**
 * The language default text is written in when a company's row is first created: the BSI 200-3
 * risk scales, the policy editors' defaults. Those rows are then the company's own, edited in place,
 * so the language is decided once, from what the account chose.
 *
 * Reuses the account-language resolver (user.locale, then company.country, then German). The
 * defaults exist only in German and English, so every other language gets English.
 */
export async function seedLocale(
  db: Database,
  userId: string | null,
  companyId: string,
): Promise<"de" | "en"> {
  const [account, org] = await Promise.all([
    userId
      ? db.query.user.findFirst({ where: eq(user.id, userId), columns: { locale: true } })
      : undefined,
    db.query.company.findFirst({
      where: eq(company.id, companyId),
      columns: { country: true },
    }),
  ]);
  return resolveEmailLocale(account?.locale ?? null, org?.country ?? null) === "de"
    ? "de"
    : "en";
}
