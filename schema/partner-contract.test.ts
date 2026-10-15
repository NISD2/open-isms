/**
 * The database decides which translations an acceptance may record (the
 * partner_contract_signed_reading CHECK, migration 0026), and the app decides which ones it offers
 * (CONTRACT_TRANSLATION_LOCALES). A language added to the second and not to the first would fail
 * at accept with a CHECK violation; this fails first.
 */
import { describe, expect, test } from "bun:test";
import { getTableConfig, PgDialect } from "drizzle-orm/pg-core";
import {
  BINDING_CONTRACT_LOCALE,
  CONTRACT_TRANSLATION_LOCALES,
} from "@/lib/legal/contract-language";
import { partnerContract } from "@/schema";

const checkSql = (name: string): string => {
  const check = getTableConfig(partnerContract).checks.find((c) => c.name === name);
  if (!check) throw new Error(`no CHECK named ${name} on partner_contract`);
  return new PgDialect().sqlToQuery(check.value).sql;
};

describe("partner_contract_signed_reading", () => {
  test("allows exactly the translations the app offers, over the binding English text", () => {
    const translations = CONTRACT_TRANSLATION_LOCALES.map((locale) => `'${locale}'`).join(
      ", ",
    );
    expect(checkSql("partner_contract_signed_reading")).toContain(
      `"partner_contract"."locale" = '${BINDING_CONTRACT_LOCALE}' and ` +
        `"partner_contract"."signed_reading_locale" in (${translations})`,
    );
  });
});
