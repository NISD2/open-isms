/**
 * The Durchgang's words: one namespace, `durchgang`, stored in parts so no file outgrows what a
 * reader holds at once (scripts/check-file-size.ts). `ui-1` to `ui-3` hold the shared screen
 * texts, cut by size; `item-<code>` holds one walk item's. A new item's copy is a new part,
 * listed here once per language.
 *
 *   messages/durchgang/<part>/<locale>.json  { "durchgang": { ... } }
 *
 * Every reader takes the merged namespace from here: next-intl (i18n/request.ts), the walk's
 * router, the MCP tools, the export and the tests.
 */

import type { WalkLocale } from "@/lib/durchgang/types";
import item1_1Cs from "@/messages/durchgang/item-1_1/cs.json";
import item1_1De from "@/messages/durchgang/item-1_1/de.json";
import item1_1En from "@/messages/durchgang/item-1_1/en.json";
import item2_1Cs from "@/messages/durchgang/item-2_1/cs.json";
import item2_1De from "@/messages/durchgang/item-2_1/de.json";
import item2_1En from "@/messages/durchgang/item-2_1/en.json";
import item2_2Cs from "@/messages/durchgang/item-2_2/cs.json";
import item2_2De from "@/messages/durchgang/item-2_2/de.json";
import item2_2En from "@/messages/durchgang/item-2_2/en.json";
import item2_3Cs from "@/messages/durchgang/item-2_3/cs.json";
import item2_3De from "@/messages/durchgang/item-2_3/de.json";
import item2_3En from "@/messages/durchgang/item-2_3/en.json";
import item2_4Cs from "@/messages/durchgang/item-2_4/cs.json";
import item2_4De from "@/messages/durchgang/item-2_4/de.json";
import item2_4En from "@/messages/durchgang/item-2_4/en.json";
import item3_1Cs from "@/messages/durchgang/item-3_1/cs.json";
import item3_1De from "@/messages/durchgang/item-3_1/de.json";
import item3_1En from "@/messages/durchgang/item-3_1/en.json";
import item3_3Cs from "@/messages/durchgang/item-3_3/cs.json";
import item3_3De from "@/messages/durchgang/item-3_3/de.json";
import item3_3En from "@/messages/durchgang/item-3_3/en.json";
import item4_2Cs from "@/messages/durchgang/item-4_2/cs.json";
import item4_2De from "@/messages/durchgang/item-4_2/de.json";
import item4_2En from "@/messages/durchgang/item-4_2/en.json";
import item4_4Cs from "@/messages/durchgang/item-4_4/cs.json";
import item4_4De from "@/messages/durchgang/item-4_4/de.json";
import item4_4En from "@/messages/durchgang/item-4_4/en.json";
import item5_1Cs from "@/messages/durchgang/item-5_1/cs.json";
import item5_1De from "@/messages/durchgang/item-5_1/de.json";
import item5_1En from "@/messages/durchgang/item-5_1/en.json";
import item5_2Cs from "@/messages/durchgang/item-5_2/cs.json";
import item5_2De from "@/messages/durchgang/item-5_2/de.json";
import item5_2En from "@/messages/durchgang/item-5_2/en.json";
import item6_3Cs from "@/messages/durchgang/item-6_3/cs.json";
import item6_3De from "@/messages/durchgang/item-6_3/de.json";
import item6_3En from "@/messages/durchgang/item-6_3/en.json";
import item7_3Cs from "@/messages/durchgang/item-7_3/cs.json";
import item7_3De from "@/messages/durchgang/item-7_3/de.json";
import item7_3En from "@/messages/durchgang/item-7_3/en.json";
import item8_2Cs from "@/messages/durchgang/item-8_2/cs.json";
import item8_2De from "@/messages/durchgang/item-8_2/de.json";
import item8_2En from "@/messages/durchgang/item-8_2/en.json";
import item9_1Cs from "@/messages/durchgang/item-9_1/cs.json";
import item9_1De from "@/messages/durchgang/item-9_1/de.json";
import item9_1En from "@/messages/durchgang/item-9_1/en.json";
import item10_1Cs from "@/messages/durchgang/item-10_1/cs.json";
import item10_1De from "@/messages/durchgang/item-10_1/de.json";
import item10_1En from "@/messages/durchgang/item-10_1/en.json";
import item11_1Cs from "@/messages/durchgang/item-11_1/cs.json";
import item11_1De from "@/messages/durchgang/item-11_1/de.json";
import item11_1En from "@/messages/durchgang/item-11_1/en.json";
import item11_2Cs from "@/messages/durchgang/item-11_2/cs.json";
import item11_2De from "@/messages/durchgang/item-11_2/de.json";
import item11_2En from "@/messages/durchgang/item-11_2/en.json";
import item12_2Cs from "@/messages/durchgang/item-12_2/cs.json";
import item12_2De from "@/messages/durchgang/item-12_2/de.json";
import item12_2En from "@/messages/durchgang/item-12_2/en.json";
import item12_3Cs from "@/messages/durchgang/item-12_3/cs.json";
import item12_3De from "@/messages/durchgang/item-12_3/de.json";
import item12_3En from "@/messages/durchgang/item-12_3/en.json";
import item12_4Cs from "@/messages/durchgang/item-12_4/cs.json";
import item12_4De from "@/messages/durchgang/item-12_4/de.json";
import item12_4En from "@/messages/durchgang/item-12_4/en.json";
import ui1Cs from "@/messages/durchgang/ui-1/cs.json";
import ui1De from "@/messages/durchgang/ui-1/de.json";
import ui1En from "@/messages/durchgang/ui-1/en.json";
import ui2Cs from "@/messages/durchgang/ui-2/cs.json";
import ui2De from "@/messages/durchgang/ui-2/de.json";
import ui2En from "@/messages/durchgang/ui-2/en.json";
import ui3Cs from "@/messages/durchgang/ui-3/cs.json";
import ui3De from "@/messages/durchgang/ui-3/de.json";
import ui3En from "@/messages/durchgang/ui-3/en.json";
import walksCs from "@/messages/durchgang/walks/cs.json";
import walksDe from "@/messages/durchgang/walks/de.json";
import walksEn from "@/messages/durchgang/walks/en.json";

