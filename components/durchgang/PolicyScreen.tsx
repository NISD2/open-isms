"use client";

import { Check, Plus, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { policyNames, policyParts, policySignature, policyTitle } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

const sameChoice = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/** How long a section just added stays lit in the document. */
const LIT_MS = 2400;

/**
 * One clause to add. A mouse sees the clause's text on hover before adding it; a tap adds it at
 * once, and it appears lit in the document right above the choices.
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
            // The popover is the hover preview only; a click toggles the clause, which then
            // lights up in the document above.
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
 * A policy written from the template, shown as the document it becomes and read first: the text
 * with the company's name, the item's answers and the approval line. Below it, the clauses to add,
 * a section in the company's own words, and the confirmation that the person has read it, which
 * the screen waits for. The document comes from the server in the record language and is
 * assembled by the function the server stores, so what is shown and approved is what is written.
 * The answers are the ones on this item's earlier screens, which the queue saves before it writes
 * the policy. A clause switched on lights up in the document, which sits right above the choices.
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
  const [lit, setLit] = useState<string | null>(null);

  useEffect(() => {
    if (!lit) return;
    const off = setTimeout(() => setLit(null), LIT_MS);
    return () => clearTimeout(off);
  }, [lit]);

  if (!policyDraft.data) return null;
  const {
    document,
    language,
    company,
    clauses: stored,
    own: storedOwn,
    lists,
  } = policyDraft.data;
  // The document stays in the record language it is written in; the choices under it speak the
  // reader's, matched by the clause's id.
  const read = entry.copy.document;
  const readClause = new Map(read.clauses.map((c) => [c.id, c]));
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
    // A changed text has to be read again.
    onDraft({
      ...draft,
      clauses: on ? [...chosen, id] : chosen.filter((c) => c !== id),
      read: false,
    });
    setLit(on ? id : null);
  };
  const preview = (id: string) =>
    policyParts(readClause.has(id) ? read : document, [id], names, "").find(
      (p) => p.clause === id,
    )?.text ?? "";

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>

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
              className={cn(
                "rounded-xl px-2 py-3 transition-colors duration-700",
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

      <section className="mt-8">
        <p className="text-sm font-semibold">{t("question")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("questionHint")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {document.clauses.map((clause) => (
            <ClauseChip
              key={clause.id}
              label={readClause.get(clause.id)?.label ?? clause.label}
              preview={preview(clause.id)}
              on={chosen.includes(clause.id)}
              onToggle={() => toggle(clause.id)}
            />
          ))}
        </div>
        {language !== item.locale && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t(`recordLanguage.${language}`)}
          </p>
        )}

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
            onChange={(e) => onDraft({ ...draft, own: e.target.value, read: false })}
          />
        </div>
        {approved && changed && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("changedAfterApproval")}
          </p>
        )}

        <Label
          htmlFor="dg-policy-read"
          className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
        >
          <Checkbox
            id="dg-policy-read"
            className="mt-0.5"
            checked={draft.read}
            onCheckedChange={(on) => onDraft({ ...draft, read: on === true })}
          />
          <span className="text-[15px] font-medium">{t("read")}</span>
        </Label>
      </section>
    </>
  );
}
