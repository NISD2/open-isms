/**
 * A requirement's status in words: the journey's views and every export (the PDF report, the
 * complete export, the CSV) read this one vocabulary, so a requirement reads the same wherever the
 * company or its auditor sees it.
 */
import type { CoveredBy, WalkLocale } from "@/lib/durchgang";
import type { DotState } from "./journey-position";

/** The status words, one vocabulary per language so the views cannot drift apart. */
export const STATUS_WORDS: Record<
  WalkLocale,
  Record<DotState | "reviewed" | "notRequired", string> & {
    and: string;
    walkSigned: (codes: string) => string;
    walkAwaiting: (codes: string) => string;
  }
> = {
  en: {
    notRequired: "Not required by law",
    and: " and ",
    walkSigned: (codes) => `Signed off in the walkthrough with ${codes}`,
    walkAwaiting: (codes) => `In the walkthrough with ${codes}, awaiting sign-off`,
    reviewed: "Reviewed",
    signed: "Signed off",
    na: "Not applicable",
    awaiting: "Awaiting sign-off",
    started: "In progress",
    rejected: "Rejected",
    todo: "Open",
  },
  de: {
    notRequired: "Gesetzlich nicht gefordert",
    and: " und ",
    walkSigned: (codes) => `Im Durchgang mit ${codes} freigegeben`,
    walkAwaiting: (codes) => `Im Durchgang mit ${codes}, wartet auf Freigabe`,
    reviewed: "Geprüft",
    signed: "Freigegeben",
    na: "Nicht zutreffend",
    awaiting: "Wartet auf Freigabe",
    started: "In Arbeit",
    rejected: "Abgelehnt",
    todo: "Offen",
  },
  cs: {
    notRequired: "Zákon nevyžaduje",
    and: " a ",
    walkSigned: (codes) => `Schváleno v průvodci spolu s ${codes}`,
    walkAwaiting: (codes) => `V průvodci spolu s ${codes}, čeká na schválení`,
    reviewed: "Zkontrolováno",
    signed: "Schváleno",
    na: "Nevztahuje se",
    awaiting: "Čeká na schválení",
    started: "Rozpracováno",
    rejected: "Zamítnuto",
    todo: "Otevřené",
  },
};

/**
 * A requirement's status in words, from where the journey has it (`journeyStates`). `approved`
 * tells a reviewer's approval from a signature; where the state came from the walk or from no
 * statute asking for it, the label says so.
 */
export function requirementStatusLabel(
  req: {
    readonly state: DotState;
    readonly coveredBy: CoveredBy | null;
    readonly approved: boolean;
  },
  locale: WalkLocale,
): string {
  const words = STATUS_WORDS[locale];
  const { coveredBy } = req;
  if (coveredBy?.kind === "not_required") return words.notRequired;
  if (coveredBy?.kind === "walk") {
    const codes = coveredBy.codes.join(words.and);
    return req.state === "signed" ? words.walkSigned(codes) : words.walkAwaiting(codes);
  }
  if (req.state === "signed" && req.approved) return words.reviewed;
  return words[req.state];
}
