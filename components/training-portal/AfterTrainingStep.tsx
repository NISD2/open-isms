import { getTranslations } from "next-intl/server";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

const BSIG_38 = "https://www.gesetze-im-internet.de/bsig_2025/__38.html";

/**
 * The end of the management training: the training is one of management's duties under § 38 BSIG,
 * implementing and overseeing the measures is the other, and the walk is where that happens. The
 * reader is signed in, so the button opens the walk's home, which takes them from wherever they
 * stand (not set up yet, not paid).
 */
export async function AfterTrainingStep() {
  const [t, tGuided] = await Promise.all([
    getTranslations("trainingPortal.coursePage.afterTraining"),
    getTranslations("landing.guided"),
  ]);
  return (
    <section className="rounded-3xl bg-primary/[0.06] px-6 py-10 sm:px-10">
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {t.rich("body", {
          law: (chunks) => (
            <a
              href={BSIG_38}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <Button
          asChild
          size="lg"
          className="h-11 rounded-lg px-5 text-[0.9375rem] font-medium shadow-sm"
        >
          <Link href="/durchgang/nis2">{tGuided("cta")}</Link>
        </Button>
        <TalkFirst size="button" />
      </div>
    </section>
  );
}
