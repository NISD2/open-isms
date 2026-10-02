"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import type { CryptoAlgorithmEntry } from "@/lib/compliance/policy-config-defaults";
import {
  CRYPTO_CATEGORIES,
  CRYPTO_STATUSES,
} from "@/lib/compliance/policy-config-schemas";
import { trpc } from "@/lib/trpc/client";
import { Heading, Lead } from "./ExplainScreens";
import type { Of, WorkProps } from "./WorkScreens";

const named = (e: CryptoAlgorithmEntry) =>
  e.keyLength ? `${e.algorithm} (${e.keyLength})` : e.algorithm;

/**
 * 9.1: the cryptographic methods the company accepts, shown as the list it is, by status and by
 * kind. A company without a list of its own sees the BSI TR-02102 list and ticks that it applies,
 * which takes it over; single entries are changed in the editor on the requirement page. The
 * cryptography policy on the next screen prints the accepted methods from this list.
 */
export function CryptoScreen({
  item,
  draft,
  onDraft,
  entry,
}: WorkProps & { entry: Of<"crypto"> }) {
  const crypto = trpc.durchgang.cryptoList.useQuery();
  if (!crypto.data) return null;
  const { stored, list } = crypto.data;

  return (
    <>
      <Heading>{entry.copy.title}</Heading>
      <Lead>{entry.copy.lead}</Lead>
      <article className="mt-8 overflow-hidden rounded-2xl border bg-card shadow-sm">
        <header className="flex flex-wrap items-center gap-3 border-b bg-muted/40 px-5 py-3">
          <LockKeyhole className="size-4 text-muted-foreground" />
          <p className="text-sm font-medium">{entry.copy.document}</p>
          <p className="ml-auto text-xs text-muted-foreground">
            {stored ? entry.copy.own : entry.copy.bsi}
          </p>
        </header>
        <div className="divide-y">
          {CRYPTO_STATUSES.map((status) => {
            const entries = list.algorithms.filter((e) => e.status === status);
            if (entries.length === 0) return null;
            return (
              <section key={status} className="px-5 py-4">
                <h3 className="text-sm font-semibold">{entry.copy.status[status]}</h3>
                <dl className="mt-2 space-y-1.5 text-sm">
                  {CRYPTO_CATEGORIES.map((category) => {
                    const names = entries
                      .filter((e) => e.category === category)
                      .map(named);
                    return names.length > 0 ? (
                      <div
                        key={category}
                        className="grid gap-x-4 gap-y-0.5 sm:grid-cols-[11rem_minmax(0,1fr)]"
                      >
                        <dt className="text-muted-foreground">
                          {entry.copy.categories[category]}
                        </dt>
                        <dd className="break-words">{names.join(", ")}</dd>
                      </div>
                    ) : null;
                  })}
                </dl>
              </section>
            );
          })}
        </div>
      </article>

      {!stored && (
        <Label
          htmlFor="dg-crypto-applies"
          className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 font-normal transition-colors hover:border-primary/40 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/[0.05]"
        >
          <Checkbox
            id="dg-crypto-applies"
            className="mt-0.5"
            checked={draft.adopt}
            onCheckedChange={(on) => onDraft({ ...draft, adopt: on === true })}
          />
          <span className="text-[15px] font-medium">{entry.copy.applies}</span>
        </Label>
      )}
      <Link
        href={{
          pathname: "/compliance/[categorySlug]/[requirementCode]",
          params: { categorySlug: item.categorySlug, requirementCode: item.code },
        }}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        {entry.copy.change}
        <ArrowRight className="size-3.5" />
      </Link>
    </>
  );
}
