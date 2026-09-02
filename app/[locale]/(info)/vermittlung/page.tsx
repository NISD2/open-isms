import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CopyProtected } from "@/components/CopyProtected";
import { HELP_LOCALES, pageAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations("help");
  return {
    title: t("referral.meta.title"),
    description: t("referral.meta.description"),
    alternates: pageAlternates("vermittlung", locale, HELP_LOCALES),
  };
}

const sectionKeys = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8", "s9", "s10"] as const;

/**
 * Provider block. The company VALUES are held once, in the `info.impressum`
 * namespace that renders /impressum. The field LIST is not shared, though,
 * so a key added to or dropped from `impressum.responsible` does not reach
 * this page on its own -- and naming one that no longer exists renders the
 * key path instead of the value. Keep the two in step by hand, or derive
 * both from one list.
 */
const providerKeys = ["company", "address"] as const;

export default async function ReferralTermsPage() {
  const t = await getTranslations("help");
  const tInfo = await getTranslations("info");

  return (
    <CopyProtected>
      <article>
        <header className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{t("referral.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("referral.asOf")}</p>
        </header>

        <Separator className="my-8" />

        <section id="provider">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{t("referral.providerHeading")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              {providerKeys.map((key) => (
                <p key={key}>{tInfo(`impressum.responsible.${key}`)}</p>
              ))}
              <p>
                <a
                  href={`mailto:${tInfo("impressum.responsible.email")}`}
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  {tInfo("impressum.responsible.email")}
                </a>
              </p>
            </CardContent>
          </Card>
        </section>

        <div className="mt-8 space-y-6">
          {sectionKeys.map((key) => (
            <section key={key} id={key}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t(`referral.${key}.heading`)}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {/* s8 names the address consent is withdrawn at, and
                      takes it from help.contact.email -- the same key the
                      /hilfe button uses -- so the two cannot drift into a
                      legal page pointing at a dead mailbox.

                      Passed to s8 alone, not to every section: next-intl only
                      parses ICU when values are supplied, so handing them to
                      all ten would put the commission and liability clauses
                      on a parse path they are not on today, where one stray
                      brace renders "help.referral.s3.body" instead of the
                      clause. */}
                  <p>
                    {t(
                      `referral.${key}.body`,
                      key === "s8" ? { email: t("contact.email") } : undefined,
                    )}
                  </p>
                </CardContent>
              </Card>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
          <Link href="/hilfe" className="underline underline-offset-4 hover:text-primary">
            {t("referral.backToHelp")}
          </Link>
          <Link href="/datenschutz" className="underline underline-offset-4 hover:text-primary">
            {t("referral.privacyLink")}
          </Link>
        </div>
      </article>
    </CopyProtected>
  );
}
