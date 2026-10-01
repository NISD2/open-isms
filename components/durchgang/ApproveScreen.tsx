"use client";

import { ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { type PolicyTemplate, WALK_POLICIES } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import type { Draft } from "./draft";
import { Heading, Lead } from "./ExplainScreens";
import { Toggle } from "./RowParts";
import type { Of, WorkProps } from "./WorkScreens";

/** A day as stored, shown as the person reads it. */
const dayOf = (locale: "de" | "en", day: string) =>
  new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "UTC",
    dateStyle: "long",
  }).format(new Date(`${day}T00:00:00Z`));

/** Where a document's policy screen is, so it can be read and printed before it is approved. */
const screenOf = (code: string, type: string) =>
  WALK_POLICIES.find((p) => p.code === code && p.policy === type)?.at ?? 0;

/** Whether the approval screen holds what it needs: nothing left to approve, or a choice and a day. */
export const approvalReady = (
  rows: ReadonlyArray<{ readonly status: string }> | undefined,
  draft: Draft,
): boolean =>
  rows !== undefined &&
  (rows.every((row) => row.status !== "draft") ||
    (draft.approval.types.length > 0 && draft.approval.day !== ""));

/**
 * 7.3: every document the walk wrote, with its state. The person ticks the drafts management
 * approved in this sitting and enters the day; each one can be opened to read and print first.
 */
export function Approve({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"approve"> }) {
  const t = useTranslations("durchgang.ui.approve");
  const { data: rows } = trpc.durchgang.walkPolicies.useQuery();
  const { types, day } = draft.approval;
  const toggle = (type: PolicyTemplate) =>
    onDraft({
      ...draft,
      approval: {
        ...draft.approval,
        types: types.includes(type) ? types.filter((x) => x !== type) : [...types, type],
      },
    });
  const drafts = (rows ?? []).filter((row) => row.status === "draft");

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      {rows === undefined ? null : rows.length === 0 ? (
        <p className="mt-8 text-muted-foreground">{t("none")}</p>
      ) : (
        <ul className="mt-8 divide-y overflow-hidden rounded-2xl border bg-card shadow-sm">
          {rows.map((row) => {
            const { type } = row;
            return (
              <li
                key={`${row.code}:${row.type}`}
                className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-6"
              >
                <div className="min-w-0">
                  <p className="font-medium break-words">{row.title}</p>
                  <Link
                    href={{
                      pathname: "/durchgang/[code]",
                      params: { code: row.code },
                      query: { s: screenOf(row.code, row.type) },
                    }}
                    target="_blank"
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {t("view")}
                    <ExternalLink className="size-3.5" />
                  </Link>
                </div>
                {row.status === "draft" ? (
                  <Toggle on={types.includes(type)} onClick={() => toggle(type)}>
                    {t("approved")}
                  </Toggle>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {row.effectiveFrom
                      ? t("approvedOn", { date: dayOf(item.locale, row.effectiveFrom) })
                      : t("approvedUndated")}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {drafts.length > 0 && (
        <div className="mt-6 space-y-1.5">
          <Label htmlFor="dg-approval-day">{t("day")}</Label>
          <Input
            id="dg-approval-day"
            type="date"
            className="max-w-48"
            value={day}
            onChange={(e) =>
              onDraft({ ...draft, approval: { ...draft.approval, day: e.target.value } })
            }
          />
        </div>
      )}
    </>
  );
}
