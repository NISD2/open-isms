"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { introspectSchema, type FieldMeta } from "@/lib/forms/schema-introspect";
import { renderFieldInput } from "@/lib/forms/field-renderer";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  Clock,
  Info,
  PenTool,
  Shield,
  User,
  UserPlus,
} from "lucide-react";
import { AssignmentPopover } from "@/components/compliance/AssignmentPopover";
import { FileUpload } from "@/components/compliance/FileUpload";
import { cn } from "@/lib/utils";

// ============================================================================
// Props
// ============================================================================

interface BsiContext {
  grundschutzModule: string | null;
  threatLandscape: string | null;
  bsiGuidance: string | null;
}

interface CategoryOwner {
  userId: string;
  userName: string | null;
}

interface CategoryIntakeFormProps {
  categoryCode: string;
  assessmentId: string;
  categoryId: string;
  existingAnswers: Record<string, unknown>;
  companyProfile: Record<string, unknown>;
  operationalCounts: Record<string, number>;
  bsiContext: BsiContext;
  signedOffAt: string | null;
  categoryOwner: CategoryOwner | null;
  canSubmit: boolean;
  isAdmin: boolean;
  fieldFrequencies: Record<string, string>;
  uploadFieldStatusMap: Record<string, string>;
}

// ============================================================================
// Component
// ============================================================================

const FREQUENCY_I18N: Record<string, string> = {
  "one-time": "frequencyOneTime",
  "monthly": "frequencyMonthly",
  "quarterly": "frequencyQuarterly",
  "semi-annual": "frequencySemiAnnual",
  "annual": "frequencyAnnual",
  "every-3-years": "frequencyEvery3Years",
  "on-change": "frequencyOnChange",
  "ongoing": "frequencyOngoing",
};

