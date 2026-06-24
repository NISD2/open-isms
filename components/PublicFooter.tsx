import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

export async function PublicFooter() {
  const t = await getTranslations("info");

  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-0">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="text-sm font-semibold">{t("footer.platform")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href={"/wiki" as never} className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.documentation")}
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.features")}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.pricing")}
                </Link>
              </li>
              <li>
                <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.signIn")}
                </Link>
              </li>
              <li>
                <Link href="/training/nis2-ceo" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.trainingPortal")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.company")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/vertrauen" className="text-sm text-muted-foreground hover:text-foreground font-medium">
                  {t("footer.trustCenter")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.team")}
                </Link>
              </li>
              <li>
                <Link href="/corrections" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.corrections")}
                </Link>
              </li>
              <li>
                <Link href="/changelog" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.changelog")}
                </Link>
              </li>
              <li>
                <Link href="/open-source" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.openSource")}
                </Link>
              </li>
              <li>
                <Link href="/partner" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.partners")}
                </Link>
              </li>
              <li>
                <Link href="/status" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.status")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.legal")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/impressum" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.impressum")}
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.datenschutz")}
                </Link>
              </li>
              <li>
                <Link href="/avv" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.avv")}
                </Link>
              </li>
              <li>
                <Link href="/toms" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.toms")}
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
                  {t("footer.terms")}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold">{t("footer.contact")}</h3>
            <ul className="mt-3 space-y-2">
              <li>
                <a href="mailto:contact@nisd2.eu" className="text-sm text-muted-foreground hover:text-foreground">
                  contact@nisd2.eu
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("footer.hostedInGermany")}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {t("footer.gdprCompliant")}
            </span>
            <Link
              href="/avv"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 hover:bg-muted"
            >
              {t("footer.avvBadge")}
            </Link>
            <Link
              href="/toms"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 hover:bg-muted"
            >
              {t("footer.tomsBadge")}
            </Link>
            <Link
              href="/vertrauen"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 hover:bg-muted"
            >
              {t("footer.trustCenterBadge")}
            </Link>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} {t("footer.copyright")}
            </p>
            <LocaleSwitcher />
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            {t("footer.disclaimer")}
          </p>
        </div>
      </div>
    </footer>
  );
}