const PARTS: Readonly<Record<WalkLocale, readonly unknown[]>> = {
  de: [
    ui1De,
    ui2De,
    ui3De,
    walksDe,
    item1_1De,
    item2_1De,
    item2_2De,
    item2_3De,
    item2_4De,
    item3_1De,
    item3_3De,
    item4_2De,
    item4_4De,
    item5_1De,
    item5_2De,
    item6_3De,
    item7_3De,
    item8_2De,
    item9_1De,
    item10_1De,
    item11_1De,
    item11_2De,
    item12_2De,
    item12_3De,
    item12_4De,
  ],
  en: [
    ui1En,
    ui2En,
    ui3En,
    walksEn,
    item1_1En,
    item2_1En,
    item2_2En,
    item2_3En,
    item2_4En,
    item3_1En,
    item3_3En,
    item4_2En,
    item4_4En,
    item5_1En,
    item5_2En,
    item6_3En,
    item7_3En,
    item8_2En,
    item9_1En,
    item10_1En,
    item11_1En,
    item11_2En,
    item12_2En,
    item12_3En,
    item12_4En,
  ],
  cs: [
    ui1Cs,
    ui2Cs,
    ui3Cs,
    walksCs,
    item1_1Cs,
    item2_1Cs,
    item2_2Cs,
    item2_3Cs,
    item2_4Cs,
    item3_1Cs,
    item3_3Cs,
    item4_2Cs,
    item4_4Cs,
    item5_1Cs,
    item5_2Cs,
    item6_3Cs,
    item7_3Cs,
    item8_2Cs,
    item9_1Cs,
    item10_1Cs,
    item11_1Cs,
    item11_2Cs,
    item12_2Cs,
    item12_3Cs,
    item12_4Cs,
  ],
};

/**
 * The merged namespace's shape. Each part holds its own keys, so the parts' types together are
 * the whole; the English parts stand for every language, whose files have the same keys.
 */
export type DurchgangMessages = typeof ui1En &
  typeof ui2En &
  typeof ui3En &
  typeof walksEn &
  typeof item1_1En &
  typeof item2_1En &
  typeof item2_2En &
  typeof item2_3En &
  typeof item2_4En &
  typeof item3_1En &
  typeof item3_3En &
  typeof item4_2En &
  typeof item4_4En &
  typeof item5_1En &
  typeof item5_2En &
  typeof item6_3En &
  typeof item7_3En &
  typeof item8_2En &
  typeof item9_1En &
  typeof item10_1En &
  typeof item11_1En &
  typeof item11_2En &
  typeof item12_2En &
  typeof item12_3En &
  typeof item12_4En;

type Messages = Record<string, unknown>;

const isRecord = (value: unknown): value is Messages =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Parts hold disjoint keys, so merging them is a union at every depth. */
const merge = (a: Messages, b: Messages): Messages =>
  Object.entries(b).reduce<Messages>((out, [key, value]) => {
    const here = out[key];
    return {
      ...out,
      [key]: isRecord(here) && isRecord(value) ? merge(here, value) : value,
    };
  }, a);

/**
 * A merge of JSON loses its static type, so the result is asserted to the parts' shape. The
 * tests parse every language's merged copy (lib/durchgang/nis2.test.ts), which is what holds it.
 */
const mergedOf = (parts: readonly unknown[]): DurchgangMessages =>
  parts.filter(isRecord).reduce<Messages>(merge, {}) as DurchgangMessages;

/** The `durchgang` namespace per language, as one file per language used to hold it. */
export const DURCHGANG_MESSAGES: Readonly<Record<WalkLocale, DurchgangMessages>> = {
  de: mergedOf(PARTS.de),
  en: mergedOf(PARTS.en),
  cs: mergedOf(PARTS.cs),
};
