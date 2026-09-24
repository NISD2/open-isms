import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DurchgangFlow } from "@/components/durchgang/DurchgangFlow";
import guidanceDe from "@/data/guidance/de.json";
import statuteJson from "@/data/law/bsig-2025.json";
import { itemContent, journeyItems } from "@/lib/compliance/guided-form/journey";
import { buildTemplates, expand, type Row } from "@/lib/compliance/guided-form/steps";
import requirementsDe from "@/messages/requirements/de.json";

/**
 * Design route for the Durchgang. Renders the real journey with no database, the same shape as
 * `journey-preview`, so the flow can be clicked through before the procedures behind it exist.
 *
 * Not served in production: the copy has not been through the primary-source fact-check gate, and
 * an unfinished claim about the law is the one thing this audience does not forgive.
 *
 * `?rows=N` fills every register with N fake rows. That is the point of the page as much as the
 * screens are: the journey is 106 screens for a company with nothing in its registers and 535 for
 * one with forty suppliers and forty assets, because a per-row requirement costs rows x fields.
 */
export const metadata: Metadata = {
  title: "Durchgang (Vorschau)",
  robots: { index: false, follow: false },
};

const norms = statuteJson.norms as Readonly<Record<string, string>>;

const isDigit = (c: string | undefined): boolean =>
  c !== undefined && c >= "0" && c <= "9";

/**
 * The statute an item cites, matched from its own `legalRef` rather than a second hand-kept map.
 *
 * Matched by exact containment rather than by a pattern. `legalRef` is prose written by hand
 * ("§30(2) Nr. 1 BSIG, CIR 2.1.2"), and a pattern that half-understands it would quote the reader
 * the wrong law, which on this product is the worst defect available. So: try each paragraph we
 * actually vendored, in both spellings, and require that the number is not the prefix of a longer
 * one. Anything that does not resolve exactly shows no statute panel at all.
 *
 * The whole paragraph is shown rather than a single Absatz. Slicing to "(2)" would be a second
 * guess about the same string, and the panel scrolls.
 */
const statuteFor = (legalRef: string | null): string | null => {
  if (!legalRef) return null;
  for (const [key, text] of Object.entries(norms)) {
    const number = key.slice(1).trim();
    for (const spelling of [`§ ${number}`, `§${number}`]) {
      const at = legalRef.indexOf(spelling);
      if (at < 0) continue;
      if (isDigit(legalRef[at + spelling.length])) continue;
      return text;
    }
  }
  return null;
};

/** Fake rows, so the register-backed items can be walked. Labelled as fake on the screen. */
const fakeRows =
  (count: number) =>
  (module: string): readonly Row[] =>
    Array.from({ length: count }, (_, i) => ({
      id: `${module}-${i + 1}`,
      label: `Beispiel ${i + 1}`,
    }));

export default async function DurchgangPreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const raw = Array.isArray(params.rows) ? params.rows[0] : params.rows;
  const rows = Math.min(Math.max(Number(raw ?? 0) || 0, 0), 50);

  const screens = expand(buildTemplates(journeyItems()), fakeRows(rows));
  const content = itemContent(
    (
      requirementsDe as {
        requirements: Record<string, { title?: string; description?: string }>;
      }
    ).requirements,
    guidanceDe as Record<
      string,
      { summary?: string; applicability?: string; quickTip?: string }
    >,
  );

  const statutes = Object.fromEntries(
    [...content.values()].flatMap((c) => {
      const text = statuteFor(c.legalRef);
      return text ? [[c.code, text] as const] : [];
    }),
  );

  return (
    <main className="px-6 py-10">
      <DurchgangFlow
        screens={screens}
        content={Object.fromEntries(content)}
        statutes={statutes}
        fieldHelp={{}}
        startAt={Array.isArray(params.at) ? params.at[0] : params.at}
      />
    </main>
  );
}
