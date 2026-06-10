"use client";

import { useLocale } from "next-intl";

interface SectionHeaderProps {
  ref: string;
  title: string;
  titleEn?: string;
  meta?: string;
  metaEn?: string;
}

export function SectionHeader({
  ref: refCode,
  title,
  titleEn,
  meta,
  metaEn,
}: SectionHeaderProps) {
  const locale = useLocale();
  const isEn = locale === "en";
  const displayTitle = isEn && titleEn ? titleEn : title;
  const displayMeta = isEn && metaEn ? metaEn : meta;
  return (
    <div className="flex items-baseline justify-between">
      <div className="flex items-baseline gap-3">
        <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs font-medium tracking-wide text-muted-foreground">
          {refCode}
        </span>
        <h2 className="text-xl font-semibold tracking-tight">{displayTitle}</h2>
      </div>
      {displayMeta && <span className="text-sm text-muted-foreground">{displayMeta}</span>}
    </div>
  );
}
