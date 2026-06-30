"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useForm, Controller } from "react-hook-form";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SignOffButton } from "./SignOffButton";
import { FileUpload } from "./FileUpload";
import { DeadlineBadge } from "./DeadlineBadge";
import { StatusBadge, PriorityBadge } from "./RequirementConstants";

import { RiskMethodologyEditor } from "./RiskMethodologyEditor";
import { AssetRiskRegister } from "../risks/AssetRiskRegister";
import { RiskTreatmentView } from "../risks/RiskTreatmentView";
import { SupplierRiskRegister } from "../suppliers/SupplierRiskRegister";
import { CryptoPolicyEditor } from "./CryptoPolicyEditor";
import { AccessControlEditor } from "./AccessControlEditor";
import { ProcurementEditor } from "./ProcurementEditor";
import { SecureDevEditor } from "./SecureDevEditor";
import { PatchPolicyEditor } from "./PatchPolicyEditor";
import { PolicyItemsPanel, SKIP_INLINE_MODULE } from "./PolicyItemsPanel";
import { InlineModulePanel } from "./InlineModulePanel";
import { MODULE_HREF } from "@/lib/compliance/operational-links";
import { RequirementAssignPopover, type AssignmentRow } from "./RequirementAssignPopover";
import { renderFieldInput } from "@/lib/forms/field-renderer";
import type { FieldMeta } from "@/lib/forms/schema-introspect";
import type { RequirementGuidanceData } from "@/lib/ai/guidance-types";
import type { Asset } from "@/schema/types";
import type { RoleKey } from "@/lib/compliance/role-keys";
import {
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle2,
  ExternalLink,
  Pencil,
  Save,
  Loader2,
  Lightbulb,
  GraduationCap,
} from "lucide-react";

// Requirements where the built-in CEO management training course satisfies
// the §38(3) BSIG / Art. 20(2) NIS2 training obligation.
const CEO_COURSE_REQUIREMENT_CODES = new Set(["1.1", "8.3"]);
import { teachingLessonForCategory } from "@/lib/training/lesson-journey-map";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Law URL helpers
// ---------------------------------------------------------------------------
function nis2Url(ref: string): string | null {
  const m = ref.match(/Art\.\s*(\d+)/);
  return m ? `https://www.nis-2-directive.com/NIS_2_Directive_Article_${m[1]}.html` : null;
}

