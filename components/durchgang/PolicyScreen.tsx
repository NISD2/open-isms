"use client";

import { Check, Plus, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  type PolicyPart,
  policyNames,
  policyParts,
  policySignature,
  policyTitle,
} from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

const sameChoice = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/** How long a section just added stays lit in the document. */
const LIT_MS = 2400;

/** The last clause the person switched, so the screen can show what changed. */
type Change = { readonly id: string; readonly on: boolean };

/**
 * One clause to add. A mouse sees the clause's text on hover before adding it; a tap adds it at
 * once, and the screen then shows the text that went in, so a phone loses nothing.
 */
function ClauseChip({
  label,
  preview,
  on,
  onToggle,
}: {
  label: string;
  preview: string;
  on: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-pressed={on}
          onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
          onClick={(e) => {
            // The popover is the hover preview only; a click toggles the clause, and the card
            // under the chips then shows what went in.
            e.preventDefault();
            setOpen(false);
            onToggle();
          }}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
            on
              ? "border-primary bg-primary/[0.06] text-foreground"
              : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
          )}
        >
          {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="pointer-events-none w-80 max-w-[calc(100vw-2rem)] p-3 text-left text-sm leading-6"
      >
        {preview}
      </PopoverContent>
    </Popover>
  );
}

/**
 * A policy written from the template, shown as the document it becomes: the clauses to add on
 * top, a line of the company's own, then the text with the company's name, the item's answers
 * and the approval line. The document comes from the server in the record language and is
 * assembled by the function the server stores, so what is shown and approved is what is written.
 * The answers are the ones on this item's earlier screens, which the queue saves before it writes
 * the policy. Switching a clause shows at once what it put in or took out.
 */
export function PolicyScreen({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"policy"> }) {
  const t = useTranslations("durchgang.ui.policy");
  const tUi = useTranslations("durchgang.ui");
  const policyType = entry.screen.policy;
  const policyDraft = trpc.durchgang.policyDraft.useQuery({ code: item.code });
  const policies = trpc.policy.list.useQuery();
  const [change, setChange] = useState<Change | null>(null);
  const [lit, setLit] = useState<string | null>(null);
  const sections = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    if (!lit) return;
    const off = setTimeout(() => setLit(null), LIT_MS);
    return () => clearTimeout(off);
  }, [lit]);

  if (!policyDraft.data) return null;
  const { document, company, clauses: stored, own: storedOwn, lists } = policyDraft.data;
  const names = {
    ...policyNames(company, Object.keys(item.fields), draft.values),
    ...lists,
  };

  const chosen = draft.clauses ?? stored;
  const own = draft.own ?? storedOwn;
  const parts = policyParts(document, chosen, names, own);
  const approved = (policies.data ?? []).some(
    (p) => p.type === policyType && p.status === "approved",
  );
  const changed =
    (draft.clauses !== null && !sameChoice(draft.clauses, stored)) ||
    (draft.own !== null && draft.own.trim() !== storedOwn.trim());
  const toggle = (id: string) => {
    const on = !chosen.includes(id);
    onDraft({
      ...draft,
      clauses: on ? [...chosen, id] : chosen.filter((c) => c !== id),
    });
    setChange({ id, on });
    setLit(on ? id : null);
  };
  const preview = (id: string) =>
    policyParts(document, [id], names, "").find((p) => p.clause === id)?.text ?? "";
  const added = change?.on ? parts.find((p) => p.clause === change.id) : undefined;
  const removed =
    change && !change.on ? document.clauses.find((c) => c.id === change.id) : undefined;
  const show = (part: PolicyPart) =>
    sections.current
      .get(part.heading)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>

      <section className="mt-8">
        <p className="text-sm font-semibold">{t("question")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("questionHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {document.clauses.map((clause) => (
            <ClauseChip
              key={clause.id}
              label={clause.label}
              preview={preview(clause.id)}
              on={chosen.includes(clause.id)}
              onToggle={() => toggle(clause.id)}
            />
          ))}
        </div>
        <div aria-live="polite">
          {added && (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.04] p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                <Check className="size-3.5" />
                {t("added")}
              </p>
              <p className="mt-1.5 text-sm font-semibold">{added.heading}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{added.text}</p>
              <button
                type="button"
                onClick={() => show(added)}
                className="mt-2 cursor-pointer text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("showInPlan")}
              </button>
            </div>
          )}
          {removed && (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("removed", { label: removed.label })}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-1.5">
          <Label htmlFor="dg-policy-own" className="text-sm font-semibold">
            {t("ownLabel")}
          </Label>
          <p className="text-sm text-muted-foreground">{t("ownHint")}</p>
          <Textarea
            id="dg-policy-own"
            className="mt-2 min-h-20 rounded-xl text-base"
            maxLength={2000}
            value={own}
            onChange={(e) => onDraft({ ...draft, own: e.target.value })}
          />
        </div>
        {approved && changed && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("changedAfterApproval")}
          </p>
        )}
      </section>

      <article className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3">
          <ScrollText className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{tUi("record")}</p>
        </header>
        <div className="space-y-2 px-3 py-6 sm:px-6 sm:py-8">
          <h2 className="px-2 text-xl font-semibold tracking-tight">
            {policyTitle(document, names)}
          </h2>
          {parts.map((part) => (
            <section
              key={part.heading}
              ref={(el) => {
                if (el) sections.current.set(part.heading, el);
                else sections.current.delete(part.heading);
              }}
              className={cn(
                "scroll-mt-24 rounded-xl px-2 py-3 transition-colors duration-700",
                part.clause !== null && part.clause === lit && "bg-primary/[0.08]",
              )}
            >
              <h3 className="font-semibold">{part.heading}</h3>
              <p className="mt-2 max-w-[68ch] text-[15px] leading-7 whitespace-pre-line text-muted-foreground">
                {part.text}
              </p>
            </section>
          ))}
        </div>
        <footer className="border-t bg-muted/20 px-5 py-5 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">{policySignature(document, names)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("approvedLater")}</p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
              {tUi("pending")}
            </span>
          </div>
        </footer>
      </article>
    </>
  );
}
