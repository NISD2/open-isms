import "@/lib/server-guard";
import { getLocale, getTranslations } from "next-intl/server";
import type { HeadStart, ItemView, WalkEntry } from "@/components/durchgang/view";
import { onRegister } from "@/lib/asset-inventory/catalog-labels";
import { catalogueSectorsOf } from "@/lib/asset-inventory/sectors";
import { getSession } from "@/lib/auth";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { buildCitationRows, typesetCitation } from "@/lib/compliance/citations";
import { czechDutyCitation, czechRefOf } from "@/lib/compliance/czech-law";
import { legislation } from "@/lib/content/citations";
import { db } from "@/lib/db";
import { getTermEntry } from "@/lib/dictionary/glossary";
import {
  ALL_ITEMS,
  type AnyItem,
  type AnyScreen,
  askedFields,
  dutyHref,
  itemsFor,
  MANAGEMENT_ROLE,
  type RegisterModule,
  type Walk,
  type WalkLocale,
  walkLocaleOf,
  walkOfCode,
} from "@/lib/durchgang";
import { headStartsOf } from "@/lib/durchgang/head-starts";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { assistantMarks } from "@/lib/mcp/fills";
import { assistantFillsOf } from "@/lib/mcp/fills-store";
import { suggestedActivities } from "@/lib/processing-activities/catalog";
import { ensurePlatformSupplier } from "@/lib/supplier-portal/platform-supplier";
import { api } from "@/lib/trpc/server";
import { ensureAssessment } from "@/server/trpc/helpers/framework-assessment";
import { glossary } from "./gloss";
import { imageFor, stepOf, wordsOf } from "./steps";

/**
 * The citation the duty card prints. NIS 2: the BSIG in German, the directive's article otherwise.
 * GDPR: the requirement's full reference in every language (the regulation applies directly, the
 * BDSG beside it), named as the reader names the regulation: DSGVO in German.
 */
const dutyCitation = (
  item: AnyItem,
  req: { readonly legalRef: string | null; readonly frameworkRef: string | null },
  locale: WalkLocale,
): string => {
  const legal = req.legalRef ?? "";
  switch (item.law.act) {
    case "nis2":
      return (locale === "de" ? req.legalRef : req.frameworkRef) ?? legal;
    case "gdpr":
      return locale === "de" && legal.startsWith("GDPR ")
        ? `DSGVO ${legal.slice("GDPR ".length)}`
        : legal;
    default:
      return item.law satisfies never;
  }
};

/** The caller's company and the items of this walk it walks, read off its profile; none without a company. */
async function callerWalk(walk: Walk) {
  const company = await api.assessment.getCompany();
  return {
    company,
    items: company ? itemsFor(walk, company) : ([] as readonly AnyItem[]),
  };
}

/**
 * Every item of the company's walk with its state, for the home screen and the "Als Nächstes"
 * card. Locked (an account that has not paid), every item is open: such a company has walked
 * nothing, and the walk's own data is for paid accounts only. Opened by a paid account, the
 * company's assessment of the walk's framework is made ready first (`ensureAssessment`).
 */
export async function loadWalk({
  walk,
  locked,
}: {
  walk: Walk;
  locked: boolean;
}): Promise<readonly WalkEntry[]> {
  const session = await getSession();
  if (!locked && session?.companyId) {
    await ensureAssessment(db, session.companyId, walk.framework);
  }
  const [{ items }, states] = await Promise.all([
    callerWalk(walk),
    locked ? [] : api.durchgang.walk({ framework: walk.framework }),
  ]);
  const stateOf = new Map(states.map((s) => [s.code, s.state]));
  return Promise.all(
    items.map(async (item) => ({
      ...(await stepOf(item)),
      state: stateOf.get(item.code) ?? { kind: "open" as const },
    })),
  );
}

