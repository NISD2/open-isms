"use client";

import { CircleQuestionMark, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * The one in-product offer of help: a single line, pointing at /hilfe.
 *
 * Deliberately a link and not a panel. It sits beside "Im Kurs ansehen" in the
 * requirement sidebar and at the end of the course, and in both places it has
 * to read as one more thing available rather than an interruption. The offer
 * itself (free short questions, referral at no cost, and how we earn from it)
 * lives on /hilfe, which is public, so the disclosure stays in one place
 * rather than being restated at every surface that links to it.
 *
 * Opens in a new tab: every caller renders it next to work in progress, and a
 * same-tab navigation would discard unsaved answers.
 */
export function StuckLink({
  requirementCode,
  className,
}: {
  /** Where the reader was, carried through so the request form can prefill. */
  requirementCode?: string;
  className?: string;
}) {
  const t = useTranslations("help");

  return (
    <Link
      href={
        requirementCode
          ? { pathname: "/hilfe", query: { req: requirementCode } }
          : "/hilfe"
      }
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <CircleQuestionMark className="h-3.5 w-3.5 shrink-0 text-primary" />
      {t("inApp.stuck")}
      <ExternalLink className="h-3 w-3" />
    </Link>
  );
}
