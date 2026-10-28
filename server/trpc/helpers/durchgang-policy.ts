import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNotNull } from "drizzle-orm";
import { z } from "zod";
import type { CategoryField } from "@/lib/compliance/category-schemas";
import { POLICY_CONFIG_SCHEMAS } from "@/lib/compliance/policy-config-schemas";
import { seedLocale } from "@/lib/compliance/seed-locale";
import type { Database, DbOrTx } from "@/lib/db";
import {
  type AnyScreen,
  acceptedCryptoText,
  type ClauseEvidence,
  type CryptoLabels,
  criticalProcessesText,
  dataProtectionOfficerText,
  dpoOf,
  enteredDay,
  marker,
  NIS2_WALK,
  POLICY_LISTS,
  type PolicyList,
  type PolicyTemplate,
  personText,
  recoveryOrder,
  recoveryOrderText,
  reportingChannelText,
  resolveItem,
  securityDocumentsText,
  type WalkLocale,
  walkOfCode,
} from "@/lib/durchgang";
import { getRegistrationPortals } from "@/lib/registration-portals";
import {
  asset,
  company,
  companyCategoryIntake,
  companyPolicyConfig,
  risk,
  riskAsset,
} from "@/schema";
import { walkItemRef, walkPolicyRows } from "./durchgang";
import { processLinksOf } from "./durchgang-gaps";
import { NAMESPACES, recordLocaleOf, walkItem } from "./durchgang-words";

/**
 * The documents the walk writes from its templates: which template an item writes, the company's
 * stored choices, and the lists a template prints from the company's own records. Every walk's
 * policy screens and its approval read these.
 */

/** The policy an item writes, from its script; an item without a policy screen writes none. */
export const policyTypeOf = (c: string): PolicyTemplate => {
  const screens: readonly AnyScreen[] = walkItem(c).screens;
  const screen = screens.find((s) => s.kind === "policy");
  if (screen?.kind !== "policy") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} writes no policy.` });
  }
  return screen.policy;
};

/** The item's policy screen with its words in `locale`; an item without one writes no policy. */
const policyScreenOf = (c: string, locale: WalkLocale) => {
  const words = resolveItem(NAMESPACES[locale], walkItem(c));
  const screen = words.ok
    ? words.value.screens.find((s) => s.kind === "policy")
    : undefined;
  if (screen?.kind !== "policy") {
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} writes no policy.` });
  }
  return screen;
};

/** The crypto list screen's names for kinds and statuses in `locale`, which the policy prints. */
const cryptoLabelsOf = (locale: WalkLocale): CryptoLabels => {
  const item = NIS2_WALK.items.find((i) => i.screens.some((s) => s.kind === "crypto"));
  const words = item ? resolveItem(NAMESPACES[locale], item) : undefined;
  const screen = words?.ok
    ? words.value.screens.find((s) => s.kind === "crypto")
    : undefined;
  if (screen?.kind !== "crypto") throw new Error("The walk has no crypto list screen.");
  return screen.copy;
};

/**
 * A walk-written policy's stored choices: the clauses, the company's own words, and for the
 * continuity plan one line per process on how it goes on without IT, by asset id. The config
 * column is JSON, so its shape is checked, not assumed; a part that does not parse reads as empty
 * and leaves the rest.
 */
const STORED_CONFIG = z
  .object({
    clauses: z.array(z.string()).catch([]),
    own: z.string().catch(""),
    fallbacks: z.record(z.string(), z.string()).catch({}),
  })
  .catch({ clauses: [], own: "", fallbacks: {} });

export const storedConfigOf = async (
  db: DbOrTx,
  companyId: string,
  type: PolicyTemplate,
) => {
  const [row] = await db
    .select({ config: companyPolicyConfig.config })
    .from(companyPolicyConfig)
    .where(
      and(
        eq(companyPolicyConfig.companyId, companyId),
        eq(companyPolicyConfig.policyType, type),
      ),
    );
  // `chosen`: the company has saved a choice of clauses, even an empty one.
  return { ...STORED_CONFIG.parse(row?.config ?? {}), chosen: row !== undefined };
};

/**
 * The clauses a policy screen ticks on a first visit (`tickWhen`), each with the record it rests
 * on: for "restore_tested", the backup system restored most recently in NIS 2 4.4.
 */
