"use client";

/** Pieces the supplier's form and the customer's read-only answers share. */
import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { QuestionView } from "@/lib/supplier-portal/questionnaire-view";
import { cn } from "@/lib/utils";

/**
 * The provision a question rests on and the ISO/IEC 27001 controls it serves, as one quiet line
 * under its help.
 */
export function BasisLine({ question }: { readonly question: QuestionView }) {
  const t = useTranslations("supplierPortal.questionnaire");
  return (
    <p className="pt-0.5 text-xs text-muted-foreground/80">
      <span className="font-medium">{t("basis")}:</span> {question.basis}
      {question.iso27001.length > 0 && (
        <>
          <span aria-hidden> · </span>
          ISO/IEC 27001:2022 {question.iso27001.join(", ")}
        </>
      )}
    </p>
  );
}

type Option<T> = { readonly value: T; readonly label: string };

/**
 * One answer from a short list, as a native radio group. Starts with none chosen; the question has
 * not been answered until one is. The browser gives it the radio keyboard behaviour (Tab in,
 * arrow keys between options). Two short options sit side by side as one control; longer ones
 * stack.
 */
function RadioGroup<T extends string | boolean>({
  name,
  labelledBy,
  value,
  options,
  onChange,
  stacked,
}: {
  readonly name: string;
  readonly labelledBy: string;
  readonly value: T | null;
  readonly options: readonly Option<T>[];
  readonly onChange: (value: T) => void;
  readonly stacked: boolean;
}) {
  return (
    <fieldset
      aria-labelledby={labelledBy}
      className={
        stacked
          ? "grid gap-2"
          : "inline-flex rounded-lg border border-border bg-background p-0.5"
      }
    >
      {options.map((option) => {
        const chosen = value === option.value;
        return (
          <label
            key={String(option.value)}
            className={cn(
              "flex cursor-pointer items-center text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
              stacked
                ? "min-h-11 gap-3 rounded-lg border px-4 py-2.5"
                : "min-h-9 min-w-16 justify-center rounded-md px-4 font-medium",
              stacked &&
                (chosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted"),
              !stacked &&
                (chosen
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"),
            )}
          >
            <input
              type="radio"
              name={name}
              value={String(option.value)}
              checked={chosen}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {stacked && (
              <span
                aria-hidden
                className={cn(
                  "size-4 shrink-0 rounded-full border",
                  chosen ? "border-[5px] border-primary" : "border-muted-foreground/50",
                )}
              />
            )}
            {option.label}
          </label>
        );
      })}
    </fieldset>
  );
}

type ValueProps<T> = {
  readonly name: string;
  readonly labelledBy: string;
  readonly value: T | null;
  readonly onChange: (value: T) => void;
};

/** Ja / Nein. */
export function YesNoValue(props: ValueProps<boolean>) {
  const t = useTranslations("supplierPortal.questionnaire");
  const options = [
    { value: true, label: t("yes") },
    { value: false, label: t("no") },
  ] as const;
  return <RadioGroup {...props} options={options} stacked={false} />;
}

/** One of a question's options (`type: "enum"`). */
export function ChoiceValue({
  options,
  ...props
}: ValueProps<string> & { readonly options: QuestionView["options"] }) {
  return <RadioGroup {...props} options={options} stacked />;
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
