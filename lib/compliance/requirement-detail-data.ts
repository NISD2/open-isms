import { getLocale, getTranslations } from "next-intl/server";
import type { RequirementDetailProps } from "@/components/compliance/RequirementDetail";
import type { GuidanceFile, RequirementGuidanceData } from "@/lib/ai/guidance-types";
import { getSession, isReviewerRole } from "@/lib/auth";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { PLATFORM_DEFAULTS } from "@/lib/compliance/platform-defaults";
import { REQUIREMENT_FIELD_MAP } from "@/lib/compliance/requirement-fields";
import { DEFAULT_SIGN_OFF_ROLE, type RoleKey } from "@/lib/compliance/role-keys";
import { type FieldMeta, introspectSchema } from "@/lib/forms/schema-introspect";
import { api } from "@/lib/trpc/server";
import type { Asset } from "@/schema/types";

type Items = Record<string, unknown>[];

/**
 * moduleRef -> the operational rows behind it.
 *
 * Every key in `NIS2_MODULE_REF` needs an entry here. A missing one is not a
 * type error, it silently renders "0 entries" (or an empty inline table) on a
 * requirement whose register is in fact full: `vulnerability` was missing and
 * requirement 6.3 always showed an empty vulnerability list, `team` was
 * missing and 1.2 (roles and responsibilities) showed nothing at all.
 */
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
  vulnerability: () => api.vulnerability.list() as Promise<Items>,
  team: () => api.team.listMembers() as Promise<Items>,
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
  "ACC:10.1": () =>
    api.policyConfig.get({ policyType: "access_control" }) as Promise<EditorData>,
  "PRO:6.1": () =>
    api.policyConfig.get({ policyType: "procurement" }) as Promise<EditorData>,
  "PRO:6.2": () =>
    api.policyConfig.get({ policyType: "secure_dev" }) as Promise<EditorData>,
  "PRO:6.4": () =>
    api.policyConfig.get({ policyType: "patch_mgmt" }) as Promise<EditorData>,
};

function fetchEditorData(
  categoryCode: string,
  reqCode: string,
  moduleRef: string | null,
): Promise<EditorData> {
  const editorKey = `${categoryCode}:${reqCode}`;
  const fetcher = EDITOR_PREFETCHERS[editorKey];
  if (fetcher) return fetcher();
  // RisksPage inline needs methodology for scale dropdowns
  if (moduleRef === "risk") return api.risk.getMethodology() as Promise<EditorData>;
  return Promise.resolve(null);
}

/** The intake fields this requirement owns, as the form renders them. Empty
 *  for a requirement without intake fields (custom editor or register only). */
function intakeFields(code: string): { fields: FieldMeta[]; fieldKeys: string[] } {
  const info = REQUIREMENT_FIELD_MAP[code];
  const schema = info ? CATEGORY_SCHEMAS[info.categoryCode] : undefined;
  if (!info || !schema) return { fields: [], fieldKeys: [] };
  return {
    fields: introspectSchema(schema, []).filter((f) => info.fieldKeys.includes(f.key)),
    fieldKeys: info.fieldKeys,
  };
}

/** Pre-generated guidance in the reader's locale. Null when the files are not
 *  generated yet, so the page degrades instead of failing. */
async function loadGuidance(
  locale: string,
  code: string,
): Promise<RequirementGuidanceData | null> {
  try {
    const file: GuidanceFile =
      locale === "de"
        ? (await import("@/data/guidance/de.json")).default
        : (await import("@/data/guidance/en.json")).default;
    return file[code] ?? null;
  } catch {
    return null;
  }
}

export type RequirementDetailData = Omit<
  RequirementDetailProps,
  "prev" | "next" | "durchgang"
>;

/**
 * Everything one requirement screen needs, resolved once for whoever renders
 * it. The category page and the Durchgang both call this and differ only in
 * where prev and next lead. Null when the code is unknown or the viewer may
 * not see its category; the caller decides whether that is a 404.
 */
export async function loadRequirementDetail(
  code: string,
): Promise<RequirementDetailData | null> {
  // Step 1: All independent fetches in parallel
  const [session, req, assessment, locale] = await Promise.all([
    getSession(),
    api.requirement.getByCode({ code }),
    api.assessment.getActiveAssessment(),
    getLocale(),
  ]);

  if (!req?.category) return null;

  // Step 2: Access check (needs session + assessment)
  if (assessment) {
    const access = await getUserAccess(
      assessment.id,
      session?.user.id ?? "",
      session?.role ?? "member",
    );
    if (!canSeeCategory(access, req.category.id)) return null;
  }

  const role = session?.role ?? "member";
  const isReviewer = isReviewerRole(role);
  const isAdmin = role === "admin";

  // Step 3: All data fetches in parallel (assignments no longer waits for statusId)
  const [
    rawStatuses,
    intakeAnswers,
    moduleData,
    assignableUsers,
    rawAssignments,
    editorInitialData,
    prerequisites,
  ] = assessment
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
  // listAssignableUsers is fetched alongside the rest so the seven reads stay
  // one round trip; the detail component reloads it client-side for the popover.
  void assignableUsers;

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

  const [tReq, tc, guidance] = await Promise.all([
    getTranslations("requirements"),
    getTranslations("compliance"),
    loadGuidance(locale, req.code),
  ]);
  const messageKey = (requirementCode: string) => requirementCode.replace(/\./g, "_");

  return {
    requirement: {
      id: req.id,
      code: req.code,
      title: tReq(`${messageKey(req.code)}.title`),
      description: tReq(`${messageKey(req.code)}.description`),
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
    },
    status,
    categoryName: tc(`categories.${req.category.code}.name`),
    categorySlug: req.category.slug,
    assessmentId: assessment?.id ?? "",
    categoryId: req.category.id,
    categoryCode: req.category.code,
    moduleItems: moduleData.items,
    moduleAssets: moduleData.assets,
    ...intakeFields(req.code),
    answers: { ...PLATFORM_DEFAULTS[req.code], ...intakeAnswers.answers },
    isReviewer,
    isAdmin,
    currentUserId: session?.user.id ?? "",
    guidance,
    requiredSignOffRole:
      (req.requiredSignOffRole as RoleKey | null) ?? DEFAULT_SIGN_OFF_ROLE,
    assignments,
    editorInitialData,
    prerequisites: prerequisites.map((p) => ({
      ...p,
      title: tReq(`${messageKey(p.code)}.title`),
    })),
  };
}
