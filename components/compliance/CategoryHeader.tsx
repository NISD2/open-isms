"use client";

import { useTranslations } from "next-intl";
import { ComplianceProgress, type RequirementSegment } from "./ComplianceProgress";
import { ExternalLink } from "lucide-react";

interface CategoryHeaderProps {
  name: string;
  slug: string;
  segments: RequirementSegment[];
  legalBasis?: string | null;
  /** Framework's primary source URL (EUR-Lex / iso.org / etc.). */
  referenceUrl?: string | null;
  /** National transposition URL if any (e.g. BSIG for NIS 2 in DE). */
  nationalUrl?: string | null;
}

export function CategoryHeader({
  name,
  slug,
  segments,
  legalBasis,
  referenceUrl,
  nationalUrl,
}: CategoryHeaderProps) {
  const t = useTranslations("compliance");

  const desc = t.has(`categories.${slug}`) ? t(`categories.${slug}`) : null;

  // Split legalBasis "Art. 20 NIS2 · §38 BSIG" into framework part and national part.
  // For non-NIS2 frameworks the second half is usually absent.
  const [frameworkPart, nationalPart] = legalBasis?.split(" · ") ?? [];

  return (
    <div className="space-y-4 pb-6 border-b">
      <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
      {desc && (
        <p className="text-sm text-muted-foreground max-w-2xl">{desc}</p>
      )}
      {legalBasis && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {frameworkPart && referenceUrl ? (
            <a
              href={referenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {frameworkPart}
            </a>
          ) : frameworkPart ? (
            <span>{frameworkPart}</span>
          ) : null}
          {nationalPart && nationalUrl ? (
            <a
              href={nationalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              {nationalPart}
            </a>
          ) : nationalPart ? (
            <span>{nationalPart}</span>
          ) : null}
        </div>
      )}
      <ComplianceProgress segments={segments} />
    </div>
  );
}
