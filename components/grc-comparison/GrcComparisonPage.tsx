"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";
import type {
  Vendor,
  VendorCategory,
  VendorDataExport,
  VendorDataset,
  VendorTier,
} from "@/lib/grc-vendors/schema";

interface Props {
  dataset: VendorDataset;
  stats: {
    total: number;
    transparent: number;
    partial: number;
    gated: number;
    unverifiable: number;
    nis2Listed: number;
    withFreeTier: number;
    oss: number;
    countries: number;
    dataExportFullOpen: number;
    dataExportPartial: number;
    dataExportReportOnly: number;
    dataExportNone: number;
    dataExportResearched: number;
  };
  locale: string;
}

const TIER_VARIANT: Record<VendorTier, "default" | "secondary" | "destructive" | "outline"> = {
  transparent: "default",
  partial: "secondary",
  gated: "destructive",
  unverifiable: "outline",
};

const TIER_SORT: Record<VendorTier, number> = {
  gated: 0,
  unverifiable: 1,
  partial: 2,
  transparent: 3,
};

const DATA_EXPORT_VARIANT: Record<VendorDataExport, "default" | "secondary" | "destructive" | "outline"> = {
  "full-open": "default",
  "documented-partial": "secondary",
  "report-only": "outline",
  "none-documented": "destructive",
};

const DATA_EXPORT_LABEL_KEY: Record<VendorDataExport, string> = {
  "full-open": "dataExportFullOpen",
  "documented-partial": "dataExportPartial",
  "report-only": "dataExportReportOnly",
  "none-documented": "dataExportNone",
};

const CATEGORY_KEYS: VendorCategory[] = [
  "isms",
  "grc",
  "tprm",
  "consultancy",
  "audit",
  "ratings",
  "template",
  "ai-grc",
  "endpoint",
  "vuln",
  "cspm",
  "iam",
  "training",
  "asset",
  "reporting",
  "comms",
];

const CATEGORY_LABEL_KEY: Record<VendorCategory, string> = {
  isms: "categoryIsms",
  grc: "categoryGrc",
  tprm: "categoryTprm",
  consultancy: "categoryConsultancy",
  audit: "categoryAudit",
  ratings: "categoryRatings",
  template: "categoryTemplate",
  "ai-grc": "categoryAiGrc",
  endpoint: "categoryEndpoint",
  vuln: "categoryVuln",
  cspm: "categoryCspm",
  iam: "categoryIam",
  training: "categoryTraining",
  asset: "categoryAsset",
  reporting: "categoryReporting",
  comms: "categoryComms",
};

const FREE_TIER_LABEL_KEY = {
  none: "freeTierNone",
  trial: "freeTierTrial",
  freemium: "freeTierFreemium",
  oss: "freeTierOss",
} as const;

export function GrcComparisonPage({ dataset, stats, locale }: Props) {
  const t = useTranslations("grcComparison");
  const lang: "de" | "en" = locale === "de" ? "de" : "en";

  const [search, setSearch] = useState("");
  const [tier, setTier] = useState<VendorTier | "all">("all");
  const [country, setCountry] = useState<string>("all");
  const [category, setCategory] = useState<VendorCategory | "all">("all");
  const [nis2Only, setNis2Only] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const countries = useMemo(() => {
    const set = new Set(dataset.vendors.map((v) => v.country));
    return Array.from(set).sort();
  }, [dataset]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return dataset.vendors
      .filter((v) => {
        if (q && !v.name.toLowerCase().includes(q)) return false;
        if (tier !== "all" && v.tier !== tier) return false;
        if (country !== "all" && v.country !== country) return false;
        if (category !== "all" && v.category !== category) return false;
        if (nis2Only && !v.nis2Listed) return false;
        if (freeOnly && v.freeTier === "none") return false;
        return true;
      })
      .sort((a, b) => {
        const tierDiff = TIER_SORT[a.tier] - TIER_SORT[b.tier];
        if (tierDiff !== 0) return tierDiff;
        const aPrice = a.entryPriceEur ?? Number.POSITIVE_INFINITY;
        const bPrice = b.entryPriceEur ?? Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) return aPrice - bPrice;
        return a.name.localeCompare(b.name);
      });
  }, [dataset, search, tier, country, category, nis2Only, freeOnly]);

  const resetFilters = () => {
    setSearch("");
    setTier("all");
    setCountry("all");
    setCategory("all");
    setNis2Only(false);
    setFreeOnly(false);
  };

  return (
    <div className="space-y-12 px-4 pb-16 pt-8 md:px-8 lg:px-12">
      <Hero t={t} />
      <StatsRow t={t} stats={stats} lastUpdated={dataset.lastUpdated} />
      <Thesis t={t} />
      <FilterBar
        t={t}
        search={search}
        setSearch={setSearch}
        tier={tier}
        setTier={setTier}
        country={country}
        setCountry={setCountry}
        countries={countries}
        category={category}
        setCategory={setCategory}
        nis2Only={nis2Only}
        setNis2Only={setNis2Only}
        freeOnly={freeOnly}
        setFreeOnly={setFreeOnly}
        resetFilters={resetFilters}
      />
      <VendorTable t={t} vendors={filtered} lang={lang} />
      <Methodology t={t} dataset={dataset} />
      <CallToAction t={t} />
    </div>
  );
}

