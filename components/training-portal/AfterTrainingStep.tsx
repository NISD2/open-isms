import { Check, UserRoundPlus, Wrench } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { CompanyEssentials } from "@/components/organization/CompanyEssentials";
import { TalkFirst } from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { getPathname, Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { czechCitations } from "@/lib/compliance/czech-law";
import { pickLocalized } from "@/lib/locale";
import { AfterTrainingHandOver } from "./AfterTrainingHandOver";

const BSIG_38 = "https://www.gesetze-im-internet.de/bsig_2025/__38.html";

/**
 * The law the text links, in the reader's legal order: § 38 BSIG, or for a Czech reader § 4 of
 * vyhláška č. 410/2025 Sb., which holds management's training (písm. b)) and its other duties.
 */
const LAW_HREF = {
  de: BSIG_38,
  en: BSIG_38,
  cs: czechCitations({ act: null, lower: "§ 4 písm. b)", higher: null })[0]?.href,
};

const WALK_HOME = "/durchgang/nis2";

/**
 * The end of the management training: the training is one of management's duties under § 38 BSIG,
 * implementing and overseeing the measures is the other, and the walk is where that happens.
 *
 * Two ways on, side by side, because whoever finished the course is often not the one who will do
 * the work (Simon, 22.10.2026): do it yourself (the company first if it is still the draft every
 * account gets, then the walk), or hand it to someone with an invite. Nothing about the reader's
 * role is stored here: who signs is set on the team page, where it is a decision with weight.
 * The walk's management training step (1.1) already lists the finisher's course
 * (training.managementCourse reads it off the lesson progress), so the page says so.
 */
export async function AfterTrainingStep() {
  const [t, session, locale] = await Promise.all([
    getTranslations("trainingPortal.coursePage.afterTraining"),
    getSession(),
    getLocale(),
  ]);
  const activated = session?.companyActivated === true;
  const admin = session?.role === "admin";
  return (
    <section className="rounded-3xl bg-primary/[0.06] px-6 py-10 sm:px-10">
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
        {t("title")}
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
        {t.rich("body", {
          law: (chunks) => (
            <a
              href={pickLocalized<string>(LAW_HREF, locale)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-4"
            >
              {chunks}
            </a>
          ),
        })}
      </p>
      {session?.companyId ? (
        <p className="mt-5 flex max-w-2xl items-start gap-2.5 text-sm font-medium">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check aria-hidden className="size-3" />
          </span>
          {t("recorded")}
        </p>
      ) : null}

      {/* One above the other: the company form and the invite field need the full width. */}
      <div className="mt-8 grid gap-4">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <Wrench aria-hidden className="size-5 text-primary" />
            {t("self.title")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{t("self.body")}</p>
          {activated ? (
            <Button asChild size="lg" className="mt-6 h-11 rounded-lg px-5">
              <Link href={WALK_HOME}>{t("self.start")}</Link>
            </Button>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-medium">{t("self.setup")}</p>
              <CompanyEssentials
                mode="create"
                next={WALK_HOME}
                submitLabel={t("self.start")}
              />
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">{t("moneyBack")}</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight">
            <UserRoundPlus aria-hidden className="size-5 text-primary" />
            {t("other.title")}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("other.body")}
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {t("other.notYou")}
          </p>
          <div className="mt-5">
            {!activated ? (
              <p className="text-sm text-muted-foreground">{t("other.setupFirst")}</p>
            ) : admin ? (
              <AfterTrainingHandOver
                redirectPath={getPathname({ href: WALK_HOME, locale })}
              />
            ) : (
              <p className="text-sm text-muted-foreground">{t("other.askAdmin")}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TalkFirst size="button" />
      </div>
    </section>
  );
}
