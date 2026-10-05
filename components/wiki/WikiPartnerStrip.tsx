import { getTranslations } from "next-intl/server";
import { PartnerLogoStrip } from "@/components/PartnerLogoStrip";

/** The homepage's programme logos, for a wiki page that opens like the homepage. */
export async function WikiPartnerStrip() {
  const t = await getTranslations("landing");
  return (
    <section className="print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("partnersLabel")}
      </p>
      <div className="mt-6">
        <PartnerLogoStrip variant="landing" />
      </div>
    </section>
  );
}
