"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ArrowRight, Check, Clock, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BANDS,
  COLUMNS,
  ROLE_LABEL,
  type Density,
  type FlowNode,
} from "./path-nodes";

type Locale = "en" | "de" | "nl";

const DENSITY_OPTS: { key: Density; en: string; de: string }[] = [
  { key: "overview", en: "Overview", de: "Übersicht" },
  { key: "critical", en: "Critical", de: "Kritisch" },
  { key: "all", en: "All steps", de: "Alle Schritte" },
];

export function PathFlow({
  categoryNodes,
  reqNodes,
  locale,
}: {
  categoryNodes: FlowNode[];
  reqNodes: FlowNode[];
  locale: Locale;
}) {
  const de = locale === "de";
  const [density, setDensity] = useState<Density>("all");

  const active =
    density === "overview"
      ? categoryNodes
      : density === "critical"
        ? reqNodes.filter((n) => n.priority === "P0")
        : reqNodes;

  const bands = BANDS.map((b) => ({
    band: b,
    nodes: active.filter((n) => n.band === b.key),
  })).filter((g) => g.nodes.length > 0);

  return (
    <div className="space-y-3">
      <DensityToggle density={density} setDensity={setDensity} de={de} />

      <div className="overflow-x-auto rounded-lg border bg-card">
        <div className="min-w-[760px]">
          {/* Column headers */}
          <div className="grid grid-cols-[1.75rem_repeat(4,1fr)] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:px-4">
            <span />
            {COLUMNS.map((c) => (
              <span key={c.key} className="truncate">
                {de ? c.de : c.en}
              </span>
            ))}
          </div>

          {bands.map(({ band, nodes }) => (
            <section key={band.key}>
              <div className="flex items-baseline gap-2 border-b bg-muted/20 px-3 py-1.5 sm:px-4">
                <h3 className="text-xs font-semibold tracking-wide text-foreground">
                  {de ? band.de : band.en}
                </h3>
                <span className="text-[11px] text-muted-foreground">
                  {de ? band.hintDe : band.hintEn}
                </span>
                <span className="ml-auto text-[11px] text-muted-foreground">
                  {nodes.length}
                </span>
              </div>
              <ol className="space-y-1.5 px-3 py-3 sm:px-4">
                {nodes.map((node) => (
                  <li
                    key={node.id}
                    className="grid grid-cols-[1.75rem_repeat(4,1fr)] items-center gap-2"
                  >
                    <StepDot status={node.status} />
                    {COLUMNS.map((c) => (
                      <div key={c.key}>
                        {node.column === c.key ? (
                          <NodeCard node={node} locale={locale} />
                        ) : null}
                      </div>
                    ))}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function DensityToggle({
  density,
  setDensity,
  de,
}: {
  density: Density;
  setDensity: (d: Density) => void;
  de: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        {de ? "Detailgrad" : "Detail"}
      </span>
      <div className="inline-flex items-center rounded-md border bg-muted/50 p-0.5">
        {DENSITY_OPTS.map((opt) => {
          const on = opt.key === density;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setDensity(opt.key)}
              className={cn(
                "rounded-sm px-2.5 py-1 text-xs font-medium transition-colors",
                on
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
              aria-pressed={on}
            >
              {de ? opt.de : opt.en}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDot({ status }: { status: FlowNode["status"] }) {
  const cls =
    status === "done"
      ? "border-primary bg-primary text-primary-foreground"
      : status === "current"
        ? "border-primary bg-background text-primary ring-2 ring-primary/30"
        : "border-border bg-background text-muted-foreground";
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          cls,
        )}
      >
        {status === "done" ? (
          <Check className="h-3 w-3" />
        ) : status === "current" ? (
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        ) : (
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
        )}
      </div>
    </div>
  );
}

function hrefFor(node: FlowNode) {
  if (!node.isReq && node.code === "RSK") return "/assets";
  if (node.isReq) {
    return {
      pathname: "/compliance/[categorySlug]/[requirementCode]" as const,
      params: { categorySlug: node.categorySlug, requirementCode: node.code },
    };
  }
  return {
    pathname: "/compliance/[categorySlug]" as const,
    params: { categorySlug: node.categorySlug },
  };
}

function NodeCard({ node, locale }: { node: FlowNode; locale: Locale }) {
  const de = locale === "de";
  const owner = ROLE_LABEL[node.ownerRole] ?? { en: node.ownerRole, de: node.ownerRole };
  const ownerLabel = de ? owner.de : owner.en;
  const href = hrefFor(node);

  const ring =
    node.status === "current"
      ? "border-primary shadow-sm ring-1 ring-primary/20"
      : node.status === "done"
        ? "border-border/60 bg-muted/30"
        : "border-border";

  return (
    <HoverCard openDelay={120} closeDelay={60}>
      <HoverCardTrigger asChild>
        <Link
          href={href}
          className={cn(
            "block rounded-md border bg-background p-2 transition-colors hover:border-primary/60 hover:bg-accent/40",
            ring,
          )}
        >
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {node.code}
            </span>
            <span className="truncate text-sm font-medium">{node.label}</span>
            <span className="ml-auto flex shrink-0 items-center gap-1">
              {node.priority === "P0" ? (
                <Badge variant="secondary" className="px-1 py-0 text-[10px]">
                  P0
                </Badge>
              ) : null}
              {node.status === "current" ? (
                <Badge className="px-1 py-0 text-[10px]">{de ? "Jetzt" : "Now"}</Badge>
              ) : node.status === "upcoming" ? (
                <Lock className="h-3 w-3 text-muted-foreground" />
              ) : (
                <Check className="h-3 w-3 text-primary" />
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 pl-[34px] text-[11px] text-muted-foreground">
            <span className="truncate">{ownerLabel}</span>
            {node.estimatedMinutes ? (
              <>
                <span aria-hidden>·</span>
                <span className="inline-flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {node.estimatedMinutes}m
                </span>
              </>
            ) : null}
            {!node.isReq && node.total > 0 ? (
              <>
                <span aria-hidden>·</span>
                <span>
                  {node.completed}/{node.total}
                </span>
              </>
            ) : null}
          </div>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-72">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            <span className="font-mono text-xs text-muted-foreground">{node.code}</span>{" "}
            {node.label}
          </p>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {ownerLabel}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          {node.priority ? <span>{node.priority}</span> : null}
          {node.estimatedMinutes ? (
            <span className="inline-flex items-center gap-0.5">
              <Clock className="h-3 w-3" />~{node.estimatedMinutes} {de ? "Min." : "min"}
            </span>
          ) : null}
          {!node.isReq && node.total > 0 ? (
            <span>
              {node.completed}/{node.total} {de ? "erledigt" : "done"}
            </span>
          ) : null}
        </div>
        <Button asChild size="sm" className="mt-3 w-full">
          <Link href={href}>
            {node.status === "done"
              ? de
                ? "Ansehen"
                : "Review"
              : node.status === "current"
                ? de
                  ? "Loslegen"
                  : "Start"
                : de
                  ? "Öffnen"
                  : "Open"}
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </HoverCardContent>
    </HoverCard>
  );
}