function Hero({ t }: { t: ReturnType<typeof useTranslations<"grcComparison">> }) {
  return (
    <section className="mx-auto max-w-4xl space-y-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
        {t("hero.eyebrow")}
      </p>
      <h1 className="text-3xl font-bold leading-tight tracking-tight md:text-5xl">
        {t("hero.title")}
      </h1>
      <p className="text-base text-muted-foreground md:text-lg">{t("hero.subtitle")}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href="/auth/signin">{t("hero.ctaPlatform")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <a href="#methodology">{t("hero.ctaMethodology")}</a>
        </Button>
      </div>
    </section>
  );
}

function StatsRow({
  t,
  stats,
  lastUpdated,
}: {
  t: ReturnType<typeof useTranslations<"grcComparison">>;
  stats: Props["stats"];
  lastUpdated: string;
}) {
  const items: { value: number; key: string }[] = [
    { value: stats.total, key: "totalLabel" },
    { value: stats.transparent, key: "transparentLabel" },
    { value: stats.partial, key: "partialLabel" },
    { value: stats.gated, key: "gatedLabel" },
    { value: stats.nis2Listed, key: "nis2Label" },
    { value: stats.countries, key: "countriesLabel" },
  ];
  return (
    <section className="mx-auto max-w-6xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <Card key={item.key}>
            <CardContent className="px-4 py-4 text-center">
              <p className="text-2xl font-bold tabular-nums md:text-3xl">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(`stats.${item.key}` as Parameters<typeof t>[0])}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        {t("stats.lastUpdatedPrefix")} {lastUpdated}
      </p>
    </section>
  );
}

