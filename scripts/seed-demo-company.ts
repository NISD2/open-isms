/**
 * Demo-company seed — "Wertstoff Nordkreis GmbH", an 82-employee waste
 * management company, fully populated so the compliance-report export
 * produces a realistic, audit-consistent Prüfordner.
 *
 * v2 after a three-lens auditor review of the first export:
 *  - evidence mapped per requirement CODE (no prefix guessing), every
 *    approved document/technical/proof/training requirement carries a file
 *  - sign-offs batched on Friday review meetings, business hours, split
 *    between GF and IT-Leitung by category, names in the role string
 *  - intake answers for all 12 categories, signed before requirement
 *    sign-offs; register counts match intake text
 *  - EFF fully and BCP partially in_progress (honest, 6 months in)
 *  - annex registers carry the fields auditors ask about first
 *    (contract/AVV dates, patch + vuln-scan state, privileged accounts,
 *    residual risk on every mitigated risk) with backdated createdAt
 *  - incident register with two non-reportable entries (§32 assessed)
 *
 * Creates its own tenant and never touches other rows. Idempotent: re-running
 * wipes the demo tenant and rebuilds it.
 *
 * Run: SEED_DEMO_COMPANY=1 bun run --env-file=.env scripts/seed-demo-company.ts
 *
 * The opt-in is the guard, deliberately, because NODE_ENV is not one. `bun run`
 * leaves it unset, so a NODE_ENV check never fires when the script is invoked
 * as documented; and the Dockerfile sets it to production, so the same check
 * would reject the self-hosted container this demo exists to populate. Exactly
 * backwards. An explicit variable states intent in the one place intent is
 * knowable: the command line.
 */
if (process.env.SEED_DEMO_COMPANY !== "1") {
  throw new Error(
    "Refusing to run without SEED_DEMO_COMPANY=1.\n" +
      "This creates a demo tenant and wipes any previous one in the database " +
      "that DATABASE_URL points at. Set the variable to confirm that is the " +
      "database you mean.",
  );
}

import { eq, inArray, is, getTableName, getTableColumns } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { db } from "@/lib/db";
import * as schema from "@/schema";
import {
  company,
  user,
  companyAssessment,
  companyRequirementStatus,
  companyCategoryIntake,
  requirementCategory,
  complianceFramework,
  evidence,
  asset,
  supplier,
  risk,
  trainingRecord,
  incident,
  companyRiskMethodology,
  riskAsset,
  riskSupplier,
} from "@/schema";
import { createAssessmentsForFrameworks } from "@/server/trpc/helpers/setup-helpers";
import { getDefaultMethodology } from "@/lib/compliance/risk-methodology-defaults";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET } from "@/lib/storage";

const DEMO_EMAIL = "gf@wertstoff-nordkreis.example";
const IT_EMAIL = "it@wertstoff-nordkreis.example";

/**
 * Both demo accounts get the same password. Without a passwordHash the
 * credentials provider refuses the login outright (lib/auth/config.ts), so a
 * seeded tenant nobody can sign into defeats the point of seeding it. Override
 * with DEMO_PASSWORD when the instance is reachable by anyone but you.
 */
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo-wertstoff-2026";

const days = (n: number) => new Date(Date.now() - n * 86_400_000);

/**
 * A syntactically valid one-page PDF. Enough that a reviewer clicking a
 * Nachweis gets a document that opens and names what it stands for, rather
 * than a 404 or a zero-byte file.
 */
