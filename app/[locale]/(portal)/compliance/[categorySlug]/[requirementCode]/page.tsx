import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { api } from "@/lib/trpc/server";
import { getSession, isReviewerRole } from "@/lib/auth";
import {
  getUserAccess,
  canSeeCategory,
} from "@/lib/compliance/access";
import { RequirementDetail } from "@/components/compliance/RequirementDetail";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import type { GuidanceFile } from "@/lib/ai/guidance-types";
import { PLATFORM_DEFAULTS } from "@/lib/compliance/platform-defaults";
import { DEFAULT_SIGN_OFF_ROLE, type RoleKey } from "@/lib/compliance/role-keys";
import type { Asset } from "@/schema/types";

type Items = Record<string, unknown>[];

const MODULE_FETCHERS: Record<string, () => Promise<Items>> = {
  risk: () => api.risk.list() as Promise<Items>,
  incident: () => api.incident.list() as Promise<Items>,
  supplier: () => api.supplier.list() as Promise<Items>,
  policy: () => api.policy.list() as Promise<Items>,
  exercise: () => api.exercise.list() as Promise<Items>,
  kpi_measurement: () => api.kpi.list() as Promise<Items>,
  internal_audit: () => api.internalAudit.list() as Promise<Items>,
  management_review: () => api.managementReview.list() as Promise<Items>,
  improvement_item: () => api.improvement.list() as Promise<Items>,
  change_request: () => api.change.list() as Promise<Items>,
  patch_record: () => api.patch.list() as Promise<Items>,
  training_record: () => api.training.list() as Promise<Items>,
};

interface ModuleData {
  items: Items;
  assets?: Asset[];
}

async function fetchModuleData(ref: string | null): Promise<ModuleData> {
  if (!ref) return { items: [] };
  if (ref === "asset") {
    const assets = await api.asset.list();
    return { items: assets, assets };
  }
  const fetcher = MODULE_FETCHERS[ref];
  const items = fetcher ? await fetcher() : [];
  return { items };
}

type EditorData = Record<string, unknown> | null;

const EDITOR_PREFETCHERS: Record<string, () => Promise<EditorData>> = {
  "RSK:2.1": () => api.risk.getMethodology() as Promise<EditorData>,
  "RSK:2.3": async () => {
    const [methodology, assets, risks] = await Promise.all([
      api.risk.getMethodology(),
      api.asset.list(),
      api.risk.listWithAssets(),
    ]);
    return { methodology, assets, risks } as EditorData;
  },
  "RSK:2.4": async () => {
    const [methodology, risks] = await Promise.all([
      api.risk.getMethodology(),
      api.risk.listWithTreatments(),
    ]);
    return { methodology, risks } as EditorData;
  },
  "SUP:5.3": async () => {
    const [methodology, suppliers, risks] = await Promise.all([
      api.risk.getMethodology(),
      api.supplier.list(),
      api.risk.listWithSuppliers(),
    ]);
    return { methodology, suppliers, risks } as EditorData;
  },
  "CRY:9.1": () => api.policyConfig.get({ policyType: "crypto" }) as Promise<EditorData>,
  "CRY:9.2": () => api.policyConfig.get({ policyType: "crypto" }) as Promise<EditorData>,
  "ACC:10.1": () => api.policyConfig.get({ policyType: "access_control" }) as Promise<EditorData>,
  "PRO:6.1": () => api.policyConfig.get({ policyType: "procurement" }) as Promise<EditorData>,
  "PRO:6.2": () => api.policyConfig.get({ policyType: "secure_dev" }) as Promise<EditorData>,
  "PRO:6.4": () => api.policyConfig.get({ policyType: "patch_mgmt" }) as Promise<EditorData>,
};

function fetchEditorData(categoryCode: string, reqCode: string, moduleRef: string | null): Promise<EditorData> {
  const editorKey = `${categoryCode}:${reqCode}`;
  const fetcher = EDITOR_PREFETCHERS[editorKey];
  if (fetcher) return fetcher();
  // RisksPage inline needs methodology for scale dropdowns
  if (moduleRef === "risk") return api.risk.getMethodology() as Promise<EditorData>;
  return Promise.resolve(null);
}