function Thesis({ t }: { t: ReturnType<typeof useTranslations<"grcComparison">> }) {
  const points = t.raw("thesis.points") as Array<{ title: string; body: string }>;
  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{t("thesis.title")}</h2>
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground">{t("thesis.body")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {points.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

interface FilterBarProps {
  t: ReturnType<typeof useTranslations<"grcComparison">>;
  search: string;
  setSearch: (s: string) => void;
  tier: VendorTier | "all";
  setTier: (t: VendorTier | "all") => void;
  country: string;
  setCountry: (c: string) => void;
  countries: string[];
  category: VendorCategory | "all";
  setCategory: (c: VendorCategory | "all") => void;
  nis2Only: boolean;
  setNis2Only: (b: boolean) => void;
  freeOnly: boolean;
  setFreeOnly: (b: boolean) => void;
  resetFilters: () => void;
}

function FilterBar({
  t,
  search,
  setSearch,
  tier,
  setTier,
  country,
  setCountry,
  countries,
  category,
  setCategory,
  nis2Only,
  setNis2Only,
  freeOnly,
  setFreeOnly,
  resetFilters,
}: FilterBarProps) {
  return (
    <section className="mx-auto max-w-7xl">
      <div className="sticky top-0 z-10 -mx-4 space-y-4 border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur md:-mx-8 md:px-8">
        <Input
          type="search"
          placeholder={t("filters.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Select value={tier} onValueChange={(v) => setTier(v as VendorTier | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.tierLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.tierAll")}</SelectItem>
              <SelectItem value="transparent">{t("filters.tierTransparent")}</SelectItem>
              <SelectItem value="partial">{t("filters.tierPartial")}</SelectItem>
              <SelectItem value="gated">{t("filters.tierGated")}</SelectItem>
              <SelectItem value="unverifiable">{t("filters.tierUnverifiable")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.countryLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.countryAll")}</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as VendorCategory | "all")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("filters.categoryLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filters.categoryAll")}</SelectItem>
              {CATEGORY_KEYS.map((c) => (
                <SelectItem key={c} value={c}>
                  {t(`filters.${CATEGORY_LABEL_KEY[c]}` as Parameters<typeof t>[0])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={nis2Only}
              onCheckedChange={(v) => setNis2Only(v === true)}
            />
            <span>{t("filters.nis2OnlyLabel")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={freeOnly}
              onCheckedChange={(v) => setFreeOnly(v === true)}
            />
            <span>{t("filters.freeTierLabel")}</span>
          </label>
          <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto">
            {t("filters.resetButton")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function VendorTable({
  t,
  vendors,
  lang,
}: {
  t: ReturnType<typeof useTranslations<"grcComparison">>;
  vendors: Vendor[];
  lang: "de" | "en";
}) {
  if (vendors.length === 0) {
    return (
      <section className="mx-auto max-w-7xl">
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {t("table.noResults")}
          </CardContent>
        </Card>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-7xl xl:-mx-24 2xl:-mx-48">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">{t("table.name")}</TableHead>
              <TableHead className="w-[60px]">{t("table.country")}</TableHead>
              <TableHead className="min-w-[120px]">{t("table.tier")}</TableHead>
              <TableHead className="min-w-[160px]">{t("table.dataExport")}</TableHead>
              <TableHead className="w-[60px]">{t("table.nis2")}</TableHead>
              <TableHead className="w-[80px]">{t("table.freeTier")}</TableHead>
              <TableHead className="w-[100px]">{t("table.source")}</TableHead>
              <TableHead className="min-w-[260px]">{t("table.entryPrice")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell className="text-muted-foreground">{v.country}</TableCell>
                <TableCell>
                  <Badge variant={TIER_VARIANT[v.tier]}>
                    {t(`table.tierBadge${capitalise(v.tier)}` as Parameters<typeof t>[0])}
                  </Badge>
                </TableCell>
                <TableCell>
                  {v.dataExport ? (
                    <Badge
                      variant={DATA_EXPORT_VARIANT[v.dataExport]}
                      title={v.dataExportEvidence?.[lang] ?? undefined}
                    >
                      {t(`table.${DATA_EXPORT_LABEL_KEY[v.dataExport]}` as Parameters<typeof t>[0])}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("table.dataExportUnknown")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={
                      v.nis2Listed
                        ? "text-xs font-semibold text-green-600"
                        : "text-xs text-muted-foreground"
                    }
                  >
                    {v.nis2Listed ? t("table.nis2Yes") : t("table.nis2No")}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {t(`table.${FREE_TIER_LABEL_KEY[v.freeTier]}` as Parameters<typeof t>[0])}
                </TableCell>
                <TableCell>
                  <a
                    href={v.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    title={t("table.viewVendorPricing")}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {t("table.viewVendorPricing")}
                  </a>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {v.priceModel[lang]}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function Methodology({
  t,
  dataset,
}: {
  t: ReturnType<typeof useTranslations<"grcComparison">>;
  dataset: VendorDataset;
}) {
  const rules = t.raw("methodology.rules") as string[];
  return (
    <section id="methodology" className="mx-auto max-w-4xl space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">{t("methodology.title")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("methodology.verified")} <strong>{dataset.lastUpdated}</strong>
      </p>
      <ul className="space-y-2">
        {rules.map((r) => (
          <li key={r} className="flex gap-2 text-sm text-muted-foreground">
            <span className="text-primary">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("methodology.correctionsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("methodology.correctionsBody")}</p>
        </CardContent>
      </Card>
    </section>
  );
}

function CallToAction({
  t,
}: {
  t: ReturnType<typeof useTranslations<"grcComparison">>;
}) {
  return (
    <section className="mx-auto max-w-4xl">
      <Card>
        <CardContent className="space-y-4 py-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight">{t("cta.title")}</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">{t("cta.body")}</p>
          <Button asChild size="lg">
            <Link href="/auth/signin">{t("cta.button")}</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