const tickedClauses = async (
  db: DbOrTx,
  companyId: string,
  tickWhen: ReadonlyArray<{ readonly clause: string; readonly when: ClauseEvidence }>,
  locale: WalkLocale,
) =>
  (
    await Promise.all(
      tickWhen.map(async ({ clause, when }) => {
        switch (when) {
          case "restore_tested": {
            const [latest] = await db
              .select({ name: asset.name, on: asset.lastBackupTestDate })
              .from(asset)
              .where(
                and(eq(asset.companyId, companyId), isNotNull(asset.lastBackupTestDate)),
              )
              .orderBy(desc(asset.lastBackupTestDate))
              .limit(1);
            return latest?.on
              ? [{ clause, when, name: latest.name, on: enteredDay(locale, latest.on) }]
              : [];
          }
          default:
            return when satisfies never;
        }
      }),
    )
  ).flat();

/** The editor's policy type the crypto list is kept under (the requirement page edits it too). */
export const CRYPTO_LIST = "crypto";

/** The company's crypto list as the editor stored it, or null while it has none or a broken one. */
export const cryptoListOf = async (db: DbOrTx, companyId: string) => {
  const [row] = await db
    .select({ config: companyPolicyConfig.config })
    .from(companyPolicyConfig)
    .where(
      and(
        eq(companyPolicyConfig.companyId, companyId),
        eq(companyPolicyConfig.policyType, CRYPTO_LIST),
      ),
    );
  const parsed = POLICY_CONFIG_SCHEMAS[CRYPTO_LIST].safeParse(row?.config);
  return parsed.success ? parsed.data : null;
};

/** Where the walk asks who leads in an emergency, which the continuity plan names too. */
const EMERGENCY_LEAD = { code: "3.1", field: "incidentLead" } as const satisfies {
  code: string;
  field: CategoryField<"INC">;
};

/** Where the GDPR walk names the data protection officer (`dpoOf`), whom its documents name too. */
export const DPO_ITEM = "G-DPO.1";

const NO_ANSWERS: Readonly<Record<string, unknown>> = {};

/**
 * One item's saved answers, or none while the item has no status row yet. Only "no row yet" means
 * no answers; any other failure must not print a blank document.
 */