export default async function RequirementDetailPage({
  params,
}: {
  params: Promise<{ categorySlug: string; requirementCode: string }>;
}) {
  const { categorySlug, requirementCode } = await params;

  // Step 1: All independent fetches in parallel (was 3 serial steps)
  const [session, req, assessment, locale] = await Promise.all([
    getSession(),
    api.requirement.getByCode({ code: requirementCode }),
    api.assessment.getActiveAssessment(),
    getLocale(),
  ]);

  if (!req || !req.category || req.category.slug !== categorySlug) {
    notFound();
  }

  // Step 2: Access check (needs session + assessment)
  if (assessment) {
    const access = await getUserAccess(
      assessment.id,
      session?.user.id ?? "",
      session?.role ?? "member",
    );

    if (!canSeeCategory(access, req.category.id)) {
      notFound();
    }
  }

  const role = session?.role ?? "member";
  const isReviewer = isReviewerRole(role);
  const isAdmin = role === "admin";

  // Step 3: All data fetches in parallel (assignments no longer waits for statusId)
  const [rawStatuses, intakeAnswers, moduleData, assignableUsers, rawAssignments, editorInitialData, prerequisites] = assessment
    ? await Promise.all([
        api.assessment.getStatusesByCategory({
          assessmentId: assessment.id,
          categoryId: req.category.id,
        }),
        api.intake.getRequirementAnswers({
          assessmentId: assessment.id,
          categoryId: req.category.id,
          requirementCode: req.code,
        }),
        fetchModuleData(req.moduleRef),
        api.assignment.listAssignableUsers(),
        api.assignment.getAssignmentsByRequirement({
          assessmentId: assessment.id,
          requirementId: req.id,
        }),
        fetchEditorData(req.category.code, req.code, req.moduleRef),
        api.assessment.getPrerequisiteStatuses({
          assessmentId: assessment.id,
          requirementId: req.id,
        }),
      ])
    : [
        [] as Awaited<ReturnType<typeof api.assessment.getStatusesByCategory>>,
        { answers: {} as Record<string, unknown> },
        { items: [] } as ModuleData,
        [] as Awaited<ReturnType<typeof api.assignment.listAssignableUsers>>,
        [] as Awaited<ReturnType<typeof api.assignment.getAssignmentsByRequirement>>,
        null as EditorData,
        [] as Awaited<ReturnType<typeof api.assessment.getPrerequisiteStatuses>>,
      ];

  // Find this requirement's status
  const statusRow = rawStatuses.find((rs) => rs.requirementId === req.id);
  const statusId = statusRow?.status?.id ?? null;
  const status = {
    statusId,
    currentStatus: statusRow?.status?.status ?? "not_started",
    signedOffRole: statusRow?.status?.signedOffRole ?? null,
    signedOffAt: statusRow?.status?.signedOffAt?.toISOString() ?? null,
    signedOffBy: statusRow?.status?.signedOffBy ?? null,
    reviewFeedback: statusRow?.status?.reviewFeedback ?? null,
    nextReviewDate: statusRow?.status?.nextReviewDate ?? null,
  };

  // Serialize dates for client
  const assignments = rawAssignments.map((a) => ({
    ...a,
    signedOffAt: a.signedOffAt?.toISOString() ?? null,
  }));

  // Build prev/next navigation from all requirements in this category
  const tReq = await getTranslations("requirements");
  const tc = await getTranslations("compliance");
  const allReqsInCategory = rawStatuses.map((rs) => {
    const k = rs.requirementCode.replace(/\./g, "_");
    return {
      code: rs.requirementCode,
      title: tReq(`${k}.title`),
    };
  });
  const currentIdx = allReqsInCategory.findIndex((r) => r.code === req.code);
  const prev = currentIdx > 0 ? allReqsInCategory[currentIdx - 1] : null;
  const next =
    currentIdx < allReqsInCategory.length - 1
      ? allReqsInCategory[currentIdx + 1]
      : null;

  // Resolve intake fields for this requirement
  const fieldInfo = REQUIREMENT_FIELD_MAP[req.code];
  let fields: ReturnType<typeof introspectSchema> = [];
  let fieldKeys: string[] = [];

  if (fieldInfo) {
    const catSchema = CATEGORY_SCHEMAS[fieldInfo.categoryCode];
    if (catSchema) {
      const allFields = introspectSchema(catSchema, []);
      fields = allFields.filter((f) => fieldInfo.fieldKeys.includes(f.key));
      fieldKeys = fieldInfo.fieldKeys;
    }
  }

  // Load pre-generated guidance for current locale
  let guidance = null;
  try {
    const file: GuidanceFile =
      locale === "de"
        ? (await import("@/data/guidance/de.json")).default
        : (await import("@/data/guidance/en.json")).default;
    guidance = file[req.code] ?? null;
  } catch {
    // Guidance files not generated yet — graceful degradation
  }

  const reqKey = req.code.replace(/\./g, "_");
  const requirementData = {
    id: req.id,
    code: req.code,
    title: tReq(`${reqKey}.title`),
    description: tReq(`${reqKey}.description`),
    evidenceType: req.evidenceType,
    priority: req.priority,
    frequency: req.frequency,
    legalRef: req.legalRef,
    frameworkRef: req.frameworkRef,
    importance: req.importance,
    moduleRef: req.moduleRef,
    frameworkCode: req.category.framework.code,
    referenceUrl: req.category.referenceUrl,
    nationalUrl: req.category.nationalUrl,
  };

  return (
    <RequirementDetail
      requirement={requirementData}
      status={status}
      categoryName={tc(`categories.${req.category.code}.name`)}
      categorySlug={categorySlug}
      assessmentId={assessment?.id ?? ""}
      categoryId={req.category.id}
      categoryCode={req.category.code}
      moduleItems={moduleData.items}
      moduleAssets={moduleData.assets}
      fields={fields}
      fieldKeys={fieldKeys}
      answers={{ ...PLATFORM_DEFAULTS[req.code], ...intakeAnswers.answers }}
      prev={prev}
      next={next}
      isReviewer={isReviewer}
      isAdmin={isAdmin}
      guidance={guidance}
      requiredSignOffRole={(req.requiredSignOffRole as RoleKey | null) ?? DEFAULT_SIGN_OFF_ROLE}
      assignments={assignments}
      editorInitialData={editorInitialData}
      prerequisites={prerequisites.map((p) => {
        const pk = p.code.replace(/\./g, "_");
        return { ...p, title: tReq(`${pk}.title`) };
      })}
    />
  );
}
