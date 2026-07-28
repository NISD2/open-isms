"use client";

/**
 * SchemaForm — Drop-in form component driven by a Zod schema
 *
 * Usage:
 *   import { SchemaForm } from "@/lib/forms/schema-form";
 *   import { companyInsertSchema } from "@/schema/validators";
 *
 *   <SchemaForm
 *     schema={companyInsertSchema}
 *     onSubmit={(data) => createCompany(data)}
 *   />
 */
import {
  useForm,
  type DefaultValues,
  type FieldValues,
} from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { introspectSchema, type FieldMeta } from "./schema-introspect";
import { renderFieldInput, type FieldOverride } from "./field-renderer";
import { useLLMPrefill } from "./use-llm-prefill";
import { LLMPrefillButton, LLMPrefillModal } from "./llm-prefill-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// Props
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle-zod uses "strip" literal vs Zod v4's $strip symbol
interface SchemaFormProps<T extends z.ZodRawShape> {
  schema: z.ZodObject<T, any>;
  onSubmit: (data: z.infer<z.ZodObject<T>>) => void | Promise<void>;
  omit?: string[];
  fieldOverrides?: Record<string, FieldOverride>;
  defaultValues?: DefaultValues<z.infer<z.ZodObject<T>>>;
  columns?: 1 | 2 | 3;
  submitLabel?: string;
  isSubmitting?: boolean;
  className?: string;
  /** Optional: extra content rendered before the submit button (e.g. LLMPrefillButton) */
  actions?: React.ReactNode;
  /** When true, shows the LLM prefill button and modal */
  llmPrefill?: boolean;
  /** When true, all fields are disabled (read-only mode) */
  disabled?: boolean;
  /** i18n namespace for auto-resolving field labels (fields.{key}) and descriptions (fieldDescriptions.{key}) */
  translationNamespace?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Externally generic (onSubmit is typed), internally uses FieldValues
 * because field rendering is driven by runtime schema introspection.
 */
export function SchemaForm<T extends z.ZodRawShape>({
  schema,
  onSubmit,
  omit = ["id", "createdAt", "updatedAt"],
  fieldOverrides = {},
  defaultValues,
  columns = 1,
  submitLabel,
  isSubmitting = false,
  className,
  actions,
  llmPrefill = false,
  disabled = false,
  translationNamespace,
}: SchemaFormProps<T>) {
  const t = useTranslations("common");
  // Namespace is dynamic — cast needed because next-intl expects literal union
  const tNs = useTranslations((translationNamespace ?? "common") as Parameters<typeof useTranslations>[0]);
  const resolvedLabel = submitLabel ?? t("save");
  const selectPlaceholder = t("select");

  const fields = introspectSchema(
    schema as z.ZodObject<z.ZodRawShape>,
    omit,
  );

  // Validate only the fields the form renders. Omitted fields (companyId,
  // timestamps) are bound server-side; keeping them in the resolver schema
  // fails every submit on a field that has no rendered error slot.
  const omitMask = Object.fromEntries(
    omit.filter((k) => k in schema.shape).map((k) => [k, true as const]),
  );
  const resolverSchema = Object.keys(omitMask).length
    ? (schema as z.ZodObject<z.ZodRawShape>).omit(omitMask)
    : schema;

  // Internally FieldValues — the Zod schema enforces correctness at validation time.
  // zodResolver's Zod v4 overload needs explicit generic params to match.
  const form = useForm<FieldValues>({
    resolver: zodResolver<FieldValues, unknown, FieldValues>(
      resolverSchema as z.ZodType<FieldValues, FieldValues>,
    ),
    defaultValues: (defaultValues as FieldValues) ?? buildDefaults(fields),
    // Inline validation: surface errors when the field loses focus, then
    // re-validate on every keystroke so the error clears as the user fixes it.
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const resolveLabel = (f: FieldMeta) => {
    const override = fieldOverrides[f.key];
    const i18nKey = `fields.${f.key}`;
    return override?.label
      ?? (translationNamespace && tNs.has(i18nKey) ? tNs(i18nKey) : null)
      ?? f.label;
  };

  const prefill = useLLMPrefill<FieldValues>({
    form,
    fields: fields.map((f) => {
      const override = fieldOverrides[f.key];
      const opts = override?.options;
      const fieldLabel = resolveLabel(f);

      if (opts && opts.length > 0) {
        return {
          key: f.key,
          type: "enum",
          label: fieldLabel,
          required: f.required,
          enumValues: opts.map((o) => o.value),
        };
      }

      return {
        key: f.key,
        type: f.type,
        label: fieldLabel,
        required: f.required,
        enumValues: f.options ? Array.from(f.options) : undefined,
      };
    }),
  });

  // onSubmit is typed as (data: z.infer<ZodObject<T>>) externally.
  // Internally the data has been validated by zodResolver so the cast is safe.
  const handleSubmit = form.handleSubmit((data) =>
    onSubmit(data as z.infer<z.ZodObject<T>>),
  );

  const gridClass =
    columns === 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4"
      : columns === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
        : "space-y-4";

  return (
    <TooltipProvider>
    <Form {...form}>
      <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
        <div className={gridClass}>
          {fields.map((meta, idx) => {
            const override = fieldOverrides[meta.key];
            const colSpan = override?.colSpan ?? 1;
            const spanClass = columns > 1 && colSpan === 2 ? "md:col-span-2" : "";

            // Group separator: show when current field's group differs from previous
            const prevGroup = idx > 0 ? fieldOverrides[fields[idx - 1].key]?.group : undefined;
            const currentGroup = override?.group;
            const showGroupSep = columns > 1 && idx > 0 && currentGroup !== prevGroup && (currentGroup || prevGroup);

            // Resolve label: override > i18n > humanized
            const i18nLabelKey = `fields.${meta.key}`;
            const i18nDescKey = `fieldDescriptions.${meta.key}`;
            const label = override?.label
              ?? (translationNamespace && tNs.has(i18nLabelKey) ? tNs(i18nLabelKey) : null)
              ?? meta.label;
            const descriptionText = override?.description
              ?? (translationNamespace && tNs.has(i18nDescKey) ? tNs(i18nDescKey) : null);
            const infoIcon = descriptionText ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="inline h-3.5 w-3.5 ml-1 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  {descriptionText}
                </TooltipContent>
              </Tooltip>
            ) : null;

            if ((override?.component ?? meta.type) === "boolean") {
              return (
                <FormField
                  key={meta.key}
                  control={form.control}
                  name={meta.key}
                  render={({ field }) => (
                    <>
                      {showGroupSep && <Separator className="col-span-full my-1" />}
                      <FormItem data-field={meta.key} className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4", spanClass)}>
                        <FormControl>
                          {renderFieldInput(meta, field, override, selectPlaceholder, disabled)}
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            {label}
                            {infoIcon}
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    </>
                  )}
                />
              );
            }

            return (
              <FormField
                key={meta.key}
                control={form.control}
                name={meta.key}
                render={({ field }) => (
                  <>
                    {showGroupSep && <Separator className="col-span-full my-1" />}
                    <FormItem data-field={meta.key} className={spanClass}>
                      <FormLabel className={cn(meta.required && "font-semibold")}>
                        {label}
                        {!meta.required && (
                          <span className="ml-1 text-muted-foreground font-normal">
                            ({t("optional")})
                          </span>
                        )}
                        {infoIcon}
                      </FormLabel>
                      <FormControl>
                        {renderFieldInput(meta, field, override, selectPlaceholder, disabled)}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  </>
                )}
              />
            );
          })}
        </div>

        {!disabled && (
          <div className="flex items-center gap-3 pt-2">
            {actions}
            {llmPrefill && (
              <LLMPrefillButton open={prefill.open} isLoading={prefill.isLoading} />
            )}
            <Button type="submit" data-testid="schema-form-submit" disabled={isSubmitting}>
              {isSubmitting ? t("saving") : resolvedLabel}
            </Button>
          </div>
        )}
      </form>

      {llmPrefill && <LLMPrefillModal {...prefill} />}
    </Form>
    </TooltipProvider>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function buildDefaults(fields: FieldMeta[]): FieldValues {
  const defaults: FieldValues = {};

  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      defaults[f.key] = f.defaultValue;
    } else {
      switch (f.type) {
        case "boolean":
          defaults[f.key] = false;
          break;
        case "number":
          defaults[f.key] = undefined;
          break;
        case "date":
          // "" fails ISO-date validation and Postgres rejects ''::date
          defaults[f.key] = null;
          break;
        default:
          defaults[f.key] = "";
      }
    }
  }

  return defaults;
}