function demoPdf(fileName: string, requirementCode: string): Buffer {
  const line = `Beispielnachweis ${requirementCode} - ${fileName} - Wertstoff Nordkreis GmbH (Demodaten)`;
  const content = `BT /F1 9 Tf 40 760 Td (${line.replace(/[()\\]/g, "")}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "latin1");
}

/**
 * Evidence rows are only written if object storage actually accepts an upload.
 * A self-hoster running the bundled docker-compose has MinIO; someone running
 * this against a bare database does not, and 46 rows pointing at objects that
 * were never stored is the exact failure this seed is meant to avoid.
 */
async function storageAccepts(): Promise<boolean> {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `evidence/.seed-probe-${randomUUID()}`,
        Body: Buffer.from("probe"),
        ContentType: "text/plain",
      }),
    );
    return true;
  } catch (err) {
    console.warn(
      `  object storage unavailable (${err instanceof Error ? err.message : String(err)});` +
        " skipping evidence rows rather than seeding dead links",
    );
    return false;
  }
}
const dateStr = (n: number) => days(n).toISOString().slice(0, 10);
const at = (iso: string, hour: number, minute: number) =>
  new Date(`${iso}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00+02:00`);

// ── Friday review meetings; every sign-off falls into one of these ────────
const REVIEW: Record<string, string> = {
  REG: "2026-06-12",
  GOV: "2026-06-12",
  RSK: "2026-06-19",
  CRY: "2026-06-26",
  ACC: "2026-07-03",
  AUT: "2026-07-03",
  PRO: "2026-07-10",
  INC: "2026-07-17",
  SUP: "2026-07-24",
  TRN: "2026-07-31",
  BCP: "2026-07-31",
};

// GF signs governance-shaped categories, IT-Leitung the technical ones.
const GF_CATS = new Set(["REG", "GOV", "RSK", "SUP", "TRN"]);

// Requirements that stay in progress (honest: continuous duties, 6 months in)
const IN_PROGRESS = new Set(["7.1", "7.2", "7.3", "7.4", "4.1", "4.5"]);
const PROGRESS_NOTES: Record<string, string> = {
  "4.1": "BIA-Workshop mit Betriebsleitung für 09/2026 terminiert.",
  "4.5": "Erster kombinierter BCP/DR-Test für Q4 2026 geplant (nach BIA).",
  "7.1": "KPI-Satz definiert, erste Quartalsauswertung läuft.",
  "7.2": "Erste interne Auditrunde Q4 2026, Auditplan liegt vor.",
  "7.3": "Managementbewertung nach erstem Auditzyklus vorgesehen.",
  "7.4": "Maßnahmenverfolgung startet mit den Auditergebnissen.",
};
const REVIEW_FEEDBACK: Record<string, string> = {
  "3.3": "Erstfassung ohne Vertretungsregelung zurückgewiesen, Nachweis am 17.07. nachgereicht und freigegeben.",
  "10.3": "Offboarding-Checkliste auf Rückfrage um Fahrzeugterminals ergänzt.",
};

// ── evidence: per requirement code, uploaded BEFORE the category review ───
const EVIDENCE: Record<string, string[]> = {
  "12.1": ["Betroffenheitsanalyse-NIS2-2026.pdf"],
  "12.2": ["BSI-Registrierungsbestaetigung_REG-2026-04-18-7743.pdf"],
  "12.3": ["MUK-Kontoauszug-Registrierungsdaten.pdf"],
  "12.4": ["Compliance-Nachweisuebersicht.pdf"],
  "1.1": ["Schulungsnachweis-Geschaeftsfuehrung.pdf"],
  "1.2": ["Rollen-und-Verantwortlichkeiten-ISB.pdf"],
  "1.3": ["Budgetfreigabe-IS-2026.pdf"],
  "2.1": ["Risikomethodik-BSI-200-3.pdf"],
  "2.2": ["Asset-Inventar-Export.pdf"],
  "2.3": ["Risikoanalyse-2026-H1.xlsx"],
  "2.4": ["Informationssicherheitsleitlinie-2026.pdf"],
  "5.1": ["Lieferantenregister-Stand-06-2026.pdf"],
  "5.2": ["AVV-DATEV.pdf", "Vertragsanlage-Informationssicherheit.pdf"],
  "5.3": ["Lieferantenbewertung-Q2-2026.xlsx"],
  "5.4": ["Meldeklausel-Systemhaus-Auszug.pdf"],
  "9.1": ["Kryptorichtlinie-2026.pdf"],
  "9.2": ["BitLocker-Statusreport.pdf"],
  "9.3": ["Schluesselverwaltung-Uebersicht.pdf"],
  "10.1": ["Zugriffskontrollrichtlinie.pdf"],
  "10.2": ["Berechtigungsmatrix-Kernsysteme.xlsx"],
  "10.3": ["Onboarding-Offboarding-Checkliste.pdf"],
  "10.4": ["Zugriffsreview-Protokoll-Q2-2026.pdf"],
  "11.1": ["MFA-Richtlinie.pdf"],
  "11.2": ["Notfallkommunikationsplan.pdf"],
  "11.3": ["Passwort-und-Authentifizierungsstandard.pdf"],
  "6.1": ["Beschaffungsrichtlinie-IT.pdf"],
  "6.2": ["Haertungs-Checkliste-Basiskonfiguration.pdf"],
  "6.3": ["Schwachstellenscan-Bericht-07-2026.pdf"],
  "6.4": ["Patchbericht-Q2-2026.pdf"],
  "6.5": ["Aenderungsprotokoll-Auszug.pdf"],
  "3.1": ["Vorfallbehandlungsplan-v2.pdf"],
  "3.2": ["Klassifizierungsschema-Vorfaelle.pdf"],
  "3.3": ["Meldeweg-Test-Protokoll-07-2026.pdf"],
  "3.4": ["Tabletop-Protokoll-Waage-07-2026.pdf"],
  "3.5": ["Nachbereitungsvorlage-Lessons-Learned.pdf"],
  "4.2": ["Notfallhandbuch-v3.pdf"],
  "4.3": ["Wiederanlaufplan-Waage.pdf"],
  "4.4": ["Backup-Konzept-Veeam.pdf", "Restore-Test-Protokoll-07-2026.pdf"],
  "8.1": ["IT-Nutzungsrichtlinie-AUP.pdf"],
  "8.2": ["Teilnehmerliste-Awareness-06-2026.pdf"],
  "8.3": ["Schulungsmatrix-nach-Rollen.pdf"],
  "8.4": ["Phishing-Kampagne-Report-06-2026.pdf"],
  // evidence on honest in-progress work
  "7.1": ["Quartalsbericht-IS-Q2-2026.pdf"],
  "7.2": ["Auditplan-2026-27.pdf"],
};
// special upload date: registration proof arrives right after registering
const EVIDENCE_UPLOAD_OVERRIDE: Record<string, string> = {
  "12.2": "2026-04-20",
};

/**
 * Tables that hold rows for exactly one company but are NOT wiped, each for a
 * stated reason. Anything company-scoped that is not here and not in the wipe
 * below trips the completeness check.
 */
const NOT_WIPED = new Set([
  // The two demo users are removed by email at the end; other users are only
  // detached, because a shared instance may have real accounts attached.
  "user",
  // An erasure record is the evidence that an erasure happened. Deleting it to
  // reset demo data would destroy a compliance artefact.
  "data_erasure_log",
  // Derived cache, refilled on demand; nothing references it.
  "applicability_lookup",
  // FK to company is ON DELETE CASCADE, so the company delete clears it.
  // Deleting it explicitly first would work but says something untrue about
  // who owns the row's lifetime.
  "supplier_invite",
]);

/**
 * Every company-scoped table, discovered from the schema rather than trusted
 * to a hand-written list. The previous version wiped eight tables and then
 * deleted the company row, which works exactly once: as soon as anyone signs
 * in and clicks something, audit_log has rows (the protected-procedure
 * middleware writes one per mutation) and the company delete fails on a
 * foreign key. The demo tenant then cannot be reset without manual SQL.
 *
 * Listing the delete ORDER by hand is unavoidable, since foreign keys dictate
 * children before parents. Deriving the COVERAGE is not, so a table added
 * later fails loudly here instead of silently surviving the wipe.
 */
function assertWipeCoversEveryCompanyTable(wiped: ReadonlySet<string>) {
  const missing: string[] = [];
  for (const value of Object.values(schema)) {
    if (!is(value, PgTable)) continue;
    const name = getTableName(value);
    if (wiped.has(name) || NOT_WIPED.has(name)) continue;
    const columns = Object.values(getTableColumns(value)).map((c) => String(c.name));
    if (columns.includes("company_id") || columns.includes("customer_company_id")) {
      missing.push(name);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `wipeExisting does not cover company-scoped table(s): ${missing.join(", ")}.\n` +
        "Add them to the delete order (children before parents) or to NOT_WIPED " +
        "with a reason. Leaving them out makes the next re-seed fail on a " +
        "foreign key.",
    );
  }
}

async function wipeExisting() {
  const existing = await db.query.user.findFirst({
    where: eq(user.email, DEMO_EMAIL),
    columns: { companyId: true },
  });
  if (!existing?.companyId) {
    await db.delete(user).where(inArray(user.email, [DEMO_EMAIL, IT_EMAIL]));
    return;
  }
  const cid = existing.companyId;
  console.log("wiping previous demo company", cid);

  // One transaction: a wipe that fails halfway leaves a tenant that is neither
  // the old demo nor the new one, and the next run starts from that.
  await db.transaction(async (tx) => {
    const assessmentIds = (
      await tx
        .select({ id: companyAssessment.id })
        .from(companyAssessment)
        .where(eq(companyAssessment.companyId, cid))
    ).map((a) => a.id);

    const statusIds = assessmentIds.length
      ? (
          await tx
            .select({ id: companyRequirementStatus.id })
            .from(companyRequirementStatus)
            .where(inArray(companyRequirementStatus.assessmentId, assessmentIds))
        ).map((r) => r.id)
      : [];

    const riskIds = (
      await tx.select({ id: risk.id }).from(risk).where(eq(risk.companyId, cid))
    ).map((r) => r.id);
    const assetIds = (
      await tx.select({ id: asset.id }).from(asset).where(eq(asset.companyId, cid))
    ).map((r) => r.id);
    const supplierIds = (
      await tx
        .select({ id: supplier.id })
        .from(supplier)
        .where(eq(supplier.customerCompanyId, cid))
    ).map((r) => r.id);
    const incidentIds = (
      await tx.select({ id: incident.id }).from(incident).where(eq(incident.companyId, cid))
    ).map((r) => r.id);
    const auditIds = (
      await tx
        .select({ id: schema.internalAudit.id })
        .from(schema.internalAudit)
        .where(eq(schema.internalAudit.companyId, cid))
    ).map((r) => r.id);
    const policyIds = (
      await tx.select({ id: schema.policy.id }).from(schema.policy).where(eq(schema.policy.companyId, cid))
    ).map((r) => r.id);

    // Children first: these have no company_id of their own and reach the
    // tenant only through a parent row.
    if (statusIds.length) {
      await tx.delete(evidence).where(inArray(evidence.requirementStatusId, statusIds));
      await tx.delete(schema.signOffHistory).where(inArray(schema.signOffHistory.statusId, statusIds));
      await tx.delete(schema.requirementAssignment).where(inArray(schema.requirementAssignment.statusId, statusIds));
    }
    if (riskIds.length) {
      await tx.delete(riskAsset).where(inArray(riskAsset.riskId, riskIds));
      await tx.delete(riskSupplier).where(inArray(riskSupplier.riskId, riskIds));
      await tx.delete(schema.riskTreatment).where(inArray(schema.riskTreatment.riskId, riskIds));
    }
    if (assetIds.length) {
      await tx.delete(schema.assetSupplierOffering).where(inArray(schema.assetSupplierOffering.assetId, assetIds));
    }
    if (incidentIds.length) {
      await tx.delete(schema.bsiIncidentReport).where(inArray(schema.bsiIncidentReport.incidentId, incidentIds));
    }
    if (auditIds.length) {
      await tx.delete(schema.auditFinding).where(inArray(schema.auditFinding.auditId, auditIds));
    }
    if (policyIds.length) {
      await tx.delete(schema.policyAcknowledgment).where(inArray(schema.policyAcknowledgment.policyId, policyIds));
    }
    if (assessmentIds.length) {
      await tx.delete(schema.categoryAssignment).where(inArray(schema.categoryAssignment.assessmentId, assessmentIds));
      await tx.delete(companyCategoryIntake).where(inArray(companyCategoryIntake.assessmentId, assessmentIds));
      await tx.delete(companyRequirementStatus).where(inArray(companyRequirementStatus.assessmentId, assessmentIds));
    }

    // Then everything keyed directly on the company.
    await tx.delete(companyAssessment).where(eq(companyAssessment.companyId, cid));
    await tx.delete(supplier).where(eq(supplier.customerCompanyId, cid));

    const byCompanyId = [
      schema.auditLog, schema.notification,
      schema.trainingLessonProgress, trainingRecord,
      schema.vulnerability, schema.patchRecord, schema.changeRequest,
      schema.kpiMeasurement, schema.improvementItem, schema.exercise,
      schema.managementReview, schema.internalAudit, schema.policy,
      schema.gapAssessment, schema.companyCertification, schema.companyInvite,
      schema.bsiRegistration, companyRiskMethodology, schema.companyPolicyConfig,
      incident, risk, asset,
    ] as const;
    for (const table of byCompanyId) {
      await tx.delete(table).where(eq(table.companyId, cid));
    }

    await tx.update(user).set({ companyId: null }).where(eq(user.companyId, cid));
    await tx.delete(company).where(eq(company.id, cid));
    await tx.delete(user).where(inArray(user.email, [DEMO_EMAIL, IT_EMAIL]));

    assertWipeCoversEveryCompanyTable(
      new Set([
        ...byCompanyId.map((t) => getTableName(t)),
        // Deleted above by joining through a parent rather than by company_id,
        // but company-scoped all the same, so they belong in the coverage set.
        getTableName(schema.signOffHistory),
        getTableName(companyAssessment),
        getTableName(companyRequirementStatus),
        getTableName(companyCategoryIntake),
        getTableName(supplier),
        getTableName(company),
      ]),
    );
  });
}

async function main() {
  await wipeExisting();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [gf] = await db
    .insert(user)
    .values({
      email: DEMO_EMAIL,
      name: "Bernd Schwieger",
      role: "admin",
      jobTitle: "Geschäftsführer",
      isManagement: true,
      passwordHash,
      emailVerifiedAt: at("2026-02-19", 10, 4),
      createdAt: at("2026-02-19", 10, 1),
    })
    .returning();

  const [itLead] = await db
    .insert(user)
    .values({
      email: IT_EMAIL,
      name: "Sandra Koch",
      role: "member",
      jobTitle: "IT-Leitung",
      isManagement: false,
      passwordHash,
      emailVerifiedAt: at("2026-02-21", 8, 47),
      createdAt: at("2026-02-21", 8, 45),
    })
    .returning();

  const [co] = await db
    .insert(company)
    .values({
      name: "Wertstoff Nordkreis GmbH",
      legalForm: "GmbH",
      sector: "Abfallbewirtschaftung",
      subSector: "Sammlung, Sortierung, Verwertung",
      entityType: "important",
      ownerId: gf.id,
      employeeCount: 82,
      annualRevenue: "14200000",
      contactEmail: DEMO_EMAIL,
      contactPhone: "+49 5401 000000",
      cisoName: "Sandra Koch",
      cisoReportsTo: "Geschäftsführung",
      bsiContactName: "Sandra Koch",
      bsiContactEmail: IT_EMAIL,
      bsiContactPhone: "+49 5401 000001",
      bsiRegistrationId: "REG-2026-04-18-7743",
      primaryLocations: "Hauptstandort Georgsmarienhütte, Umschlaghalle Hasbergen",
      actsAsNis2Entity: true,
      activatedAt: at("2026-02-21", 9, 30),
      createdAt: at("2026-02-19", 10, 5),
      country: "DE",
      registeredAddress: "Industriestraße 14, 49124 Georgsmarienhütte",
    })
    .returning();

  await db
    .update(user)
    .set({ companyId: co.id })
    .where(inArray(user.id, [gf.id, itLead.id]));

  console.log("company", co.id);

  // The risk register scores against whatever methodology the company has.
  // Without a row here, server/trpc/routers/risk.ts lazy-inits from the
  // ENGLISH four-level BSI default, and the three risks below that carry
  // impact 5 (ransomware, Wiegesoftware, Backup-Restore) match no level, so
  // the demo's worst rows render with a blank impact. The RSK intake answer
  // and the Anlagenband both state a 5x5 matrix, so seed the scale they claim.
  const de = getDefaultMethodology("de");
  await db.insert(companyRiskMethodology).values({
    companyId: co.id,
    name: "BSI 200-3 (vereinfachte 5x5-Matrix)",
    likelihoodLevels: [
      ...de.likelihoodLevels,
      { value: 5, label: "Sehr häufig", description: "Mehrmals jährlich zu erwarten" },
    ],
    impactLevels: [
      ...de.impactLevels,
      {
        value: 5,
        label: "Existenzbedrohend",
        description: "Betrieb steht, gesetzliche Nachweispflichten nicht erfüllbar",
      },
    ],
    acceptanceThreshold: 6,
    includesOt: true,
    createdAt: at("2026-03-12", 9, 30),
    updatedAt: at("2026-06-19", 14, 0),
  });

  const { frameworkAssessmentMap } = await createAssessmentsForFrameworks(
    db,
    co.id,
    "important",
  );

  const nis2 = await db.query.complianceFramework.findFirst({
    where: eq(complianceFramework.code, "nis2"),
  });
  if (!nis2) throw new Error("nis2 framework missing — run db:seed first");
  const assessmentId = frameworkAssessmentMap.get(nis2.id);
  if (!assessmentId) throw new Error("no nis2 assessment created");

  for (const aid of frameworkAssessmentMap.values()) {
    await db
      .update(companyAssessment)
      .set({ startedAt: at("2026-02-21", 9, 40) })
      .where(eq(companyAssessment.id, aid));
  }
  console.log("nis2 assessment", assessmentId);

  // ── requirement statuses ───────────────────────────────────────────────
  const cats = await db.query.requirementCategory.findMany({
    where: eq(requirementCategory.frameworkId, nis2.id),
    with: { requirements: true },
  });
  const reqs = cats
    .flatMap((c) => c.requirements.map((r) => ({ ...r, catCode: c.code })))
    .sort((a, b) => a.code.localeCompare(b.code, "de", { numeric: true }));

  const statusRowsAll = await db.query.companyRequirementStatus.findMany({
    where: eq(companyRequirementStatus.assessmentId, assessmentId),
    columns: { id: true, requirementId: true },
  });
  const statusIdByReq = new Map(statusRowsAll.map((x) => [x.requirementId, x.id]));

  const snapshotBase = {
    templateVersion: 1,
    companyProfile: {
      name: co.name,
      entityType: "wichtige Einrichtung",
      employeeCount: 82,
      sector: "Abfallbewirtschaftung",
      bsiRegistrationId: "REG-2026-04-18-7743",
    },
  };

  let approved = 0;
  const slotByDate: Record<string, number> = {};

  for (const r of reqs) {
    const rowId = statusIdByReq.get(r.id);
    if (!rowId) continue;
    const cat = r.catCode ?? "";
    const inProgress = IN_PROGRESS.has(r.code);
    const reviewDate = REVIEW[cat] ?? "2026-07-31";
    const slot = (slotByDate[reviewDate] = (slotByDate[reviewDate] ?? 0) + 1);
    const signAt = at(reviewDate, 9 + Math.floor(slot / 3), 12 + ((slot * 17) % 45));
    const completeAt = at(reviewDate, 8, 30 + (slot % 20));
    const gfSigns = GF_CATS.has(cat) || r.code === "2.4";
    const role =
      r.code === "1.4"
        ? "Geschäftsleitung (B. Schwieger, P. Schwieger-Voss)"
        : gfSigns
          ? "Geschäftsführer (Bernd Schwieger)"
          : "IT-Leitung (Sandra Koch)";

    await db
      .update(companyRequirementStatus)
      .set(
        inProgress
          ? {
              status: "in_progress",
              internalNotes: PROGRESS_NOTES[r.code] ?? "In Bearbeitung.",
              updatedAt: new Date(),
            }
          : {
              status: "approved",
              completedAt: completeAt,
              completedBy: itLead.id,
              signedOffBy: gfSigns ? gf.id : itLead.id,
              signedOffAt: signAt,
              signedOffRole: role,
              signedOffTemplateVersion: 1,
              signOffSnapshot: snapshotBase,
              reviewFeedback: REVIEW_FEEDBACK[r.code] ?? null,
              nextReviewDate: dateStr(-300 - (slot % 30)),
              updatedAt: new Date(),
            },
      )
      .where(eq(companyRequirementStatus.id, rowId));
    if (!inProgress) approved++;
  }

  await db
    .update(companyAssessment)
    .set({
      completedRequirements: approved,
      compliancePercentage: ((approved / reqs.length) * 100).toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(companyAssessment.id, assessmentId));
  console.log(`statuses: ${approved} approved, ${reqs.length - approved} in progress`);

  // ── evidence: mapped by exact code, uploaded before the review ─────────
  const storageReady = await storageAccepts();
  let evCount = 0;
  for (const r of reqs) {
    const files = EVIDENCE[r.code];
    if (!files) continue;
    const rowId = statusIdByReq.get(r.id);
    if (!rowId) continue;
    if (!storageReady) break;
    const reviewDate = REVIEW[r.catCode ?? ""] ?? "2026-07-31";
    for (const [fi, fileName] of files.entries()) {
      const override = EVIDENCE_UPLOAD_OVERRIDE[r.code];
      const upload = override
        ? at(override, 11, 5)
        : new Date(at(reviewDate, 10, 0).getTime() - (3 + ((evCount * 2) % 6)) * 86_400_000);

      // Same key shape the app writes (server/trpc/routers/evidence.ts), and a
      // real object behind it. The previous version invented a `demo/…` prefix
      // and uploaded nothing, so every Nachweis in the binder was a dead link:
      // the read path presigns unconditionally, so the UI handed out a working
      // URL that 404s at the bucket. A binder whose evidence cannot be opened
      // is worse than one that admits it has none.
      const storageKey = `evidence/${co.id}/${rowId}/${randomUUID()}-${fileName}`;
      const body = demoPdf(fileName, r.code);
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: storageKey,
          Body: body,
          ContentType: "application/pdf",
        }),
      );
      await db.insert(evidence).values({
        requirementStatusId: rowId,
        fileName,
        fileType: "application/pdf",
        fileSize: body.byteLength,
        storageKey,
        uploadedBy: fi === 0 ? itLead.id : gf.id,
        uploadedAt: upload,
        status: "approved",
      });
      evCount++;
    }
  }
  console.log(`evidence rows: ${evCount}${storageReady ? "" : " (skipped: no object storage)"}`);

  // ── intake answers for all 12 categories ───────────────────────────────
  const intakeByCat: Record<string, { answers: Record<string, unknown>; signed: boolean }> = {
    REG: { signed: true, answers: {
      registrierungsdatum: "18.04.2026 über das BSI-Portal (Mein Unternehmenskonto)",
      registrierungsId: "REG-2026-04-18-7743",
      benannteKontaktstelle: "Sandra Koch (IT-Leitung), Vertretung: Rufbereitschaft Systemhaus Hasetal",
    }},
    GOV: { signed: true, answers: {
      leitlinieVerabschiedet: "Ja, am 12.03.2026 durch die Geschäftsführung",
      sicherheitsverantwortliche: "Sandra Koch (IT-Leitung), berichtet an die Geschäftsführung",
      berichtswegAnGf: "Quartalsweise Statusbericht, ad hoc bei Vorfällen",
    }},
    RSK: { signed: true, answers: {
      methodik: "BSI-Standard 200-3, vereinfachte 5x5-Matrix (Richtlinie v1.1)",
      turnus: "Halbjährlich, zuletzt 06/2026",
      risikoakzeptanzDurch: "Geschäftsführung",
    }},
    SUP: { signed: true, answers: {
      lieferantenregister: "10 Lieferanten erfasst, 3 als kritisch eingestuft",
      vertragsklauseln: "Bei Neuverträgen seit 04/2026 Standard, Bestandsverträge in Nachverhandlung",
    }},
    CRY: { signed: true, answers: {
      verschluesselungImEinsatz: "BitLocker auf allen Verwaltungsgeräten, TLS erzwungen, DATEV/M365 anbieterverschlüsselt",
      schluesselverwaltung: "BitLocker-Recovery-Keys in Entra ID, Zertifikate über Systemhaus",
    }},
    ACC: { signed: true, answers: {
      zugriffsmodell: "Rollenbasiert über Entra ID Gruppen, dokumentiert in Berechtigungsmatrix",
      rezertifizierung: "Quartalsweise Review durch IT-Leitung, zuletzt Q2 2026",
    }},
    AUT: { signed: true, answers: {
      mfaAbdeckung: "Verpflichtend für alle Entra-Konten und Fernzugriffe, Ausnahmen: keine",
      notfallkommunikation: "Mobilfunk-Fallback und Erreichbarkeitsmatrix im Notfallhandbuch",
    }},
    PRO: { signed: true, answers: {
      patchprozess: "IT monatlich, OT quartalsweise im Wartungsfenster mit tonnex",
      schwachstellenscans: "Quartalsweise durch Systemhaus Hasetal, zuletzt 07/2026",
    }},
    INC: { signed: true, answers: {
      meldeweg: "Intern an IT-Leitung, BSI-Meldung über Registrierung REG-2026-04-18-7743",
      erreichbarkeit: "Rufbereitschaft IT-Leitung, Vertretung Systemhaus 24/7-Vertrag",
      vorfallregister: "Geführt seit 03/2026, 2 Einträge, beide nicht meldepflichtig",
    }},
    BCP: { signed: true, answers: {
      backupStand: "Täglich, Offsite-Kopie, monatlicher Restore-Test (zuletzt 28.07.2026)",
      rtoRpoStand: "Für Kernsysteme definiert, BIA zur Verfeinerung terminiert 09/2026",
    }},
    TRN: { signed: true, answers: {
      schulungsstand: "GF-Schulung (2 Personen), Awareness Verwaltung (28), Kurzunterweisung gewerblich (48)",
      turnus: "Jährlich, Phishing-Simulation halbjährlich",
    }},
    EFF: { signed: false, answers: {
      stand: "KPI-Satz definiert, erste interne Auditrunde Q4 2026 geplant",
    }},
  };
  const catRowsAll = await db.query.requirementCategory.findMany({
    where: eq(requirementCategory.frameworkId, nis2.id),
  });
  let intakeCount = 0;
  for (const cat of catRowsAll) {
    const entry = intakeByCat[cat.code];
    if (!entry) continue;
    const signDay = 5 + (intakeCount % 4); // early June, before all reviews
    await db.insert(companyCategoryIntake).values({
      assessmentId,
      categoryId: cat.id,
      answers: entry.answers,
      completionPct: entry.signed ? 100 : 60,
      lastSavedBy: itLead.id,
      lastSavedAt: at(`2026-06-0${signDay}`, 14, 10),
      signedOffBy: entry.signed ? gf.id : null,
      signedOffAt: entry.signed ? at(`2026-06-0${signDay}`, 16, 30) : null,
    });
    intakeCount++;
  }
  console.log(`intake rows: ${intakeCount}`);

  // ── assets ─────────────────────────────────────────────────────────────
  const assetCreated = at("2026-03-10", 9, 0);
  const assets: Array<Partial<typeof asset.$inferInsert>> = [
    { name: "Microsoft 365 (E-Mail, Office, Teams)", type: "cloud_service", isCritical: true, hasMfa: true, owner: "Sandra Koch", accessManagement: "Entra ID, rollenbasiert", encryptionAtRest: "anbieterverschlüsselt (Microsoft)", encryptionInTransit: "TLS 1.2+", hasBackup: true, backupLocation: "M365-Retention + Veeam M365-Backup", privilegedAccountCount: 2 },
    { name: "Entra ID (Identitäten und Anmeldung)", type: "cloud_service", isCritical: true, hasMfa: true, owner: "Sandra Koch", privilegedAccountCount: 2, lastVulnScanDate: dateStr(34) },
    { name: "Wiege- und Verwiegesoftware (Anlage Waage 1+2)", type: "application", isOT: true, isCritical: true, owner: "Betriebsleitung", location: "Umschlaghalle Hasbergen", hostname: "waage-srv-01", ipAddress: "10.20.8.11", operatingSystem: "Windows Server 2019", softwareVersion: "tonnex 7.4.2", rto: 4, rpo: 24, lastPatchDate: "2026-05-16", lastVulnScanDate: dateStr(34), hasBackup: true, backupFrequency: "täglich (Veeam)", privilegedAccountCount: 3 },
    { name: "Tourenplanung und Disposition", type: "application", isCritical: true, owner: "Disposition", hostname: "dispo-srv-01", ipAddress: "10.10.4.21", rto: 8, rpo: 24, lastPatchDate: dateStr(25), lastVulnScanDate: dateStr(34), hasBackup: true, backupFrequency: "täglich (Veeam)", privilegedAccountCount: 2 },
    { name: "Finanzbuchhaltung (DATEV)", type: "application", isCritical: true, owner: "Verwaltung", processesPersonalData: true, rto: 24, rpo: 24, lastPatchDate: dateStr(16), encryptionAtRest: "anbieterverschlüsselt (DATEV-RZ)", encryptionInTransit: "TLS 1.2+", hasBackup: true, backupLocation: "DATEV-RZ (Anbieter)" },
    { name: "Lohn und Gehalt (DATEV LODAS)", type: "cloud_service", processesPersonalData: true, owner: "Verwaltung", encryptionAtRest: "anbieterverschlüsselt (DATEV-RZ)", encryptionInTransit: "TLS 1.2+" },
    { name: "Fileserver Verwaltung", type: "server", hostname: "srv-file-01", ipAddress: "10.10.4.10", operatingSystem: "Windows Server 2022", rto: 8, rpo: 24, hasBackup: true, backupFrequency: "täglich", backupLocation: "Veeam Repository + Offsite", lastBackupTestDate: dateStr(21), encryptionAtRest: "BitLocker", owner: "Sandra Koch", lastPatchDate: dateStr(11), lastVulnScanDate: dateStr(34), privilegedAccountCount: 3 },
    { name: "Backup-Server (Veeam)", type: "server", isCritical: true, hostname: "srv-bak-01", ipAddress: "10.10.4.15", hasBackup: true, backupFrequency: "täglich, monatl. Restore-Test", lastBackupTestDate: dateStr(21), owner: "Sandra Koch", lastPatchDate: dateStr(11), lastVulnScanDate: dateStr(34), privilegedAccountCount: 2 },
    { name: "Firewall (Perimeter, 2 Standorte)", type: "network_device", quantity: 2, isCritical: true, owner: "Systemhaus Hasetal", lastPatchDate: dateStr(12), lastVulnScanDate: dateStr(34), privilegedAccountCount: 2 },
    { name: "Netzwerk-Switches und Access Points", type: "network_device", quantity: 14, owner: "Systemhaus Hasetal", lastPatchDate: dateStr(47) },
    { name: "Arbeitsplätze Verwaltung (Notebooks/PCs)", type: "endpoint", quantity: 28, encryptionAtRest: "BitLocker", hasMfa: true, owner: "Sandra Koch", lastPatchDate: dateStr(9) },
    { name: "Fahrzeugterminals und mobile Scanner", type: "endpoint", quantity: 22, owner: "Disposition", isOT: true, lastPatchDate: "2026-05-16" },
    { name: "Telefonanlage (Cloud)", type: "cloud_service", owner: "Verwaltung", encryptionInTransit: "SRTP/TLS" },
    { name: "Website und Kundenportal Sperrmüllanmeldung", type: "application", processesPersonalData: true, owner: "Agentur (extern)", encryptionInTransit: "TLS 1.3", lastPatchDate: dateStr(19) },
    { name: "Werkstatt-Diagnosesysteme", type: "application", quantity: 3, isOT: true, owner: "Werkstattleitung", location: "Georgsmarienhütte", lastPatchDate: "2026-05-16" },
    { name: "E-Mail-Gateway und Spamfilter", type: "cloud_service", isCritical: true, owner: "Systemhaus Hasetal", encryptionInTransit: "TLS 1.2+" },
    { name: "Zutrittskontrolle Betriebsgelände", type: "network_device", quantity: 2, isOT: true, owner: "Betriebsleitung" },
  ];
  for (const [i, a] of assets.entries()) {
    await db.insert(asset).values({
      companyId: co.id,
      name: a.name!,
      type: a.type ?? "application",
      createdAt: new Date(assetCreated.getTime() + i * 3_600_000),
      updatedAt: at("2026-06-18", 11, 0),
      ...a,
    });
  }
  console.log(`assets: ${assets.length}`);

  // ── suppliers: full contract fields; exactly 3 critical (= intake) ─────
  const supCreated = at("2026-03-24", 10, 0);
  const suppliers: Array<Partial<typeof supplier.$inferInsert>> = [
    { name: "Systemhaus Hasetal GmbH", serviceType: "IT-Betrieb, Netzwerk, Firewall, 24/7-Rufbereitschaft", riskLevel: "high", isCritical: true, hasAccessToSystems: true, hasSecurityClauses: true, hasAuditRights: true, incidentAssistanceCommitment: true, contractStartDate: "2024-09-01", lastReviewDate: "2026-06-20", contactName: "T. Brinkmann", contractSecurityClauses: "IS-Anlage v2 vom 15.04.2026, Meldepflicht 24h, Dokumentationspflicht, Exit-Klausel" },
    { name: "Microsoft Ireland Operations Ltd.", serviceType: "Microsoft 365, Entra ID", riskLevel: "medium", isCritical: false, hasAccessToData: true, hasSecurityCertification: true, securityCertificationType: "ISO 27001", dpaAvailable: true, hasSecurityClauses: true, incidentAssistanceCommitment: true, contractStartDate: "2024-01-15", lastReviewDate: "2026-06-20", contractSecurityClauses: "Microsoft DPA (Standardvertrag), AVV Bestandteil der Lizenzbedingungen" },
    { name: "DATEV eG", serviceType: "Finanzbuchhaltung, Lohn", riskLevel: "medium", isCritical: true, hasAccessToData: true, hasSecurityCertification: true, securityCertificationType: "ISO 27001", dpaAvailable: true, processesPersonalData: true, hasSecurityClauses: true, incidentAssistanceCommitment: true, contractStartDate: "2019-01-01", lastReviewDate: "2026-06-20", contractSecurityClauses: "AVV vom 12.02.2019, aktualisiert 03/2026" },
    { name: "tonnex software GmbH", serviceType: "Wiege- und Entsorgungssoftware, Wartungsvertrag", riskLevel: "high", isCritical: true, hasAccessToSystems: true, hasSecurityClauses: false, incidentAssistanceCommitment: true, contractStartDate: "2022-11-01", lastReviewDate: "2026-07-04", contactName: "Support-Hotline", contractSecurityClauses: "Bestandsvertrag ohne IS-Anlage, Nachverhandlung angestoßen 06/2026" },
    { name: "Präzisa Waagentechnik KG", serviceType: "Eichung und Wartung Fahrzeugwaagen", riskLevel: "medium", isCritical: false, hasAccessToSystems: true, hasSecurityClauses: false, contractStartDate: "2021-05-01", lastReviewDate: "2026-06-27", contractSecurityClauses: "Bestandsvertrag, Nachverhandlung geplant Q4 2026" },
    { name: "Deutsche Telekom AG", serviceType: "Internet-Anbindung beide Standorte, Mobilfunk", riskLevel: "medium", isCritical: false, hasSecurityClauses: true, contractStartDate: "2023-03-01", lastReviewDate: "2026-06-27", contractSecurityClauses: "Rahmenvertrag Geschäftskunden inkl. Sicherheitsbedingungen" },
    { name: "Veeam Software", serviceType: "Backup-Software (Lizenz über Systemhaus)", riskLevel: "low", hasSecurityCertification: true, securityCertificationType: "ISO 27001", hasSecurityClauses: true, contractStartDate: "2024-09-01", lastReviewDate: "2026-06-27" },
    { name: "Werbeagentur Nordhaus", serviceType: "Website, Kundenportal Sperrmüll", riskLevel: "medium", hasAccessToData: true, processesPersonalData: true, hasSecurityClauses: true, dpaAvailable: true, incidentAssistanceCommitment: true, contractStartDate: "2023-08-01", lastReviewDate: "2026-07-04", contractSecurityClauses: "AVV vom 04.05.2026" },
    { name: "NFON AG (Cloud-Telefonie)", serviceType: "Telefonanlage", riskLevel: "low", hasSecurityClauses: true, contractStartDate: "2024-02-01", lastReviewDate: "2026-07-04" },
    { name: "Lohnbüro Steuerkanzlei Meyering", serviceType: "Lohnabrechnung Fahrer (Alt-Verträge)", riskLevel: "medium", processesPersonalData: true, dpaAvailable: true, hasSecurityClauses: false, contractStartDate: "2018-01-01", lastReviewDate: "2026-07-04", contractSecurityClauses: "AVV vom 24.05.2018, Aktualisierung in Nachverhandlung" },
  ];
  for (const [i, s] of suppliers.entries()) {
    await db.insert(supplier).values({
      customerCompanyId: co.id,
      name: s.name!,
      status: "active",
      createdAt: new Date(supCreated.getTime() + i * 7_200_000),
      updatedAt: at("2026-07-04", 15, 30),
      ...s,
    });
  }
  console.log(`suppliers: ${suppliers.length}`);

  // ── risks: residual on every mitigated risk ────────────────────────────
  const riskCreated = at("2026-05-12", 14, 0);
  const risks: Array<Partial<typeof risk.$inferInsert> & { title: string; description: string; likelihood: number; impact: number; treatment: string }> = [
    { title: "Ransomware legt Verwaltung und Disposition lahm", description: "Verschlüsselung von Fileserver und Dispositionssystem über kompromittierten Arbeitsplatz. Tourenausfall ab Tag 1.", likelihood: 3, impact: 5, treatment: "mitigate", treatmentDescription: "MFA flächendeckend, E-Mail-Gateway, Offline-Backup, Restore-Tests monatlich.", riskOwner: "Sandra Koch", residualLikelihood: 2, residualImpact: 4 },
    { title: "Ausfall Wiegesoftware (Annahmestopp)", description: "Waage 1+2 ohne Software: keine Verwiegung, kein gesetzeskonformer Nachweis, Annahmestopp am Standort.", likelihood: 2, impact: 5, treatment: "mitigate", treatmentDescription: "Wartungsvertrag tonnex, Notfallprozedur Handaufschreibung, Ersatzterminal.", riskOwner: "Betriebsleitung", residualLikelihood: 2, residualImpact: 3 },
    { title: "Phishing auf Geschäftsführung (CEO-Fraud)", description: "Zahlungsanweisungen per gefälschter GF-Mail an Buchhaltung.", likelihood: 4, impact: 3, treatment: "mitigate", treatmentDescription: "Vier-Augen-Prinzip Zahlungen, Awareness-Schulung, externes Banner.", riskOwner: "Bernd Schwieger", residualLikelihood: 2, residualImpact: 3 },
    { title: "Abhängigkeit vom Systemhaus", description: "Kritisches Wissen (Firewall, Netzwerk, Backup) liegt vollständig beim Dienstleister.", likelihood: 2, impact: 4, treatment: "mitigate", treatmentDescription: "Dokumentationspflicht im Vertrag, Notfallzugänge im Tresor, Exit-Klausel.", riskOwner: "Sandra Koch", residualLikelihood: 2, residualImpact: 3 },
    { title: "Ungepatchte OT-Systeme (Waage, Werkstatt)", description: "Windows-Server 2019 an der Waage, Diagnosesysteme mit Herstellerbindung, Patchfenster selten.", likelihood: 3, impact: 4, treatment: "mitigate", treatmentDescription: "Netzsegmentierung OT/IT, quartalsweise Patchfenster mit tonnex (zuletzt 16.05., nächstes 09/2026).", riskOwner: "Sandra Koch", residualLikelihood: 2, residualImpact: 3 },
    { title: "Backup-Wiederherstellung schlägt fehl", description: "Backup läuft, aber Restore ungetestet: Datenverlust FiBu und Disposition möglich.", likelihood: 2, impact: 5, treatment: "mitigate", treatmentDescription: "Monatlicher Restore-Test mit Protokoll, Offsite-Kopie.", riskOwner: "Sandra Koch", residualLikelihood: 1, residualImpact: 3 },
    { title: "Berechtigungswildwuchs nach Personalwechseln", description: "Alt-Konten und Sammelpostfächer mit weitreichenden Rechten.", likelihood: 3, impact: 3, treatment: "mitigate", treatmentDescription: "Quartalsweise Rezertifizierung, Offboarding-Checkliste.", riskOwner: "Sandra Koch", residualLikelihood: 2, residualImpact: 2 },
    { title: "Ausfall Cloud-Telefonanlage im Störfall", description: "Bürgerhotline und Behördenerreichbarkeit im Vorfall nicht gegeben.", likelihood: 2, impact: 2, treatment: "accept", treatmentDescription: "Akzeptiert durch GF Bernd Schwieger am 20.05.2026: Mobilfunk-Fallback dokumentiert, Kosten einer Zweitlösung unverhältnismäßig.", acceptedAt: at("2026-05-20", 11, 15) },
  ];
  for (const [i, r] of risks.entries()) {
    await db.insert(risk).values({
      companyId: co.id,
      category: "operational",
      riskScore: r.likelihood * r.impact,
      residualRiskScore:
        r.residualLikelihood && r.residualImpact
          ? r.residualLikelihood * r.residualImpact
          : null,
      lastReviewedAt: at("2026-06-19", 10, 0),
      nextReviewDate: "2026-12-19",
      acceptedBy: r.treatment === "accept" ? gf.id : null,
      createdAt: new Date(riskCreated.getTime() + i * 1_800_000),
      updatedAt: at("2026-06-19", 10, 30),
      ...r,
    });
  }
  console.log(`risks: ${risks.length}`);

  // ── training records: coverage across all 82 employees ─────────────────
  const trainings: Array<Partial<typeof trainingRecord.$inferInsert> & { title: string; trainingType: string; participantName: string }> = [
    { trainingType: "management", title: "NIS2-Schulung der Geschäftsleitung (Art. 20(2) NIS2, §38 BSIG)", participantName: "Bernd Schwieger", participantRole: "Geschäftsführer", isManagement: true, providerName: "nisd2.eu CEO-Kurs", completedAt: at("2026-04-21", 18, 40), durationMinutes: 240, topicsCovered: ["Pflichtenlage", "Risikomanagement", "Meldewege", "Lieferkette", "persönliche Verantwortung"], nextTrainingDue: "2027-04-21", createdAt: at("2026-04-21", 18, 45) },
    { trainingType: "management", title: "NIS2-Schulung der Geschäftsleitung (Art. 20(2) NIS2, §38 BSIG)", participantName: "Petra Schwieger-Voss", participantRole: "Geschäftsführerin (kaufm.)", isManagement: true, providerName: "nisd2.eu CEO-Kurs", completedAt: at("2026-04-28", 17, 55), durationMinutes: 240, topicsCovered: ["Pflichtenlage", "Risikomanagement", "Meldewege", "Lieferkette", "persönliche Verantwortung"], nextTrainingDue: "2027-04-28", createdAt: at("2026-04-28", 18, 0) },
    { trainingType: "awareness", title: "Phishing- und Awareness-Schulung Verwaltung", participantName: "Verwaltung gesamt (28 Beschäftigte, Teilnehmerliste als Nachweis)", participantRole: "Verwaltung", providerName: "Systemhaus Hasetal", completedAt: at("2026-06-04", 10, 30), durationMinutes: 90, topicsCovered: ["Phishing", "Passwörter", "Meldung von Auffälligkeiten"], nextTrainingDue: "2027-06-04", createdAt: at("2026-06-04", 12, 0) },
    { trainingType: "awareness", title: "Kurzunterweisung gewerbliches Personal (Fahrer, Hof, Werkstatt)", participantName: "Gewerbliches Personal (48 Beschäftigte, in 4 Gruppen)", participantRole: "Fahrer, Hof, Werkstatt", providerName: "intern (IT-Leitung), 4 Termine", completedAt: at("2026-06-25", 6, 45), durationMinutes: 30, topicsCovered: ["Fahrzeugterminals", "Meldung von Auffälligkeiten", "USB und Fremdgeräte"], nextTrainingDue: "2027-06-25", createdAt: at("2026-06-25", 8, 0) },
    { trainingType: "technical", title: "Notfallübung Wiederanlauf Waage (Tabletop)", participantName: "IT, Betriebsleitung, Disposition (6 Personen)", participantRole: "Schlüsselfunktionen", providerName: "intern (nisd2.eu Tabletop-Kurs)", completedAt: at("2026-07-09", 14, 0), durationMinutes: 50, topicsCovered: ["Ausfallszenario Wiegesoftware", "Handbetrieb", "Kommunikationskette"], nextTrainingDue: "2027-01-09", createdAt: at("2026-07-09", 15, 0) },
  ];
  for (const t of trainings) {
    await db.insert(trainingRecord).values({
      companyId: co.id,
      userId: t.participantName === "Bernd Schwieger" ? gf.id : null,
      ...t,
    });
  }
  console.log(`training records: ${trainings.length}`);

  // ── incident register: two entries, both assessed as not reportable ────
  await db.insert(incident).values([
    {
      companyId: co.id,
      severity: "near_miss",
      situationColor: "yellow",
      title: "Phishing-Welle auf Verwaltungspostfächer",
      description:
        "Breit gestreute Phishing-Mails an 11 Verwaltungspostfächer, 2 Klicks, keine Kompromittierung (MFA griff). Bewertung nach §32 BSIG: kein erheblicher Sicherheitsvorfall, keine Meldepflicht. Lessons Learned dokumentiert.",
      discoveredAt: at("2026-05-06", 8, 20),
      occurredAt: at("2026-05-06", 7, 50),
      resolvedAt: at("2026-05-07", 12, 0),
      isMalicious: true,
      threatType: "Phishing",
      rootCause: "Breite Kampagne, kein gezielter Angriff",
      countermeasures: "Gateway-Regel verschärft, betroffene Konten geprüft, Awareness-Hinweis an alle",
      preventiveMeasures: "Phishing-Simulation vorgezogen (06/2026)",
      internalRef: "VF-2026-001",
      createdBy: itLead.id,
      createdAt: at("2026-05-06", 9, 0),
    },
    {
      companyId: co.id,
      severity: "incident",
      situationColor: "yellow",
      title: "Ausfall Wiegesoftware Waage 2 (4 Stunden)",
      description:
        "Fehlgeschlagenes tonnex-Update, Rollback durch Hersteller. Annahme über Waage 1 und Handaufschreibung nach Notfallprozedur. Bewertung nach §32 BSIG: kein erheblicher Vorfall (keine Auswirkung auf Dritte, Betrieb aufrechterhalten), keine Meldepflicht.",
      discoveredAt: at("2026-06-24", 5, 35),
      occurredAt: at("2026-06-24", 5, 30),
      resolvedAt: at("2026-06-24", 9, 40),
      isMalicious: false,
      availabilityImpacted: true,
      threatType: "Systemausfall (Update)",
      rootCause: "Fehlgeschlagenes Herstellerupdate ohne vorherigen Test im Wartungsfenster",
      countermeasures: "Rollback, Annahme über Waage 1, Handaufschreibung",
      preventiveMeasures: "Updates nur noch im Wartungsfenster mit Rückfallplan (mit tonnex vereinbart)",
      serviceDeliveryImpact: "Verzögerte Annahme am Standort Hasbergen, kein Annahmestopp",
      internalRef: "VF-2026-002",
      createdBy: itLead.id,
      createdAt: at("2026-06-24", 10, 0),
    },
  ]);
  console.log("incidents: 2");

  console.log("\nDONE");
  console.log("companyId:   ", co.id);
  console.log("assessmentId:", assessmentId);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
