"use client";

/** Pieces the supplier's form and the customer's read-only answers share. */
import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export { isAnswered } from "@/lib/supplier-portal/answered";

/** The provision a question rests on, as one quiet line under its help. */
export function BasisLine({ basis }: { readonly basis: string }) {
  const t = useTranslations("supplierPortal.questionnaire");
  return (
    <p className="pt-0.5 text-xs text-muted-foreground/80">
      <span className="font-medium">{t("basis")}:</span> {basis}
    </p>
  );
}

/**
 * Ja / Nein as a native radio group drawn as two buttons. Starts with neither chosen; the
 * question has not been answered until one is. The browser gives it the radio keyboard
 * behaviour (Tab in, arrow keys between the two).
 */
export function YesNoValue({
  name,
  labelledBy,
  value,
  onChange,
}: {
  readonly name: string;
  readonly labelledBy: string;
  readonly value: boolean | null;
  readonly onChange: (value: boolean) => void;
}) {
  const t = useTranslations("supplierPortal.questionnaire");
  const options = [
    { answer: true, label: t("yes") },
    { answer: false, label: t("no") },
  ] as const;
  return (
    <fieldset
      aria-labelledby={labelledBy}
      className="inline-flex rounded-lg border border-border bg-background p-0.5"
    >
      {options.map(({ answer, label }) => {
        const chosen = value === answer;
        return (
          <label
            key={label}
            className={cn(
              "flex min-h-9 min-w-16 cursor-pointer items-center justify-center rounded-md px-4 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              chosen
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(answer)}
              checked={chosen}
              onChange={() => onChange(answer)}
              className="sr-only"
            />
            {label}
          </label>
        );
      })}
    </fieldset>
  );
}

/** A yes/no answer as the customer reads it. */
export function YesNoAnswer({ value }: { readonly value: unknown }) {
  const t = useTranslations("supplierPortal.questionnaire");
  if (value === true)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Check className="size-4 text-primary" aria-hidden />
        {t("yes")}
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
        <Minus className="size-4" aria-hidden />
        {t("no")}
      </span>
    );
  return <span className="text-sm italic text-muted-foreground">{t("unanswered")}</span>;
}
