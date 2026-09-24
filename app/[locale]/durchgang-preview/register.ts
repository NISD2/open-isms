/**
 * The register the opening screens sort, built from the real framework data.
 *
 * The 49 items are read from `nis2.ts` and titled from the German message file, so the screen
 * cannot show a list the product does not have. Every one of them addresses every company today,
 * which is why the interview the engine was built around had almost nothing to do.
 *
 * The four that move are added here explicitly, with the paragraph each comes from. They are the
 * items the build plan's content slice puts into `nis2.ts` with an `addressee`, and they are real
 * statutory duties rather than examples: attack detection and the three-yearly evidence for
 * critical installations, the separate registration for the § 60 service types, and the threat
 * notification for the § 35 sectors. Until that slice lands they live here, in the preview only,
 * which is why this file sits under the preview route and not in `lib`.
 */

import {
  getNis2RequirementsForCategory,
  nis2Categories,
} from "@nisd2/grc-data-model/frameworks/nis2";
import type { RegisterItem } from "@/components/durchgang/DurchgangFlow";
import deRequirements from "@/messages/requirements/de.json";

/** The four status-bound duties, each named by the paragraph that creates it. */
const STATUS_BOUND: readonly RegisterItem[] = [
  {
    code: "31.2",
    title: "Systeme zur Angriffserkennung (§ 31 Abs. 2 BSIG)",
    addressee: "critical_installation",
  },
  {
    code: "39.1",
    title: "Nachweis gegenüber dem BSI alle drei Jahre (§ 39 Abs. 1 BSIG)",
    addressee: "critical_installation",
  },
  {
    code: "34.1",
    title: "Gesonderte Registrierung für die Anbieter aus § 60 Abs. 1 Satz 1 (§ 34 BSIG)",
    addressee: "service_type_60_1",
  },
  {
    code: "35.2",
    title: "Unterrichtung über erhebliche Cyberbedrohungen (§ 35 Abs. 2 BSIG)",
    addressee: "sector_35_2",
  },
];

const titles = (deRequirements as { requirements: Record<string, { title: string }> })
  .requirements;

export const buildRegister = (): readonly RegisterItem[] => {
  const existing = nis2Categories.flatMap((c) =>
    getNis2RequirementsForCategory(c.slug).map((r) => ({
      code: r.code,
      title: titles[r.code.replaceAll(".", "_")]?.title ?? r.code,
      addressee: "all" as const,
    })),
  );
  return [...existing, ...STATUS_BOUND];
};
