import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

/** The way onto the waitlist; the page it leads to records the reader's own click. */
export async function GdprWaitlistButton() {
  const t = await getTranslations("gdpr.waitlist");
  return (
    <Button asChild size="lg" className="h-11 rounded-lg px-5">
      <Link href="/vormerken/dsgvo">
        {t("cta")}
        <ArrowRight aria-hidden className="size-4" />
      </Link>
    </Button>
  );
}

/**
 * The DSGVO Durchgang's waitlist on a page about the GDPR: what is coming, said once and without a
 * date, and the way to be told when it opens (lib/newsletter/waitlist.ts).
 */
export async function GdprWaitlist() {
  const t = await getTranslations("gdpr.waitlist");
  return (
    <section className="space-y-3 rounded-2xl border bg-card p-6 sm:p-8 print:hidden">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("eyebrow")}
      </p>
      <h2 className="text-xl font-semibold tracking-tight">{t("heading")}</h2>
      <p className="max-w-[62ch] text-sm leading-relaxed text-muted-foreground">
        {t("body")}
      </p>
      <div className="pt-1">
        <GdprWaitlistButton />
      </div>
      <p className="max-w-[62ch] text-xs leading-relaxed text-muted-foreground">
        {t("note")}
      </p>
    </section>
  );
}
