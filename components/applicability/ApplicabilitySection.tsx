import { getTranslations } from "next-intl/server";
import { ApplicabilityCheck } from "./ApplicabilityCheck";
import { NationalAuthorityCallout } from "./NationalAuthorityCallout";

export async function ApplicabilitySection({
  locale,
  highlightCountry,
}: {
  locale: string;
  highlightCountry?: string;
}) {
  const t = await getTranslations("companyLookup");

  return (
    <div className="space-y-8">
      <NationalAuthorityCallout locale={locale} highlightCountry={highlightCountry} />

      <section className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {t("selfCheckHeading")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("selfCheckSubtitle")}
        </p>
      </section>

      <ApplicabilityCheck />
    </div>
  );
}
