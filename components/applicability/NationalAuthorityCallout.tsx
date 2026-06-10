import { getTranslations } from "next-intl/server";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { Building2, ArrowUpRight } from "lucide-react";
import { getRegistrationPortals } from "@/lib/registration-portals";

const FEATURED_COUNTRIES = [
  "DE", "AT", "BE", "FR", "IT", "NL",
  "ES", "SE", "FI", "DK", "IE", "PT", "PL", "CZ",
  "HU", "RO", "GR", "SK", "BG", "HR", "LU", "SI",
  "CY", "EE", "LT", "LV", "MT",
] as const;

export async function NationalAuthorityCallout({
  locale,
  highlightCountry,
}: {
  locale: string;
  /** ISO 3166-1 alpha-2 of the country to pin to the top of the list and
   *  visually highlight. Driven by the `?country=XX` query param on
   *  /applicability so country wiki pages can deep-link "show me my country". */
  highlightCountry?: string;
}) {
  const t = await getTranslations("companyLookup.authorityCallout");
  const data = getRegistrationPortals();

  const featuredList = FEATURED_COUNTRIES
    .map((code) => data.portals.find((p) => p.countryCode === code))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  // Re-order so the highlighted country comes first. Stable for the rest.
  const highlight = highlightCountry?.toUpperCase();
  const featured = highlight
    ? [
        ...featuredList.filter((p) => p.countryCode === highlight),
        ...featuredList.filter((p) => p.countryCode !== highlight),
      ]
    : featuredList;

  const countryName = (code: string): string => {
    try {
      return new Intl.DisplayNames([locale], { type: "region" }).of(code) ?? code;
    } catch {
      return code;
    }
  };

  return (
    <Card className="border-primary/20 bg-muted/30">
      <CardContent className="py-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-background shrink-0 mt-0.5">
            <Building2 className="size-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold">{t("heading")}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("body")}
            </p>
          </div>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 pt-1 text-sm">
          {featured.map((portal) => {
            const href = portal.portalUrl ?? portal.authorityUrl;
            const label = portal.portalName ?? portal.authority;
            const isHighlight = portal.countryCode === highlight;
            return (
              <li
                key={portal.countryCode}
                className={`flex flex-wrap items-baseline gap-1.5${
                  isHighlight
                    ? " -mx-2 rounded-md bg-primary/5 px-2 py-1 ring-1 ring-inset ring-primary/30"
                    : ""
                }`}
              >
                <span className="font-mono text-xs uppercase text-muted-foreground">
                  {portal.countryCode}
                </span>
                <span className="text-muted-foreground">
                  {countryName(portal.countryCode)}
                </span>
                <span className="text-xs text-muted-foreground/60">·</span>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                    <ArrowUpRight className="size-3" />
                  </a>
                ) : (
                  <span className="text-xs italic text-muted-foreground">
                    {portal.authority}
                  </span>
                )}
                {portal.wikiSlug && (
                  <>
                    <span className="text-xs text-muted-foreground/60">·</span>
                    <Link
                      href={
                        `/wiki/zeit-und-status/${portal.wikiSlug}` as never
                      }
                      className="text-xs text-primary hover:underline"
                    >
                      {t("details")}
                    </Link>
                  </>
                )}
              </li>
            );
          })}
        </ul>

        <div className="pt-1 text-sm">
          <Link
            href={"/wiki/zeit-und-status/nis2-umsetzung-europa" as never}
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            {t("seeAll")}
            <ArrowUpRight className="size-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
