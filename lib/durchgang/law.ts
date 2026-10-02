import type { DutyLaw, WalkLocale } from "./types";

/** The provision a duty card rests on: the BSIG paragraph in German, the directive's article otherwise. */
export const dutyHref = (law: DutyLaw, locale: WalkLocale): string =>
  locale === "de"
    ? `https://www.gesetze-im-internet.de/bsig_2025/__${law.bsig}.html`
    : `https://eur-lex.europa.eu/eli/dir/2022/2555/oj/eng#art_${law.article}`;
