import { useState, useCallback } from "react";
import type { UseFormReturn, FieldValues, Path, PathValue } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";

export interface LLMFieldMeta {
  key: string;
  type: string;
  label: string;
  required: boolean;
  enumValues?: string[];
}

export interface UseLLMPrefillOptions<T extends FieldValues> {
  form: UseFormReturn<T>;
  fields?: LLMFieldMeta[];
  excludeFields?: string[];
  language?: "de" | "en";
  context?: string;
  onSuccess?: (data: Partial<T>) => void;
  onError?: (error: string) => void;
}

export interface UseLLMPrefillReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  isLoading: boolean;
  error: string | null;
  filledCount: number;
  submit: (text: string) => Promise<void>;
}

export function useLLMPrefill<T extends FieldValues>(
  options: UseLLMPrefillOptions<T>,
): UseLLMPrefillReturn {
  const {
    form,
    fields = [],
    excludeFields = [],
    language = "en",
    context,
    onSuccess,
    onError,
  } = options;

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filledCount, setFilledCount] = useState(0);

  const extract = trpc.llm.extract.useMutation();

  const open = useCallback(() => {
    setIsOpen(true);
    setError(null);
    setFilledCount(0);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const submit = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setError("Please paste some text first.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await extract.mutateAsync({
          text,
          fields,
          language,
          context,
        });

        let filled = 0;
        for (const [key, value] of Object.entries(data)) {
          if (excludeFields.includes(key)) continue;
          if (value === null || value === undefined) continue;

          form.setValue(key as Path<T>, value as PathValue<T, Path<T>>, {
            shouldValidate: true,
            shouldDirty: true,
          });
          filled++;
        }

        setFilledCount(filled);
        onSuccess?.(data as Partial<T>);
        setTimeout(() => setIsOpen(false), 800);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Extraction failed";
        setError(msg);
        onError?.(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [form, extract, fields, excludeFields, language, context, onSuccess, onError],
  );

  return { isOpen, open, close, isLoading, error, filledCount, submit };
}
