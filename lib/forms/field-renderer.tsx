"use client";

/**
 * Field Renderer — Maps FieldMeta to shadcn/ui components
 */
import type { ControllerRenderProps, FieldValues } from "react-hook-form";
import type { FieldMeta } from "./schema-introspect";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ============================================================================
// Field Override Config
// ============================================================================

export interface LabeledOption {
  value: string;
  label: string;
}

export interface FieldOverride {
  component?: FieldMeta["type"] | "multiselect" | "combobox" | "radio" | "hidden";
  label?: string;
  description?: string;
  placeholder?: string;
  options?: LabeledOption[];
  unit?: string;
  colSpan?: 1 | 2;
  group?: string;
  render?: (
    field: ControllerRenderProps<FieldValues>,
    meta: FieldMeta,
  ) => React.ReactNode;
}

// ============================================================================
// Render Function
// ============================================================================

export function renderFieldInput(
  meta: FieldMeta,
  field: ControllerRenderProps<FieldValues>,
  override?: FieldOverride,
  selectPlaceholder?: string,
  disabled?: boolean,
): React.ReactNode {
  if (override?.render) {
    return override.render(field, meta);
  }

  const effectiveType = override?.component ?? meta.type;
  const placeholder = override?.placeholder ?? "";

  switch (effectiveType) {
    case "text":
      return (
        <Input
          type="text"
          placeholder={placeholder}
          minLength={meta.minLength}
          maxLength={meta.maxLength}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
        />
      );

    case "email":
      return (
        <Input
          type="email"
          placeholder={placeholder || "email@example.com"}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
        />
      );

    case "url":
      return (
        <Input
          type="url"
          placeholder={placeholder || "https://..."}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
        />
      );

    case "textarea":
      return (
        <Textarea
          placeholder={placeholder}
          maxLength={meta.maxLength}
          rows={4}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
        />
      );

    case "number": {
      const unit = override?.unit;
      const input = (
        <Input
          type="number"
          min={meta.min}
          max={meta.max}
          step={meta.isInteger ? 1 : "any"}
          placeholder={placeholder}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
          onChange={(e) => {
            const val = e.target.valueAsNumber;
            field.onChange(Number.isNaN(val) ? null : val);
          }}
        />
      );
      if (unit) {
        return (
          <div className="flex items-center gap-2">
            {input}
            <span className="text-sm text-muted-foreground shrink-0">{unit}</span>
          </div>
        );
      }
      return input;
    }

    case "boolean":
      return (
        <Checkbox
          checked={field.value ?? false}
          onCheckedChange={field.onChange}
          disabled={disabled}
        />
      );

    case "file":
      // File uploads are handled by FileUpload component via custom render override.
      // This fallback captures filename only (for forms without S3 integration).
      if (disabled && field.value) {
        return <Input type="text" value={field.value} disabled />;
      }
      return (
        <Input
          type="file"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) field.onChange(f.name);
          }}
        />
      );

    case "enum": {
      const options = resolveOptions(override, meta);
      return (
        <Select onValueChange={field.onChange} value={field.value ?? ""} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={selectPlaceholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "multiselect": {
      const options = resolveOptions(override, meta);
      const selected: string[] = Array.isArray(field.value) ? field.value : [];
      const toggle = (val: string, checked: boolean) => {
        field.onChange(
          checked ? [...selected, val] : selected.filter((v) => v !== val)
        );
      };
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center space-x-2">
              <Checkbox
                id={`${field.name}-${opt.value}`}
                checked={selected.includes(opt.value)}
                onCheckedChange={(checked) => toggle(opt.value, !!checked)}
                disabled={disabled}
              />
              <Label
                htmlFor={`${field.name}-${opt.value}`}
                className="text-sm font-normal"
              >
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      );
    }

    case "date": {
      const dateValue = field.value instanceof Date
        ? field.value.toISOString().slice(0, 10)
        : typeof field.value === "string" && field.value
          ? field.value.slice(0, 10)
          : "";
      return (
        <Input
          type="date"
          disabled={disabled}
          {...field}
          value={dateValue}
          onChange={(e) => {
            field.onChange(e.target.value || "");
          }}
        />
      );
    }

    case "hidden":
      return <input type="hidden" {...field} />;

    default:
      return (
        <Input
          type="text"
          placeholder={placeholder}
          disabled={disabled}
          {...field}
          value={field.value ?? ""}
        />
      );
  }
}

// ============================================================================
// Helpers
// ============================================================================

/** Resolve labeled options from override (preferred) or meta (fallback with humanize) */
function resolveOptions(override?: FieldOverride, meta?: FieldMeta): LabeledOption[] {
  if (override?.options?.length) return override.options;
  if (meta?.options?.length) {
    return meta.options.map((val) => ({ value: val, label: humanizeOption(val) }));
  }
  return [];
}

function humanizeOption(value: string): string {
  return value
    .replace(/[_-]/g, " ")
    .replace(/^./, (c) => c.toUpperCase());
}
