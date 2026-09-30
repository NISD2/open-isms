import { existsSync } from "node:fs";
import path from "node:path";
import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import guidanceDe from "@/data/guidance/de.json";
import type { GuidanceFile } from "@/lib/ai/guidance-types";
import { buildCitationRows } from "@/lib/compliance/citations";
import { stepKey } from "@/lib/compliance/durchgang";
import { legislation } from "@/lib/content/citations";
import requirementsDe from "@/messages/requirements/de.json";
import { DurchgangPreview } from "./DurchgangPreview";
import {
  type Citation,
  type PreviewItem,
  type PreviewScreen,
  SCRIPT,
  type ScriptItem,
  type ScriptScreen,
  type Term,
} from "./script";

/**
 * Design route for the one-thing-at-a-time Durchgang. No auth, no database: the screen script is resolved against the same sources the requirement page reads
 * (framework definition, guidance file, glossary, citation rows), so what renders is real data in
 * the new shell. German only, three items, not served in production.
 */
export const metadata: Metadata = {
  title: "Durchgang (Vorschau)",
  robots: { index: false, follow: false },
};

const guidance = guidanceDe as GuidanceFile;
const requirementTexts = requirementsDe.requirements as Record<string, { title: string }>;

const CIR = legislation("cir-2024-2690");

const imageFor = (code: string): string | null => {
  const file = `/images/durchgang/${stepKey(code)}.svg`;
  return existsSync(path.join(process.cwd(), "public", file)) ? file : null;
};

const withFieldGuidance = (code: string, screen: ScriptScreen): PreviewScreen => {
  if (screen.kind !== "fields") return screen;
  const fieldGuidance = guidance[code]?.fields ?? {};
  return {
    ...screen,
    fields: screen.fields.map((field) => ({
      ...field,
      meaning: fieldGuidance[field.key]?.meaning ?? null,
      whereToFind: fieldGuidance[field.key]?.whereToFind ?? null,
    })),
  };
};

export default async function DurchgangPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const [tInfo, tPortal] = await Promise.all([
    getTranslations({ locale: "de", namespace: "info" }),
    getTranslations({ locale: "de", namespace: "portal" }),
  ]);

  const glossaryTerm = (key: string): Term => ({
    term: tInfo(`glossary.terms.${key}.term`),
    definition: tInfo(`glossary.terms.${key}.definition`),
    source: tInfo.has(`glossary.terms.${key}.legalRef`)
      ? tInfo(`glossary.terms.${key}.legalRef`)
      : null,
  });

  const resolve = (item: ScriptItem): PreviewItem => {
    const category = nis2Categories.find((c) => c.slug === item.categorySlug);
    const requirement = getNis2RequirementsForCategory(item.categorySlug).find(
      (r) => r.code === item.code,
    );
    if (!category || !requirement)
      throw new Error(`Durchgang preview: ${item.code} is not in the NIS 2 framework`);

    const lawRows: Citation[] = buildCitationRows({
      frameworkCode: "nis2",
      frameworkRef: requirement.frameworkRef,
      legalRef: requirement.legalRef,
      referenceUrl: category.referenceUrl,
      nationalUrl: category.nationalUrl,
    }).map((row) => ({
      label: row.label.kind === "message" ? tPortal(row.label.key) : row.label.text,
      citation: row.citation,
      href: row.href,
      note: null,
    }));
    const cirRow: Citation[] = requirement.cirReference
      ? [
          {
            label: "CIR 2024/2690",
            citation: `Anhang ${requirement.cirReference}`,
            href: CIR.url,
            note: "Gilt unmittelbar nur für bestimmte digitale Dienste (Art. 1). Für andere Unternehmen ein Maßstab.",
          },
        ]
      : [];

    return {
      code: item.code,
      section: item.section,
      headline: item.headline,
      teaser: item.teaser,
      overlooked: item.overlooked,
      title: requirementTexts[stepKey(item.code)]?.title ?? item.headline,
      image: imageFor(item.code),
      statuteHref: category.nationalUrl || null,
      citations: [...lawRows, ...cirRow],
      terms: [...item.glossary.map(glossaryTerm), ...item.extraTerms],
      screens: item.screens.map((screen) => withFieldGuidance(item.code, screen)),
    };
  };

  return <DurchgangPreview items={SCRIPT.map(resolve)} />;
}
