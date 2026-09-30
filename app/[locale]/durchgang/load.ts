import "@/lib/server-guard";
import { readdirSync } from "node:fs";
import path from "node:path";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import type { ItemView, WalkEntry } from "@/components/durchgang/view";
import { CATALOG } from "@/lib/asset-inventory/catalog";
import { getSession } from "@/lib/auth";
import { canSeeCategory, getUserAccess } from "@/lib/compliance/access";
import { CATEGORY_SCHEMAS } from "@/lib/compliance/category-schemas";
import { buildCitationRows } from "@/lib/compliance/citations";
import { legislation } from "@/lib/content/citations";
import {
  type AnyItem,
  type AnyScreen,
  itemKey,
  type RegisterModule,
  type ResolvedItem,
  resolveItem,
  WALK,
} from "@/lib/durchgang";
import { introspectSchema } from "@/lib/forms/schema-introspect";
import { api } from "@/lib/trpc/server";

type Rows = Record<string, unknown>[];

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

const REGISTERS: Readonly<Record<RegisterModule, () => Promise<Rows>>> = {
  supplier: () => api.supplier.list() as Promise<Rows>,
  team: () => api.team.listMembers() as Promise<Rows>,
};

/** The parsed words of an item. The script's tests guarantee this never fails for a shipped item. */
async function wordsOf(item: AnyItem): Promise<ResolvedItem> {
  const messages = await getMessages();
  const resolved = resolveItem(messages.durchgang, item);
  if (!resolved.ok) {
    throw new Error(`Durchgang ${item.code}: ${resolved.errors.join("; ")}`);
  }
  return resolved.value;
}

/** Every item of the walk with its state, for the home screen and the "Als Nächstes" card. */
export async function loadWalk(): Promise<readonly WalkEntry[]> {
  const [states, tc] = await Promise.all([
    api.durchgang.walk(),
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
  const modules = [
    ...new Set(screens.flatMap((s) => (s.kind === "register" ? [s.module] : []))),
  ];
  const asksAssets = screens.some((s) => s.kind === "assets");

  const [
    words,
    tReq,
    tc,
    tInfo,
    tPortal,
    tAssets,
    tUi,
    statuses,
    intake,
    registers,
    assets,
  ] = await Promise.all([
    wordsOf(item),
    getTranslations("requirements"),
    getTranslations("compliance"),
    getTranslations("info"),
    getTranslations("portal"),
    getTranslations("assetInventory"),
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
    Promise.all(modules.map(async (m) => [m, await REGISTERS[m]()] as const)),
    asksAssets ? api.asset.list() : Promise.resolve([]),
  ]);

  const statusId = statuses.find((s) => s.requirementId === req.id)?.status?.id ?? null;
  const asked = new Set<string>(
    screens.flatMap((s) => (s.kind === "fields" ? s.fields : [])),
  );
  const schema = CATEGORY_SCHEMAS[item.category];
  const fields = Object.fromEntries(
    (schema ? introspectSchema(schema, []) : [])
      .filter((f) => asked.has(f.key))
      .map((f) => [f.key, f]),
  );
  const assetNames = new Set(assets.map((a) => a.name.trim().toLowerCase()));
  const listedAssets = CATALOG.filter((c) =>
    assetNames.has(tAssets(`catalog.${c.id}.label`).trim().toLowerCase()),
  ).map((c) => c.id);

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
          citation: tUi("cirAnnex", { ref: req.cirReference }),
          href: legislation("cir-2024-2690").url,
          note: tUi("cirNote"),
        },
      ]
    : [];

  return {
    code,
    section: tc(`categories.${item.category}.name`),
    title: tReq(`${itemKey(code)}.title`),
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
    duty: req.legalRef ?? "",
    screens: words.screens,
    statusId,
    assessmentId: assessment?.id ?? null,
    categoryId: req.category.id,
    answers: intake.answers,
    fields,
    registers: Object.fromEntries(registers),
    listedAssets,
    locale,
  };
}
