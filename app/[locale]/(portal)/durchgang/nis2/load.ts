import "@/lib/server-guard";
import { readdirSync } from "node:fs";
import path from "node:path";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ItemView, WalkEntry } from "@/components/durchgang/view";
import { onRegister } from "@/lib/asset-inventory/catalog-labels";
import { getSession } from "@/lib/auth";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { buildCitationRows, typesetCitation } from "@/lib/compliance/citations";
import { legislation } from "@/lib/content/citations";
import {
  type AnyItem,
  type AnyScreen,
  askedFields,
  dutyHref,
  itemKey,
  MANAGEMENT_ROLE,
  type RegisterModule,
  type ResolvedItem,
  resolveItem,
  WALK,
} from "@/lib/durchgang";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { api } from "@/lib/trpc/server";
import { glossary } from "./gloss";

/** The step art on disk, read once per server process rather than on every render. */
const ART: ReadonlySet<string> = (() => {
  try {
    return new Set(
      readdirSync(path.join(process.cwd(), "public", "images", "durchgang"))
        .filter((f) => f.endsWith(".svg"))
        .map((f) => f.slice(0, -4)),
    );
  } catch {
    return new Set();
  }
})();

const imageFor = (code: string): string | null =>
  ART.has(itemKey(code)) ? `/images/durchgang/${itemKey(code)}.svg` : null;

/** The parsed words of an item. The script's tests guarantee this never fails for a shipped item. */
async function wordsOf(item: AnyItem): Promise<ResolvedItem> {
  const messages = await getMessages();
  const resolved = resolveItem(messages.durchgang, item);
  if (!resolved.ok) {
    throw new Error(`Durchgang ${item.code}: ${resolved.errors.join("; ")}`);
  }
  return resolved.value;
}

/**
 * Every item of the walk with its state, for the home screen and the "Als Nächstes" card. Locked
 * (an account that has not paid), every item is open: such a company has walked nothing, and the
 * walk's own data is for paid accounts only.
 */
export async function loadWalk({
  locked,
}: {
  locked: boolean;
}): Promise<readonly WalkEntry[]> {
  const [states, tc] = await Promise.all([
    locked ? [] : api.durchgang.walk(),
    getTranslations("compliance"),
  ]);
  const stateOf = new Map(states.map((s) => [s.code, s.state]));
  return Promise.all(
    WALK.map(async (item) => {
      const words = await wordsOf(item);
      return {
        code: item.code,
        section: tc(`categories.${item.category}.name`),
        headline: words.headline,
        teaser: words.teaser,
        image: imageFor(item.code),
        state: stateOf.get(item.code) ?? { kind: "open" as const },
      };
    }),
  );
}

/** One item, resolved for its screens. Null when it is not in the walk or not visible to the caller. */
export async function loadItem(code: string): Promise<ItemView | null> {
  const item = WALK.find((i) => i.code === code);
  if (!item) return null;

  const [session, req, assessment, localeTag] = await Promise.all([
    getSession(),
    api.requirement.getByCode({ code }),
    api.assessment.getActiveAssessment(),
    getLocale(),
  ]);
  if (!req?.category) return null;
  if (assessment) {
    const access = await getUserAccess(
      assessment.id,
      session?.user.id ?? "",
      session?.role ?? "member",
    );
    if (!canSeeCategory(access, req.category.id)) return null;
  }
  const locale = localeTag === "de" ? "de" : "en";
  const screens: readonly AnyScreen[] = item.screens;
  const shows = (module: RegisterModule) =>
    screens.some((s) => s.kind === "register" && s.module === module);
  const asksAssets = screens.some((s) => s.kind === "assets");
  const asksAdopt = screens.some((s) => s.kind === "adopt");
  const showsPortals = screens.some(
    (s) =>
      (s.kind === "provision" || s.kind === "fields") &&
      (s.provision === "registration_portals" || s.provision === "reporting_channels"),
  );
  const asksPerson = screens.some((s) => s.kind === "fields" && s.person);

  const [
    words,
    tc,
    tInfo,
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
  ] = await Promise.all([
    wordsOf(item),
    getTranslations("compliance"),
    getTranslations("info"),
    getTranslations("portal"),
    getTranslations("durchgang.ui"),
    assessment
      ? api.assessment.getStatusesByCategory({
          assessmentId: assessment.id,
          categoryId: req.category.id,
        })
      : Promise.resolve([]),
    assessment
      ? api.intake.getRequirementAnswers({
          assessmentId: assessment.id,
          categoryId: req.category.id,
          requirementCode: code,
        })
      : Promise.resolve({ answers: {} as Record<string, unknown> }),
    shows("supplier") ? api.supplier.list() : Promise.resolve(undefined),
    asksPerson ? api.team.listMembers() : Promise.resolve([]),
    shows("training_record") ? api.training.list() : Promise.resolve(undefined),
    shows("management_review") ? api.managementReview.list() : Promise.resolve(undefined),
    asksAssets ? api.asset.list() : Promise.resolve(null),
    asksAdopt ? api.durchgang.adoption() : Promise.resolve({ adoptedAt: null }),
    showsPortals ? api.durchgang.portals() : Promise.resolve(null),
  ]);

  const statusId = statuses.find((s) => s.requirementId === req.id)?.status?.id ?? null;
  const asked = new Set(askedFields(item));
  const schema = CATEGORY_SCHEMAS[item.category];
  const fields = Object.fromEntries(
    (schema ? introspectSchema(schema, []) : [])
      .filter((f) => asked.has(f.key))
      .map((f) => [f.key, f]),
  );
  const law = buildCitationRows({
    frameworkCode: "nis2",
    frameworkRef: req.frameworkRef,
    legalRef: req.legalRef,
    referenceUrl: req.category.referenceUrl,
    nationalUrl: req.category.nationalUrl,
  }).map((row) => ({
    label: row.label.kind === "message" ? tPortal(row.label.key) : row.label.text,
    citation: row.citation,
    href: row.href,
    note: null,
  }));
  const cir = req.cirReference
    ? [
        {
          label: "CIR 2024/2690",
          citation: typesetCitation(tUi("cirAnnex", { ref: req.cirReference })),
          href: legislation("cir-2024-2690").url,
          note: typesetCitation(tUi("cirNote")),
        },
      ]
    : [];
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
    section: tc(`categories.${item.category}.name`),
    // The walk's own headline, in the walk's words: the requirement title is the platform-wide
    // name and stays on the requirement page.
    title: words.headline,
    image: imageFor(code),
    missed: words.missed,
    terms: item.glossary.map((key) => ({
      term: tInfo(`glossary.terms.${key}.term`),
      definition: tInfo(`glossary.terms.${key}.definition`),
      source: tInfo.has(`glossary.terms.${key}.legalRef`)
        ? tInfo(`glossary.terms.${key}.legalRef`)
        : null,
    })),
    citations: [...law, ...cir],
    // The duty card cites what its text is written from: the BSIG in German, the directive in
    // English. Both stay in the rail.
    duty: typesetCitation(
      (locale === "de" ? req.legalRef : req.frameworkRef) ?? req.legalRef ?? "",
    ),
    dutyHref: dutyHref(item.law, locale),
    gloss: glossary(prose, locale),
    screens: words.screens,
    statusId,
    assessmentId: assessment?.id ?? null,
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
    register: assets ? onRegister(assets) : null,
    adoptedAt: adoption.adoptedAt,
    registration,
    viewer: {
      id: session?.user.id ?? "",
      management: session?.jobTitle === MANAGEMENT_ROLE,
      admin: session?.role === "admin",
    },
    locale,
  };
}
