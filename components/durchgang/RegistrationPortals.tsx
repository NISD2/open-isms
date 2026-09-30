"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { Registration } from "./view";

type Portal = Registration["portals"][number];

/**
 * Every member state's authority and registration portal, from the list the wiki's portal page
 * keeps. The company's own country comes first and large; the rest sit behind one disclosure,
 * for a company that also operates elsewhere.
 */
export function RegistrationPortals({
  registration,
  locale,
}: {
  registration: Registration | null;
  locale: "de" | "en";
}) {
  const t = useTranslations("durchgang.ui.portals");
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
          <p className="mt-1 text-xl font-semibold">{nameOf(own)}</p>
          <p className="mt-1 text-sm text-muted-foreground">{own.authority}</p>
          <PortalLink portal={own} className="mt-4" prominent />
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
          {own
            ? t("others", { count: others.length })
            : t("all", { count: others.length })}
        </summary>
        <ul className="divide-y border-t">
          {others.map((p) => (
            <li
              key={p.countryCode}
              className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
            >
              <span className="font-medium">{nameOf(p)}</span>
              <span className="min-w-0 text-muted-foreground">{p.authority}</span>
              <PortalLink portal={p} />
            </li>
          ))}
        </ul>
      </details>
      <p className="text-xs text-muted-foreground">
        {t("asOf", {
          date: new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
            timeZone: "UTC",
            dateStyle: "long",
          }).format(new Date(registration.lastUpdated)),
        })}
      </p>
    </div>
  );
}

function PortalLink({
  portal,
  prominent = false,
  className,
}: {
  portal: Portal;
  prominent?: boolean;
  className?: string;
}) {
  const t = useTranslations("durchgang.ui.portals");
  if (!portal.portalUrl || portal.status === "not-yet-available") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {t("noPortal")}
      </span>
    );
  }
  return (
    <a
      href={portal.portalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-primary hover:underline",
        prominent &&
          "rounded-xl bg-primary px-4 py-2.5 text-sm text-primary-foreground hover:no-underline hover:opacity-90",
        !prominent && "text-xs",
        className,
      )}
    >
      {portal.status === "operational" ? t("open") : t(`status.${portal.status}`)}
      <ExternalLink className="size-3.5" />
    </a>
  );
}
