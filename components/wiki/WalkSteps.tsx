import { getLocale, getTranslations } from "next-intl/server";
import { stepsOf, walkLanguage } from "@/app/[locale]/(portal)/durchgang/nis2/steps";
import { itemShot } from "@/components/durchgang/itemShots";
import { WalkStepCards } from "./WalkStepCards";

/**
 * Measures every member state starts from (Art. 21 NIS 2), as steps whose copy names no authority:
 * the asset list, the incident plan and management's review. Registration and reporting stay out,
 * because their German copy names the BSI.
 */
const NATIONAL_STEPS = ["2.2", "3.1", "7.3"] as const;

/**
 * Where a wiki article's subject comes up in the walk, as the walk's own step cards: the reader
 * got the answer above, and here sees the work it turns into, in the walk's own words and
 * screens. The page's one ask stays the GetStarted block under it, so this carries no button.
 *
 * `topic` (the default): an article about one duty or measure, with the steps it names.
 * `national`: a country's status page, whose law changes where a company registers and reports
 * but not the minimum list of measures, so it shows `NATIONAL_STEPS`.
 */
export async function WalkSteps(
  props:
    | { readonly kind?: "topic"; readonly codes: readonly string[] }
    | { readonly kind: "national" },
) {
  const kind = props.kind ?? "topic";
  const codes = props.kind === "national" ? NATIONAL_STEPS : props.codes;
  const [steps, t, tw, locale] = await Promise.all([
    stepsOf(codes),
    getTranslations("landing.walkSteps"),
    getTranslations("durchgang.ui.home"),
    getLocale(),
  ]);
  const cards = steps.map((step) => ({
    step,
    shot: itemShot(step.code, locale, tw("previewAlt", { step: step.headline })),
    label: tw("preview", { step: step.headline }),
  }));

  return (
    <section className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          {t(`${kind}.title`)}
        </h2>
        <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
          {t(`${kind}.lead`)}
        </p>
        {/* The cards below are the walk's own words, in German or English; say so where the
            page is in another language, so the switch reads as the product's, not a slip. */}
        {walkLanguage(locale) !== locale && (
          <p className="mt-1 text-xs text-muted-foreground">{t("languageNote")}</p>
        )}
      </div>
      <WalkStepCards cards={cards} />
    </section>
  );
}
