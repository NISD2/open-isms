import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DurchgangFlow } from "@/components/durchgang/DurchgangFlow";
import statuteJson from "@/data/law/bsig-2025.json";
import type { StepId } from "@/lib/compliance/guided-form/steps";
import { STEPS } from "@/lib/compliance/guided-form/steps";

/**
 * Design route for the opening of the Durchgang. Renders the real components with no database, the
 * same shape as `journey-preview`, so the flow can be clicked through and argued about before the
 * procedures behind it exist.
 *
 * Not served in production. The copy has not been through the primary-source fact-check gate, and
 * an unfinished claim about the law is the one thing this audience does not forgive.
 */
export const metadata: Metadata = {
  title: "Durchgang (Vorschau)",
  robots: { index: false, follow: false },
};

/**
 * One Absatz of a paragraph: from "(n)" to "(n+1)" or the end.
 *
 * Sliced on the server so the client is sent the two hundred words a step actually cites rather
 * than the thirty kilobytes of statute the file holds.
 */
const absatz = (norm: string, n: number): string => {
  const start = norm.indexOf(`(${n})`);
  if (start < 0) return norm;
  const end = norm.indexOf(`(${n + 1})`, start + 1);
  return (end < 0 ? norm.slice(start) : norm.slice(start, end)).trim();
};

/**
 * Which Absatz each step quotes. A step with no entry gets the whole paragraph, which is right for
 * the classification screen: it cites both Absatz 1 and Absatz 2 and the difference between them
 * is the answer.
 */
const ABSATZ: Readonly<Partial<Record<StepId, number>>> = {
  registration: 1,
};

const norms = statuteJson.norms as Readonly<Record<string, string>>;

const statutes = Object.fromEntries(
  STEPS.flatMap((s) => {
    const key = s.sidebar?.paragraphs[0];
    const text = key ? norms[key] : undefined;
    if (!text) return [];
    const n = ABSATZ[s.id];
    return [[s.id, n === undefined ? text : absatz(text, n)]];
  }),
) as Readonly<Partial<Record<StepId, string>>>;

export default function DurchgangPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="px-6 py-10">
      <DurchgangFlow statutes={statutes} />
    </main>
  );
}
