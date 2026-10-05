import { FileText, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { ForwardActions } from "@/components/pricing/ForwardActions";
import {
  FOUNDERS,
  gapAnalysisRange,
  TalkFirst,
} from "@/components/pricing/PaidPricingCards";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/lib/auth";
import { ANNUAL_NET_CENTS, formatWholeEuro } from "@/lib/billing/order";
import { billingFor } from "@/lib/billing/ordering-access";
import { WALK_DOCUMENTS, WALK_RECORDS } from "@/lib/durchgang/outputs";
import { localizedAbsoluteUrl } from "@/lib/seo";

/** The rows a manager needs to decide, in the order they are asked. */
const ROWS = [
  "what",
  "outputs",
  "role",
  "cost",
  "comparison",
  "exit",
  "scope",
  "provider",
  "people",
] as const;

const BSIG_38 = "https://www.gesetze-im-internet.de/bsig_2025/__38.html";
const EUR_LEX_LANG = { de: "DE", en: "EN", nl: "NL" } as const;
const nis2Url = (locale: keyof typeof EUR_LEX_LANG) =>
  `https://eur-lex.europa.eu/legal-content/${EUR_LEX_LANG[locale]}/TXT/?uri=CELEX:32022L2555`;

const link =
  "underline decoration-primary/30 underline-offset-4 hover:decoration-primary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing.approval");
  return {
    title: t("meta.title"),
    description: t("meta.description"),
    // A page to forward, not to find: /pricing is the one search should show.
    robots: { index: false, follow: true },
  };
}

/**
 * One page for the person who signs off the purchase but was not on the call: what it is, what it
 * costs, how it compares and how to end it. The buyer forwards it (ForwardActions); nothing here
 * is printed, and the manager's own part happens in the app (ui-design principle 15).
 */
export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = rawLocale === "en" || rawLocale === "nl" ? rawLocale : "de";
  const [t, tiers, session] = await Promise.all([
    getTranslations("pricing.approval"),
    getTranslations("pricing.tiers"),
    getSession().catch(() => null),
  ]);
  const orderOpen = billingFor(session?.user.email).open;
  const { low, high, sources, checked } = gapAnalysisRange(rawLocale);

  const tags = {
    nis2: (chunks: ReactNode) => (
      <a
        href={nis2Url(locale)}
        target="_blank"
        rel="noopener noreferrer"
        className={link}
      >
        {chunks}
      </a>
    ),
    bsig: (chunks: ReactNode) => (
      <a href={BSIG_38} target="_blank" rel="noopener noreferrer" className={link}>
        {chunks}
      </a>
    ),
    terms: (chunks: ReactNode) => (
      <Link href="/terms" className={link}>
        {chunks}
      </Link>
    ),
    avv: (chunks: ReactNode) => (
      <Link href="/avv" className={link}>
        {chunks}
      </Link>
    ),
  };

  const content: Record<(typeof ROWS)[number], ReactNode> = {
    what: t("rows.what.text"),
    // Read off the walk's script (lib/durchgang/outputs.ts), so nothing is named that it does
    // not write. Documents look like documents; the lists are plain lines.
    outputs: (
      <div className="space-y-5">
        <p>{t("rows.outputs.text")}</p>
        <div>
          <p className="font-medium text-sm">{t("outputs.documentsTitle")}</p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {WALK_DOCUMENTS.map((key) => (
              <li
                key={key}
                className="flex items-start gap-2.5 rounded-lg border bg-background px-3 py-2.5 text-sm leading-snug"
              >
                <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
                {t(`outputs.documents.${key}`)}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-sm">{t("outputs.recordsTitle")}</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {WALK_RECORDS.map((key) => (
              <li key={key} className="flex items-start gap-2.5 leading-snug">
                <ListChecks
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                />
                {t(`outputs.records.${key}`)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    ),
    role: (
      <span className="flex gap-3">
        <span aria-hidden className="font-mono font-semibold text-primary">
          §
        </span>
        <span>{t.rich("rows.role.text", tags)}</span>
      </span>
    ),
    cost: t("rows.cost.text", { price: formatWholeEuro(ANNUAL_NET_CENTS, rawLocale) }),
    comparison: `${tiers("paid.anchorTip.body", { low, high })} ${tiers("paid.anchorTip.note", { sources, checked })}`,
    exit: t.rich("rows.exit.text", tags),
    scope: t("rows.scope.text"),
    provider: t.rich("rows.provider.text", tags),
    people: (
      <ul className="flex flex-wrap gap-x-8 gap-y-4">
        {FOUNDERS.map((person) => (
          <li key={person.name} className="flex items-center gap-3">
            <Image
              src={person.photo}
              alt=""
              width={96}
              height={96}
              className="size-12 rounded-full object-cover"
            />
            <span className="leading-snug">
              <span className="block font-medium">{person.name}</span>
              <span className="block text-muted-foreground text-sm">
                {t("people.role")}
              </span>
            </span>
          </li>
        ))}
      </ul>
    ),
  };

  return (
    <article className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-4">
        <p className="font-medium text-primary text-sm">{t("eyebrow")}</p>
        <h1 className="font-bold text-3xl tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="max-w-prose text-lg text-muted-foreground leading-relaxed">
          {t("lead")}
        </p>
        <ForwardActions url={localizedAbsoluteUrl("/pricing/approval", locale)} />
      </header>

      <dl className="divide-y rounded-xl border bg-card">
        {ROWS.map((key) => (
          <div
            key={key}
            className="grid gap-1 px-6 py-5 sm:grid-cols-[11rem_1fr] sm:gap-6"
          >
            <dt className="font-medium text-muted-foreground text-sm sm:pt-0.5">
              {t(`rows.${key}.label`)}
            </dt>
            <dd className="max-w-prose leading-relaxed">{content[key]}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] sm:items-center">
        {orderOpen ? (
          <Button className="h-12 w-full text-base" size="lg" asChild>
            <Link href="/bestellen">{tiers("paid.cta")}</Link>
          </Button>
        ) : (
          <Button className="h-12 w-full text-base" size="lg" disabled>
            {tiers("paid.cta")}
          </Button>
        )}
        <TalkFirst />
      </div>
    </article>
  );
}
