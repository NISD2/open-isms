import { getTranslations } from "next-intl/server";

export async function WikiLegalDisclaimer() {
  const t = await getTranslations("info.wikiDisclaimer");
  return (
    <aside
      className="mt-12 rounded-lg border border-muted-foreground/20 bg-muted/30 p-4 text-xs leading-relaxed text-muted-foreground"
      role="note"
      aria-label={t("label")}
    >
      <p className="font-medium text-foreground">{t("label")}</p>
      <p className="mt-2">{t("body")}</p>
    </aside>
  );
}
