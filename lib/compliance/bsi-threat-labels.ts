/**
 * The BSI elementary threats and their categories named in the reader's language. The catalogue is
 * a German method (IT-Grundschutz) and keeps its G 0.x codes; the Czech names follow the words of
 * příloha č. 3 vyhlášky č. 409/2025 Sb. where it names the same threat (škodlivý kód, zneužití
 * oprávnění, sociální inženýrství).
 */
import { pickLocalized } from "@/lib/locale";
import { BSI_THREAT_CATEGORIES, type BsiThreat } from "./bsi-threats";

const THREAT_CS: Readonly<Record<string, string>> = {
  "G 0.1": "Požár",
  "G 0.2": "Nepříznivé klimatické podmínky",
  "G 0.3": "Voda",
  "G 0.4": "Znečištění, prach, koroze",
  "G 0.5": "Přírodní katastrofy",
  "G 0.6": "Katastrofy v okolí",
  "G 0.7": "Velké akce v okolí",
  "G 0.8": "Výpadek nebo narušení dodávky elektrické energie",
  "G 0.9": "Výpadek nebo narušení komunikačních sítí",
  "G 0.10": "Výpadek nebo narušení zásobovacích sítí",
  "G 0.11": "Výpadek nebo narušení služeb poskytovatelů",
  "G 0.12": "Elektromagnetické rušení",
  "G 0.13": "Zachycení kompromitujícího vyzařování",
  "G 0.14": "Vyzvídání informací (špionáž)",
  "G 0.15": "Odposlech",
  "G 0.16": "Krádež zařízení, datových nosičů nebo dokumentů",
  "G 0.17": "Ztráta zařízení, datových nosičů nebo dokumentů",
  "G 0.18": "Chybné plánování nebo chybějící přizpůsobení",
  "G 0.19": "Vyzrazení citlivých informací",
  "G 0.20": "Informace nebo produkty z nespolehlivého zdroje",
  "G 0.21": "Manipulace s hardwarem nebo softwarem",
  "G 0.22": "Manipulace s informacemi",
  "G 0.23": "Neoprávněný průnik do IT systémů",
  "G 0.24": "Zničení zařízení nebo datových nosičů",
  "G 0.25": "Výpadek zařízení nebo systémů",
  "G 0.26": "Chybná funkce zařízení nebo systémů",
  "G 0.27": "Nedostatek zdrojů",
  "G 0.28": "Zranitelnosti nebo chyby softwaru",
  "G 0.29": "Porušení zákonů nebo předpisů",
  "G 0.30": "Neoprávněné používání nebo správa zařízení a systémů",
  "G 0.31": "Chybné používání nebo správa zařízení a systémů",
  "G 0.32": "Zneužití oprávnění",
  "G 0.33": "Výpadek personálu",
  "G 0.34": "Násilný útok",
  "G 0.35": "Nátlak, vydírání nebo korupce",
  "G 0.36": "Krádež identity",
  "G 0.37": "Popírání provedených činností",
  "G 0.38": "Zneužití osobních údajů",
  "G 0.39": "Škodlivý kód",
  "G 0.40": "Odepření služby (Denial of Service)",
  "G 0.41": "Sabotáž",
  "G 0.42": "Sociální inženýrství",
  "G 0.43": "Podvržení nebo opakované přehrání zpráv",
  "G 0.44": "Neoprávněné vniknutí do prostor",
  "G 0.45": "Ztráta dat",
  "G 0.46": "Narušení integrity citlivých informací",
  "G 0.47": "Škodlivé vedlejší účinky útoků vedených pomocí IT",
};

/** The categories in the catalogue's own order, typed as the category a threat carries. */
export const THREAT_CATEGORIES = Object.keys(
  BSI_THREAT_CATEGORIES,
) as readonly BsiThreat["category"][];

const CATEGORY_CS: Readonly<Record<BsiThreat["category"], string>> = {
  physical: "Fyzické / prostředí",
  infrastructure: "Infrastruktura",
  cyber: "Kybernetické / IT",
  organizational: "Organizační",
  human: "Lidský faktor",
};

/** A threat's name in the page language: German, Czech, else English. */
export const threatLabel = (threat: BsiThreat, locale: string): string =>
  pickLocalized<string>(
    { de: threat.labelDe, en: threat.labelEn, cs: THREAT_CS[threat.code] },
    locale,
  );

/** A threat category's name in the page language: German, Czech, else English. */
export const threatCategoryLabel = (
  category: BsiThreat["category"],
  locale: string,
): string =>
  pickLocalized<string>(
    {
      de: BSI_THREAT_CATEGORIES[category].labelDe,
      en: BSI_THREAT_CATEGORIES[category].labelEn,
      cs: CATEGORY_CS[category],
    },
    locale,
  );