/** The walk's own headline of each of these items, for links into the walk from elsewhere. */
export async function headlinesOf(
  codes: readonly string[],
): Promise<ReadonlyMap<string, string>> {
  const items = ALL_ITEMS.filter((item) => codes.includes(item.code));
  return new Map(
    await Promise.all(
      items.map(async (item) => [item.code, (await wordsOf(item)).headline] as const),
    ),
  );
}

/**
 * Where the company stands on the NIS 2 items that give a GDPR item a head start, with the item's
 * line on what the GDPR still asks. Null where there is no head start or no line for it.
 */
async function headStartOf(code: string, gap: string | null): Promise<HeadStart | null> {
  const codes = headStartsOf(code);
  if (!gap || codes.length === 0) return null;
  const [states, titles] = await Promise.all([
    api.durchgang.walk({ framework: "nis2" }),
    headlinesOf(codes),
  ]);
  const stateOf = new Map(states.map((s) => [s.code, s.state]));
  return {
    gap,
    items: codes.flatMap((c) => {
      const title = titles.get(c);
      return title
        ? [{ code: c, title, state: stateOf.get(c) ?? { kind: "open" as const } }]
        : [];
    }),
  };
}

/**
 * One item, resolved for its screens. Null when it is in no walk, not in the company's walk or
 * not visible to the caller.
 */
