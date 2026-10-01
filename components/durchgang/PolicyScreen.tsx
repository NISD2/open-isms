"use client";

import { Check, Plus, Printer, ScrollText } from "lucide-react";
import { useTranslations } from "next-intl";
import { policyParts, policySignature, policyTitle } from "@/lib/durchgang";
import { trpc } from "@/lib/trpc/client";
import { cn } from "@/lib/utils";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

const sameChoice = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id));

/**
 * A policy written from the template, shown as the document it becomes: the clauses to add on
 * top, then the text with the company's name and the signature line. The document comes from the
 * server in the record language and is assembled by the function the server stores, so what is
 * shown, printed and signed is what is written. Printing leaves only the document.
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
  if (!policyDraft.data) return null;
  const { document, company, clauses: stored } = policyDraft.data;

  const chosen = draft.clauses ?? stored;
  const approved = (policies.data ?? []).some(
    (p) => p.type === policyType && p.status === "approved",
  );
  const changed = draft.clauses !== null && !sameChoice(draft.clauses, stored);
  const toggle = (id: string) =>
    onDraft({
      ...draft,
      clauses: chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id],
    });

  return (
    <>
      <div className="print:hidden">
        <Heading>{entry.copy.title}</Heading>
        <Lead>{entry.copy.lead}</Lead>
      </div>

      <section className="mt-8 print:hidden">
        <p className="text-sm font-medium">{t("add")}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {document.clauses.map((clause) => {
            const on = chosen.includes(clause.id);
            return (
              <button
                key={clause.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(clause.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  on
                    ? "border-primary bg-primary/[0.06] text-foreground"
                    : "text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {on ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                {clause.label}
              </button>
            );
          })}
        </div>
        {approved && changed && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("changedAfterApproval")}
          </p>
        )}
      </section>

      <article className="mt-6 overflow-hidden rounded-2xl border bg-card shadow-sm print:mt-0 print:border-0 print:shadow-none">
        <header className="flex items-center gap-3 border-b bg-muted/40 px-5 py-3 print:hidden">
          <ScrollText className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{tUi("record")}</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            <Printer className="size-4" />
            {t("print")}
          </button>
        </header>
        <div className="space-y-6 px-5 py-6 sm:px-8 sm:py-8">
          <h2 className="text-xl font-semibold tracking-tight">
            {policyTitle(document, company)}
          </h2>
          {policyParts(document, chosen, company).map((part) => (
            <section key={part.heading}>
              <h3 className="font-semibold">{part.heading}</h3>
              <p className="mt-2 max-w-[68ch] text-[15px] leading-7 text-muted-foreground print:text-foreground">
                {part.text}
              </p>
            </section>
          ))}
        </div>
        <footer className="border-t bg-muted/20 px-5 py-5 sm:px-8">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <div className="h-8 border-b border-dashed border-foreground/30" />
              <p className="mt-2 text-xs text-muted-foreground print:text-foreground">
                {policySignature(document, company)}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 print:hidden dark:bg-amber-950 dark:text-amber-100">
              {tUi("pending")}
            </span>
          </div>
        </footer>
      </article>
    </>
  );
}