export const answersOf = async (
  db: Database,
  companyId: string,
  code: string,
): Promise<Readonly<Record<string, unknown>>> => {
  const ref = await walkItemRef(db, companyId, code).catch((error) => {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!ref) return NO_ANSWERS;
  const row = await db.query.companyCategoryIntake.findFirst({
    where: and(
      eq(companyCategoryIntake.assessmentId, ref.assessmentId),
      eq(companyCategoryIntake.categoryId, ref.categoryId),
    ),
    columns: { answers: true },
  });
  return row?.answers ?? NO_ANSWERS;
};

/** The security documents the company's NIS 2 walk wrote, each with the day it was approved. */
const securityDocumentsOf = async (db: DbOrTx, companyId: string, locale: WalkLocale) =>
  (await walkPolicyRows(db, companyId, NIS2_WALK)).map((row) => ({
    title: row.title,
    approvedOn:
      row.status !== "draft" && row.effectiveFrom
        ? enteredDay(locale, row.effectiveFrom)
        : null,
  }));

/**
 * What a plan's list names stand for, read off the company's own records: the processes marked
 * `is_critical` with their line, the systems in the order their 2.3 ratings give, where incidents
 * are reported from the company's country, who leads in an emergency from 3.1, the methods
 * the company's crypto list accepts, its data protection officer from G-DPO.1, and the security
 * documents its NIS 2 walk wrote.
 */
const policyListsOf = async (
  db: Database,
  companyId: string,
  used: readonly PolicyList[],
  fallbacks: Readonly<Record<string, string>>,
  locale: WalkLocale,
): Promise<Partial<Record<PolicyList, string>>> => {
  const needs = (...names: readonly PolicyList[]) => names.some((n) => used.includes(n));
  const [assets, links, processLinks, org, lead, crypto, dpo, documents] = await Promise.all([
    needs("criticalProcesses", "recoveryOrder")
      ? db
          .select({
            id: asset.id,
            name: asset.name,
            type: asset.type,
            isCritical: asset.isCritical,
            maxOutage: asset.maxOutage,
          })
          .from(asset)
          .where(eq(asset.companyId, companyId))
          .orderBy(asset.name)
      : [],
    needs("recoveryOrder")
      ? db
          .select({
            id: risk.id,
            likelihood: risk.likelihood,
            impact: risk.impact,
            assetId: riskAsset.assetId,
          })
          .from(riskAsset)
          .innerJoin(risk, eq(risk.id, riskAsset.riskId))
          .where(eq(risk.companyId, companyId))
      : [],
    needs("criticalProcesses") ? processLinksOf(db, companyId) : [],
    needs("reportingChannel")
      ? db.query.company.findFirst({
          where: eq(company.id, companyId),
          columns: { country: true },
        })
      : undefined,
    needs("emergencyLead") ? answersOf(db, companyId, EMERGENCY_LEAD.code) : NO_ANSWERS,
    needs("acceptedCrypto") ? cryptoListOf(db, companyId) : null,
    needs("dataProtectionOfficer") ? answersOf(db, companyId, DPO_ITEM) : NO_ANSWERS,
    needs("securityDocuments") ? securityDocumentsOf(db, companyId, locale) : [],
  ]);
  const portal =
    getRegistrationPortals().portals.find((p) => p.countryCode === org?.country) ?? null;
  const text: Record<PolicyList, () => string> = {
    reportingChannel: () => reportingChannelText(locale, portal),
    emergencyLead: () => personText(lead[EMERGENCY_LEAD.field]),
    criticalProcesses: () => {
      // The tolerance in the 4.2 screen's own words, so the plan and the screen say the same.
      const keep = resolveItem(NAMESPACES[locale], walkItem("4.2"));
      const screen = keep.ok ? keep.value.screens.find((s) => s.kind === "critical") : undefined;
      const spans = screen?.kind === "critical" ? screen.copy.outageOptions : {};
      const names = new Map(assets.map((a) => [a.id, a.name]));
      return criticalProcessesText(
        locale,
        assets
          .filter((a) => a.type === "process" && a.isCritical)
          .map((a) => ({
            name: a.name,
            how: fallbacks[a.id] ?? "",
            outage: a.maxOutage ? (spans[a.maxOutage] ?? a.maxOutage) : null,
            needs: processLinks
              .filter((l) => l.processId === a.id)
              .flatMap((l) => {
                const name = names.get(l.assetId);
                return name ? [name] : [];
              }),
          })),
      );
    },
    recoveryOrder: () =>
      recoveryOrderText(
        recoveryOrder(
          assets,
          links.map((l) => ({ ...l, linked: [l.assetId] })),
        ),
      ),
    acceptedCrypto: () => acceptedCryptoText(locale, cryptoLabelsOf(locale), crypto),
    dataProtectionOfficer: () => dataProtectionOfficerText(locale, dpoOf(dpo)),
    securityDocuments: () => securityDocumentsText(locale, documents),
  };
  return Object.fromEntries(used.map((name) => [name, text[name]()]));
};

/**
 * A policy as the walk writes it for this company: the template in the record language (English
 * for a walk not written in it), the company's name, the clauses chosen so far and, where the
 * template names them, the lists read off the company's rows. The screen shows exactly this, so
 * the text that is printed and signed is the text that is stored.
 */
export const policyDraftOf = async (
  ctx: { db: Database; companyId: string; userId: string },
  c: string,
) => {
  const walk = walkOfCode(c);
  if (!walk)
    throw new TRPCError({ code: "BAD_REQUEST", message: `${c} writes no policy.` });
  const locale = recordLocaleOf(
    walk,
    await seedLocale(ctx.db, ctx.userId, ctx.companyId),
  );
  const screen = policyScreenOf(c, locale);
  const type = screen.screen.policy;
  const document = screen.copy.document;
  const [org, stored] = await Promise.all([
    ctx.db.query.company.findFirst({
      where: eq(company.id, ctx.companyId),
      columns: { name: true },
    }),
    storedConfigOf(ctx.db, ctx.companyId, type),
  ]);
  if (!org) throw new TRPCError({ code: "NOT_FOUND" });
  const text = JSON.stringify(document);
  const used = POLICY_LISTS.filter((name) => text.includes(marker(name)));
  return {
    type,
    document,
    language: locale,
    company: org.name,
    clauses: stored.clauses,
    ticked: stored.chosen
      ? []
      : await tickedClauses(ctx.db, ctx.companyId, screen.screen.tickWhen ?? [], locale),
    own: stored.own,
    fallbacks: stored.fallbacks,
    lists:
      used.length > 0
        ? await policyListsOf(ctx.db, ctx.companyId, used, stored.fallbacks, locale)
        : {},
  };
};
