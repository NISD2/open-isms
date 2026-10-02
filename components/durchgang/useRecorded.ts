"use client";

import { useTranslations } from "next-intl";
import type { ResolvedScreen } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Draft } from "./draft";
import { headOf, inAudience } from "./TrainingRecords";
import type { ItemView } from "./view";

const SHOWN_NAMES = 4;

/**
 * What an item's done screen lists as recorded, read off the item's own screens: each kind that
 * puts something in the records says so in one line, a document with where its approval
 * happens. Explanations add nothing.
 */
export function useRecorded(item: ItemView, draft: Draft): readonly string[] {
  const t = useTranslations("durchgang.ui");
  const kinds = new Set(item.screens.map((e) => e.screen.kind));
  const modules = new Set(
    item.screens.flatMap((e) => (e.screen.kind === "register" ? [e.screen.module] : [])),
  );
  const trainings = trpc.training.list.useQuery(undefined, {
    enabled: modules.has("training_record"),
  });
  const reviews = trpc.managementReview.list.useQuery(undefined, {
    enabled: modules.has("management_review"),
  });
  const suppliers = trpc.supplier.list.useQuery(undefined, {
    enabled: modules.has("supplier"),
  });
  const assets = trpc.asset.list.useQuery(undefined, { enabled: kinds.has("assets") });

  const listed = (label: string, names: readonly (string | null)[]): string[] => {
    const shown = names.filter((n): n is string => Boolean(n?.trim()));
    if (shown.length === 0) return [];
    const head = shown.slice(0, SHOWN_NAMES).join(", ");
    const rest = shown.length - SHOWN_NAMES;
    return [`${label}: ${rest > 0 ? t("andMore", { names: head, count: rest }) : head}`];
  };

  const shown = (
    value: unknown,
    options: Readonly<Record<string, string>> | undefined,
  ) =>
    typeof value === "boolean"
      ? t(value ? "yes" : "no")
      : typeof value === "string"
        ? (options?.[value] ?? value)
        : String(value);

  const linesOf = (entry: ResolvedScreen): readonly string[] => {
    switch (entry.kind) {
      case "fields":
        return entry.copy.fields.flatMap((f) => {
          const value = draft.values[f.key];
          return value === "" || value === undefined || value === null
            ? []
            : [`${f.label}: ${shown(value, f.options)}`];
        });
      case "sources":
        return listed(
          t("recordedSources"),
          entry.copy.sources
            .filter((s) => draft.sources.some((id) => id === s.key))
            .map((s) => s.label),
        );
      case "register":
        switch (entry.screen.module) {
          case "training_record": {
            const { audience } = entry.screen;
            return listed(
              t("recordedIn.training_record"),
              (trainings.data ?? [])
                .filter((row) => inAudience(row, audience))
                .map((row) => headOf(row, audience)),
            );
          }
          case "management_review":
            return listed(
              t("recordedIn.management_review"),
              (reviews.data ?? []).map((row) => row.title),
            );
          case "supplier":
            return listed(
              t("recordedIn.supplier"),
              (suppliers.data ?? []).map((row) => row.name),
            );
          case "team":
            return listed(
              t("recordedIn.team"),
              (item.registers.team ?? []).map((row) => row.name?.trim() || row.email),
            );
          default:
            return entry.screen satisfies never;
        }
      case "policy":
        return [t("recordedPolicy", { title: entry.copy.title })];
      default:
        return [];
    }
  };

  return [
    ...item.screens.flatMap(linesOf),
    ...(assets.data ? [t("onList", { count: assets.data.length })] : []),
    ...(draft.uploaded ? [draft.uploaded] : []),
  ];
}
