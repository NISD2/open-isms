/**
 * What the two digests share between their React Email markup and their plain-text twin: the
 * shapes they are given, the tracked links, and the payoff line.
 */
import type { WorkflowMailLocale } from "./locale";

export interface DigestItem {
  requirementCode: string;
  requirementTitle: string;
  deadline: string;
  daysRemaining: number;
  urgency: "info" | "warning" | "urgent" | "critical";
  categoryUrl: string;
}

/**
 * The reader's next open step on the journey, in the path view's order.
 * Every digest carries it so the mail always ends on a concrete action:
 * either "these reviews are overdue" or "this is next up", never a bare
 * count with nothing to do about it. The progress numbers feed the payoff
 * line; assigneeName is for the management digest's "who owns it".
 */
export interface DigestNextStep {
  requirementCode: string;
  requirementTitle: string;
  url: string;
  /** Journey-wide progress: steps done of total. */
  done: number;
  total: number;
  categoryName: string;
  categoryDone: number;
  categoryTotal: number;
  /** First assigned owner of the step; null when nobody is assigned yet. */
  assigneeName: string | null;
}

export type DigestCampaign = "daily_digest" | "weekly_management_digest";

/**
 * utm_* tags on digest links so Umami can attribute return visits to the
 * digest that caused them. The requirement deep links end in a #<code>
 * fragment, and the fragment must stay last, so the query is spliced in
 * before it.
 */
export function withUtm(url: string, campaign: DigestCampaign): string {
  const [base, fragment] = url.split("#");
  const sep = base.includes("?") ? "&" : "?";
  const tagged = `${base}${sep}utm_source=email&utm_medium=digest&utm_campaign=${campaign}`;
  return fragment ? `${tagged}#${fragment}` : tagged;
}

const PERCENT: Record<WorkflowMailLocale, (pct: string) => string> = {
  en: (pct) => `${pct}%`,
  cs: (pct) => `${pct.replace(".", ",")} %`,
};

/** A percentage string such as "42.0" the way the reader writes it: "42.0%", or "42,0 %" in Czech. */
export const formatPercent = (pct: string, locale: WorkflowMailLocale): string =>
  PERCENT[locale](pct);

const PAYOFF: Record<
  WorkflowMailLocale,
  {
    readonly completes: (s: DigestNextStep) => string;
    readonly moves: (s: DigestNextStep) => string;
    readonly line: (s: DigestNextStep, categoryPart: string) => string;
  }
> = {
  en: {
    completes: (s) => `completes ${s.categoryName}`,
    moves: (s) =>
      `moves ${s.categoryName} to ${s.categoryDone + 1} of ${s.categoryTotal}`,
    line: (s, categoryPart) =>
      `You are at ${s.done} of ${s.total} steps. Finishing ${s.requirementCode} makes it ${s.done + 1} and ${categoryPart}.`,
  },
  cs: {
    completes: (s) => `dokončí oblast ${s.categoryName}`,
    moves: (s) =>
      `oblast ${s.categoryName} na ${s.categoryDone + 1} z celkem ${s.categoryTotal}`,
    line: (s, categoryPart) =>
      `Máte hotovo ${s.done} z celkem ${s.total} kroků. Krok ${s.requirementCode} vás posune na ${s.done + 1} a ${categoryPart}.`,
  },
};

/**
 * What completing the next step does to the numbers the reader already
 * owns. When it is the category's last open step, say so: "completes
 * Registration" pulls harder than another fraction.
 */
export function payoffLine(nextStep: DigestNextStep, locale: WorkflowMailLocale): string {
  const copy = PAYOFF[locale];
  const categoryLeft = nextStep.categoryTotal - nextStep.categoryDone;
  const categoryPart =
    categoryLeft === 1 ? copy.completes(nextStep) : copy.moves(nextStep);
  return copy.line(nextStep, categoryPart);
}
