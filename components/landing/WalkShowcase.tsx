import { getTranslations } from "next-intl/server";
import { ScrollShowcase } from "./ScrollShowcase";
import type { ShotName } from "./shots";

const STEPS = [
  { key: "oneAtATime", shot: "explain" },
  { key: "bsiMethods", shot: "bsiMethod" },
  { key: "riskMap", shot: "riskMap" },
  { key: "setAside", shot: "setAside" },
  { key: "signOff", shot: "approved" },
  { key: "staysCurrent", shot: "ongoing" },
] as const satisfies readonly { readonly key: string; readonly shot: ShotName }[];

/** The walk in six steps, on the landing page. */
export async function WalkShowcase() {
  const t = await getTranslations("landing.walk");
  return (
    <ScrollShowcase
      id="walk-title"
      title={t("title")}
      lead={t("lead")}
      steps={STEPS.map((step) => ({
        ...step,
        title: t(`steps.${step.key}.title`),
        text: t(`steps.${step.key}.text`),
        alt: t(`steps.${step.key}.alt`),
      }))}
    />
  );
}
