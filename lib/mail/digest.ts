/**
 * What the two digests share between their React Email markup and their plain-text twin: the
 * shapes they are given, the tracked links, and the payoff line.
 */

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

/**
 * What completing the next step does to the numbers the reader already
 * owns. When it is the category's last open step, say so: "completes
 * Registration" pulls harder than another fraction.
 */
export function payoffLine(nextStep: DigestNextStep): string {
  const categoryLeft = nextStep.categoryTotal - nextStep.categoryDone;
  const categoryPart =
    categoryLeft === 1
      ? `completes ${nextStep.categoryName}`
      : `moves ${nextStep.categoryName} to ${nextStep.categoryDone + 1} of ${nextStep.categoryTotal}`;
  return `You are at ${nextStep.done} of ${nextStep.total} steps. Finishing ${nextStep.requirementCode} makes it ${nextStep.done + 1} and ${categoryPart}.`;
}