export async function loadItem(code: string): Promise<ItemView | null> {
  const walk = walkOfCode(code);
  if (!walk) return null;
  const [{ company, items }, session] = await Promise.all([
    callerWalk(walk),
    getSession(),
  ]);
  const item = items.find((i) => i.code === code);
  if (!item || !company || !session?.companyId) return null;

  const [req, assessmentId, localeTag] = await Promise.all([
    api.requirement.getByCode({ code }),
    ensureAssessment(db, session.companyId, walk.framework),
    getLocale(),
  ]);
  if (!req?.category) return null;
  const access = await getUserAccess(assessmentId, session.user.id, session.role);
  if (!canSeeCategory(access, req.category.id)) return null;
  const locale = walkLocaleOf(localeTag, walk.locales);
  const screens: readonly AnyScreen[] = item.screens;
  const shows = (module: RegisterModule) =>
    screens.some((s) => s.kind === "register" && s.module === module);
  const asksActivities = screens.some((s) => s.kind === "activities");
  const asksAssets = screens.some((s) => s.kind === "assets") || asksActivities;
  const asksAdopt = screens.some((s) => s.kind === "adopt");
  const showsPortals = screens.some(
    (s) =>
      (s.kind === "provision" || s.kind === "fields") &&
      (s.provision === "registration_portals" || s.provision === "reporting_channels"),
  );
  const asksPerson = screens.some((s) => s.kind === "fields" && s.person);
  // The instance's operator is offered once as a supplier before the register is read.
  if (shows("supplier")) await ensurePlatformSupplier(db, session.companyId);

  const [
    words,
    tc,
    tPortal,
    tUi,
    statuses,
    intake,
    supplier,
    team,
    trainings,
    reviews,
    assets,
    adoption,
    registration,
    fills,
    record,
  ] = await Promise.all([
    wordsOf(item),
    getTranslations("compliance"),
    getTranslations("portal"),
    getTranslations("durchgang.ui"),
    api.assessment.getStatusesByCategory({ assessmentId, categoryId: req.category.id }),
    api.intake.getRequirementAnswers({
      assessmentId,
      categoryId: req.category.id,
      requirementCode: code,
    }),
    shows("supplier") ? api.supplier.list() : Promise.resolve(undefined),
    asksPerson ? api.team.listMembers() : Promise.resolve([]),
    shows("training_record") ? api.training.list() : Promise.resolve(undefined),
    shows("management_review") ? api.managementReview.list() : Promise.resolve(undefined),
    asksAssets ? api.asset.list() : Promise.resolve(null),
    asksAdopt ? api.durchgang.adoption() : Promise.resolve({ adoptedAt: null }),
    showsPortals ? api.durchgang.portals() : Promise.resolve(null),
    assistantFillsOf(db, session.companyId, req.id),
    asksActivities ? api.processingActivity.list() : Promise.resolve([]),
  ]);
  const fromNis2 = await headStartOf(code, words.fromNis2);
  const listed = assets ? onRegister(assets).listed : [];
  const onRecord = new Set(record.flatMap((a) => (a.catalogId ? [a.catalogId] : [])));

  const statusId = statuses.find((s) => s.requirementId === req.id)?.status?.id ?? null;
  const asked = new Set(askedFields(item));
  const schema = CATEGORY_SCHEMAS[item.category];
  const fields = Object.fromEntries(
    (schema ? introspectSchema(schema, []) : [])
      .filter((f) => asked.has(f.key))
      .map((f) => [f.key, f]),
  );
  const czechRef = czechRefOf(req);
  const law = buildCitationRows(
    {
      frameworkCode: walk.framework,
      frameworkRef: req.frameworkRef,
      legalRef: req.legalRef,
      referenceUrl: req.category.referenceUrl,
      nationalUrl: req.category.nationalUrl,
      czechRef,
      cirReference: req.cirReference,
      cirUrl: legislation("cir-2024-2690").url,
    },
    locale,
  ).map((row) => ({
    label: row.label.kind === "message" ? tPortal(row.label.key) : row.label.text,
    citation:
      row.id === "cir"
        ? typesetCitation(tUi("cirAnnex", { ref: row.citation }))
        : row.citation,
    href: row.href,
    note: row.id === "cir" ? typesetCitation(tUi("cirNote")) : null,
  }));
  const czechDuty = locale === "cs" ? czechDutyCitation(czechRef) : null;
  // The running text that may explain a term in place: learn paragraphs, leads, missed lines.
  const prose = [
    ...words.missed,
    ...words.screens.flatMap((s) => [
      ...("body" in s.copy ? s.copy.body : []),
      ...("lead" in s.copy && typeof s.copy.lead === "string" ? [s.copy.lead] : []),
    ]),
  ];

  return {
    code,
    framework: walk.framework,
    section: tc(`categories.${item.category}.name`),
    // The walk's own headline, in the walk's words: the requirement title is the platform-wide
    // name and stays on the requirement page.
    title: words.headline,
    image: imageFor(code),
    missed: words.missed,
    fromNis2,
    terms: item.glossary.map((term) => {
      const entry = getTermEntry(term, locale);
      if (!entry)
        throw new Error(`Item ${code} lists "${term}", which is not in the dictionary`);
      return { term: entry.term, definition: entry.definition, source: entry.legalRef };
    }),
    citations: law,
    // The duty card cites what its text is written from: the BSIG in German, Czech law in Czech,
    // the directive in English; a GDPR item its article. All of them stay in the rail.
    duty: czechDuty?.cite ?? typesetCitation(dutyCitation(item, req, locale)),
    dutyHref: czechDuty?.href ?? dutyHref(item.law, locale),
    gloss: glossary(prose, locale),
    screens: words.screens,
    mayDecline: item.mustDo === undefined,
    statusId,
    assessmentId,
    categoryId: req.category.id,
    categorySlug: req.category.slug,
    answers: intake.answers,
    fields,
    registers: {
      supplier,
      training_record: trainings,
      management_review: reviews,
    },
    team,
    register: assets
      ? { ...onRegister(assets), sectors: catalogueSectorsOf(company.sector) }
      : null,
    suggestedActivities: asksActivities
      ? suggestedActivities(listed).filter((id) => !onRecord.has(id))
      : [],
    adoptedAt: adoption.adoptedAt,
    registration,
    assistant: assistantMarks(
      words.screens.map((s) => s.screen),
      fills,
    ),
    viewer: {
      id: session.user.id,
      management: session.jobTitle === MANAGEMENT_ROLE,
      admin: session.role === "admin",
    },
    locale,
  };
}
