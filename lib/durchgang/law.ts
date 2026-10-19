import type { DutyLaw, WalkLocale } from "./types";

/**
 * The provision a duty card rests on. NIS 2: the BSIG paragraph in German, the directive's article
 * otherwise, and the BSIG paragraph for a duty only the BSIG sets. GDPR: the regulation's article
 * in the reader's language, since it applies directly.
 */
export const dutyHref = (law: DutyLaw, locale: WalkLocale): string => {
  switch (law.act) {
    case "nis2":
      return locale === "de" || law.article === null
        ? `https://www.gesetze-im-internet.de/bsig_2025/__${law.bsig}.html`
        : `https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_${law.article}`;
    case "gdpr":
      return `https://eur-lex.europa.eu/eli/reg/2016/679/oj/${locale === "de" ? "deu" : "eng"}#art_${law.article}`;
    default:
      return law satisfies never;
  }
};