function bsigUrl(ref: string): string | null {
  const m = ref.match(/§(\d+)/);
  return m ? `https://www.gesetze-im-internet.de/bsig_2025/__${m[1]}.html` : null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RequirementData {
  id: string;
  code: string;
  title: string;
  description: string;
  evidenceType: string;
  priority: string;
  frequency: string;
  legalRef: string | null;
  frameworkRef: string | null;
  importance: string | null;
  moduleRef: string | null;
}

export interface StatusData {
  statusId: string | null;
  currentStatus: string;
  signedOffRole: string | null;
  signedOffAt: string | null;
  signedOffBy: string | null;
  reviewFeedback: string | null;
  nextReviewDate: string | null;
}

export interface NavLink {
  code: string;
  title: string;
}

export interface PrerequisiteStatus {
  code: string;
  title: string;
  categorySlug: string;
  isComplete: boolean;
}

interface RequirementDetailProps {
  requirement: RequirementData;
  status: StatusData;
  categoryName: string;
  categorySlug: string;
  assessmentId: string;
  categoryId: string;
  categoryCode: string;
  moduleItems: Record<string, unknown>[];
  moduleAssets?: Asset[];
  fields: FieldMeta[];
  fieldKeys: string[];
  answers: Record<string, unknown>;
  prev: NavLink | null;
  next: NavLink | null;
  isReviewer: boolean;
  /** Whether the current viewer can assign other users to this requirement.
   *  The assignRequirement / unassignRequirement procedures are admin-only,
   *  so non-admins must not see the assign popover (broken affordance). */
  isAdmin: boolean;
  guidance: RequirementGuidanceData | null;
  requiredSignOffRole: RoleKey;
  assignments: AssignmentRow[];
  editorInitialData: Record<string, unknown> | null;
  prerequisites?: PrerequisiteStatus[];
}

// ---------------------------------------------------------------------------
// Custom editor lookup — requirement code → structured editor component
// ---------------------------------------------------------------------------
const CUSTOM_EDITORS: Record<string, React.ComponentType<{ disabled?: boolean; guidance?: RequirementGuidanceData | null; initialData?: Record<string, unknown> | null }>> = {
  "RSK:2.1": RiskMethodologyEditor,
  "RSK:2.3": AssetRiskRegister,
  "RSK:2.4": RiskTreatmentView,
  "SUP:5.3": SupplierRiskRegister,
  "CRY:9.1": CryptoPolicyEditor,
  "ACC:10.1": AccessControlEditor,
  "PRO:6.1": ProcurementEditor,
  "PRO:6.2": SecureDevEditor,
  "PRO:6.4": PatchPolicyEditor,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RequirementDetail({
  requirement,
  status,
  categoryName,
  categorySlug,
  assessmentId,
  categoryId,
  categoryCode,
  moduleItems,
  moduleAssets,
  fields,
  fieldKeys,
  answers,
  prev,
  next,
  isReviewer,
  isAdmin,
  guidance,
  requiredSignOffRole,
  assignments,
  editorInitialData,
  prerequisites = [],
}: RequirementDetailProps) {
  const t = useTranslations("compliance");
  const tf = useTranslations("form");
  const tc = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const signOff = trpc.assessment.signOff.useMutation();
  const updateStatus = trpc.assessment.updateRequirementStatus.useMutation();
  const confirmModuleRef = trpc.assessment.confirmModuleRef.useMutation();
  const saveAnswers = trpc.intake.saveRequirementAnswers.useMutation();
  const assignReq = trpc.assignment.assignRequirement.useMutation();
  const unassignReq = trpc.assignment.unassignRequirement.useMutation();
  const { data: assignableUsers } = trpc.assignment.listAssignableUsers.useQuery();

  const [optimisticAssignments, setOptimisticAssignments] = useOptimistic(
    assignments,
    (current: AssignmentRow[], action: { type: "add"; userId: string } | { type: "remove"; userId: string }) => {
      if (action.type === "remove") {
        return current.filter((a) => a.userId !== action.userId);
      }
      const user = (assignableUsers ?? []).find((u) => u.id === action.userId);
      if (!user) return current;
      return [
        ...current,
        {
          id: `optimistic-${action.userId}`,
          userId: action.userId,
          signedOffAt: null,
          user: { id: user.id, name: user.name, email: user.email, jobTitle: user.jobTitle },
        },
      ];
    },
  );

  const isCompleted =
    status.currentStatus === "completed" || status.currentStatus === "approved";
  const isNA = status.currentStatus === "not_applicable";

  const [naOpen, setNaOpen] = useState(false);
  const [naReason, setNaReason] = useState("");
  const isNotStarted = status.currentStatus === "not_started";
  const hasOpenPrereqs = prerequisites.some((p) => !p.isComplete);
  // "Learn this in the CEO course" deep link (sidebar). Suppressed on the two
  // training requirements that already show the full course CTA in the body.
  const teachingLesson = CEO_COURSE_REQUIREMENT_CODES.has(requirement.code)
    ? null
    : teachingLessonForCategory(categoryCode);
  const [isEditing, setIsEditing] = useState(isNotStarted && !isCompleted && !isNA);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    defaultValues: answers,
  });

  const fieldsDisabled = !isEditing || isNA || isReviewer;

  async function handleSave() {
    if (!assessmentId) {
      toast.error(tf("failedToSave"));
      return;
    }
    setIsSaving(true);
    try {
      const data = form.getValues();
      const scoped: Record<string, unknown> = {};
      for (const key of fieldKeys) {
        if (data[key] !== undefined) scoped[key] = data[key];
      }
      await saveAnswers.mutateAsync({
        assessmentId,
        categoryId,
        categoryCode,
        requirementCode: requirement.code,
        answers: scoped,
      });
      toast.success(tf("requirementSaved"));
      setIsEditing(false);
      startTransition(() => router.refresh());
    } catch {
      toast.error(tf("failedToSave"));
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    form.reset(answers);
    setIsEditing(false);
  }

  function handleSignOff() {
    const statusId = status.statusId;
    if (!statusId) return;
    startTransition(async () => {
      try {
        await signOff.mutateAsync({ statusId });
        toast.success(tf("requirementCompleted", { code: requirement.code }));
        router.refresh();
      } catch {
        toast.error(tf("failedToSave"));
      }
    });
  }

  function handleNotApplicable() {
    const statusId = status.statusId;
    if (!statusId || !naReason.trim()) return;
    startTransition(async () => {
      try {
        await updateStatus.mutateAsync({
          statusId,
          status: "not_applicable",
          notApplicableReason: naReason.trim(),
        });
        toast.success(tf("requirementCompleted", { code: requirement.code }));
        setNaOpen(false);
        setNaReason("");
        router.refresh();
      } catch {
        toast.error(tf("failedToSave"));
      }
    });
  }

  function handleModuleConfirm() {
    const statusId = status.statusId;
    if (!statusId) return;
    startTransition(async () => {
      try {
        await confirmModuleRef.mutateAsync({ statusId });
        toast.success(tf("requirementCompleted", { code: requirement.code }));
        router.refresh();
      } catch {
        toast.error(tf("failedToSave"));
      }
    });
  }

  function handleAssign(userId: string) {
    const sid = status.statusId;
    if (!sid) return;
    startTransition(async () => {
      setOptimisticAssignments({ type: "add", userId });
      await assignReq.mutateAsync({ statusId: sid, userId });
      router.refresh();
    });
  }

  function handleUnassign(userId: string) {
    const sid = status.statusId;
    if (!sid) return;
    startTransition(async () => {
      setOptimisticAssignments({ type: "remove", userId });
      await unassignReq.mutateAsync({ statusId: sid, userId });
      router.refresh();
    });
  }

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* Zone 1: Identity */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">
          <Link
            href={{ pathname: "/compliance/[categorySlug]", params: { categorySlug } }}
            className="hover:text-foreground transition-colors"
          >
            {categoryName}
          </Link>
          <span className="mx-1.5 text-muted-foreground/50">/</span>
          <span className="font-mono">{requirement.code}</span>
        </p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-xl font-semibold tracking-tight">{requirement.title}</h1>
          <StatusBadge status={status.currentStatus} />
        </div>
        {isCompleted && status.signedOffAt && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status.signedOffRole
              ? t("requirement.signedOffByOn", {
                  name: status.signedOffRole,
                  date: new Date(status.signedOffAt).toLocaleDateString(),
                })
              : t("requirement.signedOff")}
          </p>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Zone 2 + Zone 3: Two-column grid */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        {/* ============================================================== */}
        {/* PRIMARY COLUMN: Form + Evidence + Module */}
        {/* ============================================================== */}
        <div className="space-y-6 min-w-0">
          {/* Review feedback — shown first when rejected */}
          {status.currentStatus === "rejected" && status.reviewFeedback && (
            <div className="border-l-2 border-l-red-500 pl-4 py-2">
              <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">
                {t("requirement.rejectionFeedback")}
              </p>
              <p className="text-sm">{status.reviewFeedback}</p>
            </div>
          )}

          {/* Prerequisites — advisory suggestion only; never blocks sign-off */}
          {hasOpenPrereqs && (
            <div className="border-l-2 border-l-muted-foreground/30 pl-4 py-2">
              <p className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                {t("requirement.prerequisitesBlocked")}
              </p>
              <ul className="space-y-1">
                {prerequisites.filter((p) => !p.isComplete).map((p) => (
                  <li key={p.code} className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/30" />
                    <Link
                      href={{
                        pathname: "/compliance/[categorySlug]/[requirementCode]",
                        params: { categorySlug: p.categorySlug, requirementCode: p.code },
                      }}
                      className="hover:text-foreground transition-colors text-muted-foreground underline underline-offset-2"
                    >
                      {p.code} — {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CEO course CTA — only on management training requirements */}
          {CEO_COURSE_REQUIREMENT_CODES.has(requirement.code) && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">
                    {t("requirement.ceoCourseTitle")}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {t("requirement.ceoCourseDescription")}
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/training/nis2-ceo">
                      <GraduationCap className="mr-1.5 h-3.5 w-3.5" />
                      {t("requirement.takeCourse")}
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Custom structured editor (methodology, crypto, access control, etc.) */}
          {(() => {
            const EditorComponent = CUSTOM_EDITORS[`${categoryCode}:${requirement.code}`];
            if (EditorComponent) return <EditorComponent disabled={isReviewer} guidance={guidance} initialData={editorInitialData} />;
            return null;
          })()}

          {/* Policy items — shows per-item compliance below the policy editor */}
          <PolicyItemsPanel
            editorKey={`${categoryCode}:${requirement.code}`}
            disabled={isReviewer}
            assets={moduleAssets}
          />

          {/* Form fields */}
          {!CUSTOM_EDITORS[`${categoryCode}:${requirement.code}`] && fields.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("requirement.specificsSection")}
                </h2>
                {!isNA && !isReviewer && (
                  isEditing ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        {tc("cancel")}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {isSaving ? tf("saving") : tf("save")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      {tf("edit")}
                    </Button>
                  )
                )}
              </div>
              <div className="space-y-4">
                {fields.map((meta) => (
                    <Controller
                      key={meta.key}
                      name={meta.key}
                      control={form.control}
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{meta.label}</label>
                          {renderFieldInput(meta, field, undefined, undefined, fieldsDisabled)}
                        </div>
                      )}
                    />
                ))}
              </div>
            </div>
          ) : !CUSTOM_EDITORS[`${categoryCode}:${requirement.code}`] && !requirement.moduleRef ? (
            <div className="space-y-2">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("requirement.specificsSection")}
              </h2>
              <p className="text-sm text-muted-foreground italic">
                {t("requirement.noFieldsNeeded")}
              </p>
            </div>
          ) : null}

          {/* Module data */}
          {requirement.moduleRef && (
            SKIP_INLINE_MODULE.has(`${categoryCode}:${requirement.code}`) ? (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={(MODULE_HREF[requirement.moduleRef] ?? `/${requirement.moduleRef}s`) as never}>
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    {t("requirement.moduleData")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-4 border-t">
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {t("requirement.moduleData")}
                </h2>
                <InlineModulePanel
                  moduleRef={requirement.moduleRef}
                  requirementCode={requirement.code}
                  items={moduleItems}
                  isCompleted={isCompleted}
                  isConfirming={isPending}
                  onConfirm={
                    isReviewer || !status.statusId ? undefined : handleModuleConfirm
                  }
                  editorInitialData={editorInitialData}
                />
              </div>
            )
          )}

          {/* Evidence */}
          {status.statusId &&
            (requirement.evidenceType === "document" ||
              requirement.evidenceType === "proof") && (
            <div className="space-y-2 pt-4 border-t">
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("requirement.evidenceSection")}
              </h2>
              <FileUpload
                requirementStatusId={status.statusId}
                disabled={isReviewer || status.currentStatus === "approved"}
              />
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* SIDEBAR: Context + Assignments + Metadata */}
        {/* ============================================================== */}
        <aside className="space-y-6 lg:border-l lg:pl-6">
          {/* Assigned to + sign-off progress */}
          {status.statusId && (
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("assign")}
              </h3>
              {isAdmin && (
                <RequirementAssignPopover
                  assignments={optimisticAssignments}
                  users={assignableUsers ?? []}
                  isPending={isPending}
                  onAssign={handleAssign}
                  onUnassign={handleUnassign}
                />
              )}
              {optimisticAssignments.length > 0 && !isNA && (
                <div className="space-y-1 mt-3">
                  <p className="text-xs text-muted-foreground">
                    {t("requirement.signOffProgress", {
                      signed: optimisticAssignments.filter((a) => a.signedOffAt).length,
                      total: optimisticAssignments.length,
                    })}
                  </p>
                  {optimisticAssignments.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle2
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          a.signedOffAt ? "text-emerald-500" : "text-muted-foreground/30",
                        )}
                      />
                      <span className={cn(a.signedOffAt && "text-emerald-600 dark:text-emerald-400")}>
                        {a.user.name}
                      </span>
                      {a.signedOffAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(a.signedOffAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {assignments.length === 0 && !isCompleted && !isNA && (
                <p className="text-xs text-muted-foreground mt-1">
                  {t("requirement.requiredRole", { role: requiredSignOffRole.toUpperCase() })}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t("requirement.details")}
            </h3>
            <dl className="space-y-2 text-sm">
              {requirement.priority && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("requirement.priority")}</dt>
                  <dd>
                    <PriorityBadge priority={requirement.priority} />
                  </dd>
                </div>
              )}
              {requirement.frequency && requirement.frequency !== "once" && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("requirement.frequency")}</dt>
                  <dd className="text-xs">{requirement.frequency}</dd>
                </div>
              )}
              {status.nextReviewDate && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("requirement.deadline")}</dt>
                  <dd>
                    <DeadlineBadge
                      nextReviewDate={status.nextReviewDate}
                      frequency={requirement.frequency}
                    />
                  </dd>
                </div>
              )}
              {requirement.importance === "mandatory" && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{t("requirement.importance")}</dt>
                  <dd className="text-xs text-red-600 dark:text-red-400">{t("mandatory")}</dd>
                </div>
              )}
              {requirement.frameworkRef && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">NIS2</dt>
                  <dd>
                    <a
                      href={nis2Url(requirement.frameworkRef) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {requirement.frameworkRef}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
              {requirement.legalRef && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">BSIG</dt>
                  <dd>
                    <a
                      href={bsigUrl(requirement.legalRef) ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {requirement.legalRef}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </dd>
                </div>
              )}
            </dl>
            {teachingLesson && (
              <Link
                href={{
                  pathname: "/training/courses/[courseId]/[lessonId]",
                  params: { courseId: "nis2-ceo", lessonId: teachingLesson },
                }}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <GraduationCap className="h-3.5 w-3.5 shrink-0 text-primary" />
                {t("requirement.seeInCourse")}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>

        </aside>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky footer action bar */}
      {/* ------------------------------------------------------------------ */}
      <div className="sticky bottom-0 z-30 -mx-6 mt-8 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            {prev ? (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{
                    pathname: "/compliance/[categorySlug]/[requirementCode]",
                    params: { categorySlug, requirementCode: prev.code },
                  }}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("requirement.prevRequirement")}
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={{ pathname: "/compliance/[categorySlug]", params: { categorySlug } }}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  {t("requirement.backToCategory", { category: categoryName })}
                </Link>
              </Button>
            )}
          </div>

          {status.statusId && !isReviewer && !isCompleted && !isNA && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setNaOpen(true)}
              >
                <Ban className="mr-1.5 h-3.5 w-3.5" />
                {t("notApplicable")}
              </Button>
              <SignOffButton isSubmitting={isPending} onSignOff={handleSignOff} />
            </div>
          )}

          <div>
            {next && (
              <Button size="sm" asChild>
                <Link
                  href={{
                    pathname: "/compliance/[categorySlug]/[requirementCode]",
                    params: { categorySlug, requirementCode: next.code },
                  }}
                >
                  {t("requirement.nextRequirement")}
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* N/A AlertDialog */}
      {/* ------------------------------------------------------------------ */}
      <AlertDialog open={naOpen} onOpenChange={setNaOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("notApplicable")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("notApplicablePlaceholder")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={naReason}
            onChange={(e) => setNaReason(e.target.value)}
            placeholder={t("notApplicablePlaceholder")}
            className="text-sm"
            rows={3}
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNaReason("")}>
              {tc("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={!naReason.trim() || isPending}
              onClick={handleNotApplicable}
            >
              {t("confirmNotApplicable")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
