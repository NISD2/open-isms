"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { z } from "zod";
import type { DefaultValues } from "react-hook-form";
import type { FieldOverride } from "@/lib/forms/field-renderer";
import { SchemaForm } from "@/lib/forms/schema-form";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Item = Record<string, unknown>;

// biome-ignore lint/suspicious/noExplicitAny: drizzle-zod uses the "strip" literal where Zod v4 expects its $strip symbol
interface CrudPageProps<T extends z.ZodRawShape> {
  items: Item[];
  icon: React.ReactNode;
  namespace: string;
  schema: z.ZodObject<T, any>;
  omit?: string[];
  fieldOverrides?: Record<string, FieldOverride>;
  inline?: boolean;
  formColumns?: 1 | 2 | 3;
  /** Awaited before the create form clears, so a caller passing `mutateAsync`
   *  keeps the input on screen when the write fails. */
  onCreate?: (data: z.infer<z.ZodObject<T>>) => void | Promise<unknown>;
  onUpdate?: (id: string, data: z.infer<z.ZodObject<T>>) => void | Promise<unknown>;
  onDelete?: (id: string) => void;
  isSubmitting?: boolean;
  llmPrefill?: boolean;
  children: (props: {
    items: Item[];
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
  }) => React.ReactNode;
}

export function CrudPage<T extends z.ZodRawShape>({
  items,
  icon,
  namespace,
  schema,
  omit,
  fieldOverrides,
  inline = false,
  formColumns = 2,
  onCreate,
  onUpdate,
  onDelete,
  isSubmitting,
  llmPrefill = false,
  children,
}: CrudPageProps<T>) {
  const t = useTranslations(namespace);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticItems, removeOptimistic] = useOptimistic(
    items,
    (current: Item[], deletedId: string) => current.filter((i) => i.id !== deletedId),
  );

  return (
    <div className={inline ? "" : "mx-auto max-w-7xl"}>
      {!inline && (
        <PageHeader
          icon={icon}
          title={t("title")}
          description={t("description")}
          helpText={t("helpText")}
        />
      )}

      {optimisticItems.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-10 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-6">
          {children({
            items: optimisticItems,
            onEdit: setEditItem,
            onDelete: (id) => {
              if (onDelete && window.confirm(t("deleteConfirm"))) {
                startTransition(() => {
                  removeOptimistic(id);
                  onDelete(id);
                });
              }
            },
          })}
        </Card>
      )}

      {(editItem || onCreate) && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editItem ? t("edit") : t("add")}</CardTitle>
            {editItem && (
              <Button variant="ghost" size="icon" onClick={() => setEditItem(null)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <SchemaForm
              key={editItem ? (editItem.id as string) : "create"}
              schema={schema}
              defaultValues={editItem as DefaultValues<z.infer<z.ZodObject<T>>> ?? undefined}
              // The create form stays open under the table, so it has to clear
              // itself: leaving the saved row's values in place made adding a
              // second item look like editing the first. Editing keeps its
              // values — the card closes on save anyway.
              resetOnSubmit={!editItem}
              onSubmit={async (data) => {
                if (editItem && onUpdate) {
                  await onUpdate(editItem.id as string, data);
                } else if (onCreate) {
                  await onCreate(data);
                }
                setEditItem(null);
              }}
              omit={omit}
              columns={formColumns}
              isSubmitting={isSubmitting}
              fieldOverrides={fieldOverrides}
              llmPrefill={llmPrefill}
              translationNamespace={namespace}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
