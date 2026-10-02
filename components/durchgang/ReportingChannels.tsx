"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { WalkLocale } from "@/lib/durchgang";
import { cn } from "@/lib/utils";
import type { Registration } from "./view";

type Portal = Registration["portals"][number];

/**
 * The country whose reporting channel we have checked ourselves: in Germany a registered company
 * reports in the BSI portal, from its "Sicherheitsvorfall melden" button (BSI, Anleitung zur
 * Meldung im BSI-Portal). For every other country the authority's own site says how.
 */
const CHECKED_CHANNEL = "DE";

/**
 * Where a significant incident is reported (Art. 23(1) NIS 2: the CSIRT or the competent
 * authority), from the same list the registration screen reads. The company's own country comes
 * first and large; every other member state sits behind one disclosure.
 */
export function ReportingChannels({
  registration,
  locale,
}: {
  registration: Registration | null;
  locale: WalkLocale;
}) {
  const t = useTranslations("durchgang.ui.reporting");
  if (!registration) return null;
  const names = new Intl.DisplayNames([locale], { type: "region" });
  const nameOf = (p: Portal) => names.of(p.countryCode) ?? p.countryCode;
  const own = registration.portals.find((p) => p.countryCode === registration.country);
  const others = registration.portals
    .filter((p) => p !== own)
    .toSorted((a, b) => nameOf(a).localeCompare(nameOf(b), locale));

  return (
    <div className="space-y-4">
      {own ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 sm:p-6">
          <p className="text-xs font-medium text-primary">{t("yours")}</p>
          <p className="mt-1 text-xl font-semibold">{own.authority}</p>
          {own.csirt && (
            <p className="mt-1 text-sm text-muted-foreground">
              {t("csirt", { name: own.csirt })}
            </p>
          )}
          {own.countryCode === CHECKED_CHANNEL && own.portalUrl ? (
            <>
              <p className="mt-4 max-w-[60ch] text-sm leading-6">{t("checked")}</p>
              <a
                href={own.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("openPortal", { name: own.portalName ?? own.authority })}
                <ExternalLink className="size-3.5" />
              </a>
            </>
          ) : (
            own.authorityUrl && (
              <>
                <p className="mt-4 max-w-[60ch] text-sm leading-6">{t("unchecked")}</p>
                <AuthorityLink url={own.authorityUrl} className="mt-4" />
              </>
            )
          )}
        </section>
      ) : (
        <p className="rounded-xl bg-muted p-4 text-sm">
          {t("noCountry")}{" "}
          <Link href="/organization" className="font-medium text-primary hover:underline">
            {t("setCountry")}
          </Link>
        </p>
      )}
      <details
        className="group overflow-hidden rounded-2xl border bg-card shadow-sm"
        open={!own}
      >
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium">
          {t("others", { count: others.length })}
        </summary>
        <ul className="divide-y border-t">
          {others.map((p) => (
            <li
              key={p.countryCode}
              className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <span className="font-medium">{nameOf(p)}</span>
              <span className="min-w-0 text-muted-foreground">
                {p.authority}
                {p.csirt && <span className="block text-xs">{p.csirt}</span>}
              </span>
              {p.authorityUrl && <AuthorityLink url={p.authorityUrl} />}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function AuthorityLink({ url, className }: { url: string; className?: string }) {
  const t = useTranslations("durchgang.ui.reporting");
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline",
        className,
      )}
    >
      {t("website")}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
