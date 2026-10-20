import { useTranslations } from "next-intl";
import type { WalkFramework } from "@/lib/durchgang";

/** The portal's name for each walk's framework (`portal` messages), so a badge reads as the menu does. */
const PORTAL_KEY = { nis2: "nis2", gdpr: "dsgvo" } as const satisfies Record<
  WalkFramework,
  string
>;

/** A small tag naming the law a role, a document or an approval belongs to. */
export function FrameworkBadge({ framework }: { framework: WalkFramework }) {
  const t = useTranslations("portal");
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/[0.06] px-2 py-0.5 text-xs font-medium text-primary">
      {t(PORTAL_KEY[framework])}
    </span>
  );
}