export function CategoryIntakeForm({
  categoryCode,
  assessmentId,
  categoryId,
  existingAnswers,
  companyProfile,
  operationalCounts,
  bsiContext,
  signedOffAt,
  categoryOwner,
  canSubmit,
  isAdmin,
  fieldFrequencies,
  uploadFieldStatusMap,
}: CategoryIntakeFormProps) {
  const t = useTranslations("intake");
  const tc = useTranslations("common");
  const tForm = useTranslations("form");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completionPct, setCompletionPct] = useState(0);
  const isSignedOff = !!signedOffAt;
  const [isEditing, setIsEditing] = useState(!isSignedOff);

  const schema = CATEGORY_SCHEMAS[categoryCode];
  if (!schema) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">{t("noSchema")}</p>
      </div>
    );
  }

  const fields = introspectSchema(schema, []);

  const saveMutation = trpc.intake.save.useMutation();
  const submitMutation = trpc.intake.submit.useMutation();

  // Build default values from existing answers
  const defaultValues: FieldValues = {};
  for (const f of fields) {
    const existing = existingAnswers[f.key];
    if (existing !== undefined && existing !== null) {
      defaultValues[f.key] = existing;
    } else if (f.type === "boolean") {
      defaultValues[f.key] = false;
    } else {
      defaultValues[f.key] = "";
    }
  }

  const form = useForm<FieldValues>({
    resolver: zodResolver<FieldValues, unknown, FieldValues>(
      schema as z.ZodType<FieldValues, FieldValues>,
    ),
    defaultValues,
  });

  // Calculate completion from current values
  const updateCompletion = useCallback((values: FieldValues) => {
    const required = fields.filter((f) => f.required);
    const filled = required.filter((f) => {
      const val = values[f.key];
      if (val === undefined || val === null || val === "") return false;
      return true;
    });
    setCompletionPct(required.length > 0 ? Math.round((filled.length / required.length) * 100) : 0);
  }, [fields]);

  // Track completion locally as fields change
  useEffect(() => {
    const subscription = form.watch((values) => {
      updateCompletion(values as FieldValues);
    });
    return () => subscription.unsubscribe();
  }, [form, updateCompletion]);

  // Initialize completion on mount
  useEffect(() => {
    updateCompletion(form.getValues());
  }, [form, updateCompletion]);

  function handleSubmit() {
    startTransition(async () => {
      // Save first, then submit
      const values = form.getValues();
      try {
        await saveMutation.mutateAsync({
          assessmentId,
          categoryId,
          categoryCode,
          answers: values as Record<string, unknown>,
        });
        await submitMutation.mutateAsync({
          assessmentId,
          categoryId,
          categoryCode,
        });
        toast.success(t("submitted"));
        router.refresh();
      } catch {
        toast.error(t("submitFailed"));
      }
    });
  }

  // Profile fields to display
  const profileEntries = Object.entries(companyProfile).filter(
    ([, v]) => v !== null && v !== undefined && v !== "",
  );

  // Operational module counts
  const opEntries = Object.entries(operationalCounts).filter(([, v]) => v > 0);

  const requiredCount = fields.filter((f) => f.required).length;
  const filledCount = Math.round((completionPct / 100) * requiredCount);

  return (
    <div className="space-y-6">
      {/* BSI Context Header */}
      {(bsiContext.bsiGuidance || bsiContext.grundschutzModule) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">{t("bsiContext")}</CardTitle>
              {bsiContext.grundschutzModule && (
                <Badge variant="secondary" className="ml-auto">
                  {t("grundschutzModule")}: {bsiContext.grundschutzModule}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {bsiContext.bsiGuidance && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {bsiContext.bsiGuidance}
              </p>
            )}
            {bsiContext.threatLandscape && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {t("threatLandscape")}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {bsiContext.threatLandscape}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form — 2/3 width */}
        <div className="lg:col-span-2 space-y-4">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <Progress value={completionPct} className="flex-1" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {t("fieldProgress", {
                completed: filledCount,
                total: requiredCount,
              })}
            </span>
            {isSignedOff && !isEditing && (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {t("statusSignedOff")}
              </Badge>
            )}
            {isSignedOff && !isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <PenTool className="mr-1.5 h-3.5 w-3.5" />
                {tForm("edit")}
              </Button>
            )}
          </div>

          {isSignedOff && !isEditing && (
            <div className="rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
              <CheckCircle2 className="inline h-4 w-4 mr-1" />
              {t("alreadySignedOff", {
                date: new Date(signedOffAt).toLocaleDateString(),
              })}
            </div>
          )}

          {/* Form Fields */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("completeSection")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAdmin && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">{t("responsiblePerson")}</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">{t("responsiblePersonDescription")}</p>
                  <AssignmentPopover
                    assessmentId={assessmentId}
                    categoryId={categoryId}
                    owner={categoryOwner ? { userId: categoryOwner.userId, userName: categoryOwner.userName ?? "" } : null}
                  />
                </div>
              )}
              <Form {...form}>
                <form className="space-y-4">
                  {fields.map((meta) => {
                    const freq = fieldFrequencies[meta.key];
                    const freqBadge = freq ? (
                      <Badge variant="outline" className="ml-2 gap-1 text-xs font-normal">
                        <Clock className="h-3 w-3" />
                        {t(FREQUENCY_I18N[freq] ?? freq)}
                      </Badge>
                    ) : null;

                    if (meta.type === "boolean") {
                      const uploadStatusId = uploadFieldStatusMap[meta.key];
                      return (
                        <FormField
                          key={meta.key}
                          control={form.control}
                          name={meta.key}
                          render={({ field }) => (
                            <FormItem className="rounded-md border p-4 space-y-3">
                              <div className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  {renderFieldInput(meta, field, undefined, undefined, !isEditing)}
                                </FormControl>
                                <div className="flex items-center gap-1 leading-none">
                                  <FormLabel>{meta.label}</FormLabel>
                                  {freqBadge}
                                </div>
                              </div>
                              {uploadStatusId && (
                                <FileUpload
                                  requirementStatusId={uploadStatusId}
                                  disabled={!isEditing}
                                />
                              )}
                              <FormMessage />
                            </FormItem>
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
                          <FormItem>
                            <div className="flex items-center">
                              <FormLabel>
                                {meta.label}
                                {!meta.required && (
                                  <span className="ml-1 text-muted-foreground font-normal">
                                    ({tc("optional")})
                                  </span>
                                )}
                              </FormLabel>
                              {freqBadge}
                            </div>
                            <FormControl>
                              {renderFieldInput(meta, field, undefined, undefined, !isEditing)}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Actions */}
          {isEditing && (
            <div className="space-y-2">
              {canSubmit ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isPending || completionPct < 100}
                >
                  <PenTool className="mr-1.5 h-4 w-4" />
                  {t("submitSignOff")}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("onlyOwnerCanSubmit")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — 1/3 width */}
        <div className="space-y-4">
          {/* Category Owner */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm">{t("categoryOwner")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {categoryOwner ? (
                <p className="text-sm font-medium">{categoryOwner.userName ?? categoryOwner.userId}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{t("noOwner")}</p>
              )}
            </CardContent>
          </Card>

          {/* Company Profile Context */}
          {profileEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm">{t("companyContext")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  {profileEntries.map(([key, val]) => (
                    <div key={key}>
                      <dt className="text-muted-foreground text-xs">
                        {humanizeKey(key)}
                      </dt>
                      <dd className="font-medium">{String(val)}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {/* Operational Data Indicators */}
          {opEntries.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <CardTitle className="text-sm">{t("operationalData")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {opEntries.map(([name, count]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        {humanizeKey(name)}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function humanizeKey(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}
