"use client";

import { ChevronRight, Workflow } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { type ItemState, itemHref } from "@/lib/durchgang";
import type { HeadStart } from "./view";

/** The walk home's word for each state, so a NIS 2 item reads the same here as on its own path. */
const STATE_KEY = {
  open: "open",
  waiting: "waiting",
  filled: "filled",
  declined: "declined",
  signed: "signed",
  not_applicable: "notApplicable",
} as const satisfies Record<ItemState["kind"], string>;

/**
 * On a GDPR item's first screen: the NIS 2 items whose work gives it a head start, where the
 * company stands on each, and what the GDPR still asks. Each row leads to its NIS 2 item.
 */
export function HeadStartCard({ start }: { start: HeadStart }) {
  const t = useTranslations("durchgang.ui");
  return (
    <section className="mt-8 max-w-[62ch] rounded-2xl border bg-card p-5">
      <p className="flex items-center gap-2 font-medium">
        <Workflow className="size-4 text-primary" aria-hidden />
        {t("fromNis2.title")}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{start.gap}</p>
      <ul className="mt-4 divide-y rounded-xl border">
        {start.items.map((item) => (
          <li
            key={item.code}
            className="relative flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 has-[a:focus-visible]:ring-2"
          >
            <span className="w-10 shrink-0 text-sm tabular-nums text-muted-foreground">
              {item.code}
            </span>
            <Link
              href={itemHref("nis2", item.code)}
              className="min-w-0 flex-1 truncate text-sm after:absolute after:inset-0"
            >
              {item.title}
            </Link>
            <span className="shrink-0 text-xs text-muted-foreground">
              {t(`home.${STATE_KEY[item.state.kind]}`)}
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">{t("fromNis2.note")}</p>
    </section>
  );
}
