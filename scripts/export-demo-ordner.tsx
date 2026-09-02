/**
 * Export the demo company's Prüfordner as two PDFs:
 *   1. compliance report — the production ComplianceReport document,
 *      rendered through the exact code path of /api/export/report
 *   2. Anlagenband — asset inventory, supplier register, risk register,
 *      training records, rendered with the shared lib/pdf styles
 *
 * Run: EXPORT_DEMO_ORDNER=1 bun run --env-file=.env scripts/export-demo-ordner.tsx
 *
 * Opt-in because this reads an entire tenant out of whatever database
 * DATABASE_URL names and writes it to disk as two PDFs. That is a data export,
 * and it should not happen because someone ran the wrong script.
 */
if (process.env.EXPORT_DEMO_ORDNER !== "1") {
  throw new Error(
    "Refusing to run without EXPORT_DEMO_ORDNER=1.\n" +
      "This writes a full tenant export to disk from the database DATABASE_URL " +
      "points at.",
  );
}

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Document, Page, renderToBuffer, Text, View } from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import type React from "react";
import { db } from "@/lib/db";
import {
  BrandBands,
  Callout,
  type Column,
  CoverFooter,
  CoverHeading,
  DocHeader,
  FieldRow,
  PageFooter,
  SectionHeading,
  Table,
} from "@/lib/pdf/chrome";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { styles } from "@/lib/pdf/styles";
import {
  asset,
  company,
  companyAssessment,
  complianceFramework,
  incident,
  risk,
  supplier,
  trainingRecord,
  user,
} from "@/schema";

const DEMO_EMAIL = "gf@wertstoff-nordkreis.example";

/**
 * Defaults to the Desktop for a developer running this locally, but a
 * container has no Desktop and often no HOME, so the path is overridable and
 * created if absent. Writing to `undefined/Desktop` was the previous outcome.
 */
const OUT_DIR =
  process.env.DEMO_ORDNER_OUT ?? join(process.env.HOME ?? process.cwd(), "Desktop");

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "—";

const yesNo = (v: boolean | null | undefined) => (v ? "ja" : "nein");

// ── shared annex building blocks ─────────────────────────────────────────
/** head + widths in the shape lib/pdf/chrome's Table wants. */
const cols = (head: string[], widths: number[]): Column[] =>
  head.map((header, i) => ({ header, width: widths[i] }));

const FOOTER = "Wertstoff Nordkreis GmbH · Anlagenband";

/** Every annex sheet carries the same furniture as the report it is bound with. */
function AnnexPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Page size="A4" style={styles.page}>
      <BrandBands />
      <View fixed>
        <DocHeader label="Anlagenband" value="NIS 2" />
      </View>
      <SectionHeading title={title} />
      <View style={{ marginTop: 10 }}>{children}</View>
      <PageFooter context={FOOTER} pageLabel={(n, total) => `Seite ${n} von ${total}`} />
    </Page>
  );
}

const ASSET_LABELS: Array<[string, string]> = [
  ["type", "Typ"],
  ["description", "Beschreibung"],
  ["quantity", "Anzahl"],
  ["isCritical", "Kritisch"],
  ["isOT", "OT-System"],
  ["owner", "Verantwortlich"],
  ["location", "Standort"],
  ["hostname", "Hostname"],
  ["ipAddress", "IP-Adresse"],
  ["operatingSystem", "Betriebssystem"],
  ["softwareVersion", "Software-Version"],
  ["accessManagement", "Zugriffsverwaltung"],
  ["privilegedAccountCount", "Privilegierte Konten"],
  ["hasMfa", "MFA"],
  ["encryptionAtRest", "Verschlüsselung (ruhend)"],
  ["encryptionInTransit", "Verschlüsselung (Übertragung)"],
  ["hasBackup", "Backup"],
  ["backupFrequency", "Backup-Turnus"],
  ["backupLocation", "Backup-Ablage"],
  ["lastBackupTestDate", "Letzter Restore-Test"],
  ["lastPatchDate", "Letzter Patch"],
  ["lastVulnScanDate", "Letzter Schwachstellenscan"],
  ["rto", "RTO (Stunden)"],
  ["rpo", "RPO (Stunden)"],
  ["processesPersonalData", "Personenbezogene Daten"],
  ["endOfLife", "End-of-Life"],
];

const SUPPLIER_LABELS: Array<[string, string]> = [
  ["serviceType", "Leistung"],
  ["description", "Beschreibung"],
  ["contactName", "Ansprechpartner"],
  ["contactEmail", "Kontakt-E-Mail"],
  ["riskLevel", "Risikoeinstufung"],
  ["isCritical", "Kritischer Lieferant"],
  ["hasAccessToSystems", "Zugriff auf Systeme"],
  ["hasAccessToData", "Zugriff auf Daten"],
  ["hasSecurityCertification", "Sicherheitszertifizierung"],
  ["securityCertificationType", "Zertifizierung"],
  ["contractStartDate", "Vertrag seit"],
  ["contractEndDate", "Vertrag bis"],
  ["hasSecurityClauses", "IS-Vertragsklauseln"],
  ["hasAuditRights", "Auditrechte"],
  ["contractSecurityClauses", "Vertragliche Regelungen"],
  ["lastReviewDate", "Letzte Überprüfung"],
  ["processesPersonalData", "Verarbeitet personenbezogene Daten"],
  ["dpaAvailable", "AVV vorhanden"],
  ["incidentAssistanceCommitment", "Mitwirkung bei Vorfällen"],
  ["internationalTransfer", "Drittlandtransfer"],
];

function fmtVal(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "boolean") return v ? "ja" : "nein";
  if (v instanceof Date) return v.toLocaleDateString("de-DE");
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v))
    return new Date(v).toLocaleDateString("de-DE");
  return String(v);
}

function DetailBlock({
  title,
  record,
  labels,
}: {
  title: string;
  record: Record<string, unknown>;
  labels: Array<[string, string]>;
}) {
  const rows = labels
    .map(([key, label]) => [label, fmtVal(record[key])] as const)
    .filter(([, v]) => v !== null);
  return (
    <View style={styles.record} wrap={false}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{title}</Text>
      </View>
      {rows.map(([label, v], i) => (
        <FieldRow key={i} label={label} value={v ?? ""} />
      ))}
    </View>
  );
}

async function main() {
  const gf = await db.query.user.findFirst({
    where: eq(user.email, DEMO_EMAIL),
    columns: { companyId: true },
  });
  if (!gf?.companyId) throw new Error("demo company not found — run seed first");
  const companyId = gf.companyId;

  const nis2 = await db.query.complianceFramework.findFirst({
    where: eq(complianceFramework.code, "nis2"),
    columns: { id: true },
  });
  if (!nis2) throw new Error("nis2 framework missing");

  const assessments = await db.query.companyAssessment.findMany({
    where: eq(companyAssessment.companyId, companyId),
    columns: { id: true, frameworkId: true },
  });
  // No fallback to "whichever assessment exists": the binder is titled NIS 2,
  // and silently rendering an ISO or GDPR assessment under that title is worse
  // than refusing to render.
  const nis2Assessment = assessments.find((a) => a.frameworkId === nis2.id);
  if (!nis2Assessment) throw new Error("no NIS2 assessment for the demo company");

  // ── part 1: the production compliance report ───────────────────────────
  const data = await loadReportData(nis2Assessment.id, "de");
  const reportBuffer = await renderToBuffer(ComplianceReport({ data, locale: "de" }));
  const reportPath = `${OUT_DIR}/pruefordner-1-bericht.pdf`;
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(reportPath, reportBuffer);
  console.log("report:", reportPath, `${(reportBuffer.length / 1024).toFixed(0)} kB`);

  // ── part 2: Anlagenband ────────────────────────────────────────────────
  const assets = await db.query.asset.findMany({
    where: eq(asset.companyId, companyId),
  });
  const suppliers = await db.query.supplier.findMany({
    where: eq(supplier.customerCompanyId, companyId),
  });
  const risks = await db.query.risk.findMany({
    where: eq(risk.companyId, companyId),
  });
  const trainings = await db.query.trainingRecord.findMany({
    where: eq(trainingRecord.companyId, companyId),
  });
  const incidents = await db.query.incident.findMany({
    where: eq(incident.companyId, companyId),
  });
  const co = await db.query.company.findFirst({
    where: eq(company.id, companyId),
  });
  if (!co) throw new Error("company missing");

  const annex = (
    <Document>
      <Page size="A4" style={[styles.page, styles.coverPage]}>
        <BrandBands />
        <DocHeader label="Stand" value={new Date().toLocaleDateString("de-DE")} />

        <View style={styles.coverBody}>
          <CoverHeading
            eyebrow="NIS2-Dokumentation"
            title="Anlagenband"
            subtitle="Wertstoff Nordkreis GmbH"
            meta={[
              { label: "Stammdaten", value: "Einrichtung" },
              {
                label: "Anlage A",
                value: `Asset-Inventar (${assets.length} Positionen, mit Stammblättern)`,
              },
              {
                label: "Anlage B",
                value: `Lieferantenregister (${suppliers.length} Lieferanten, mit Stammblättern)`,
              },
              { label: "Anlage C", value: `Risikoregister (${risks.length} Risiken)` },
              {
                label: "Anlage D",
                value: `Schulungsnachweise (${trainings.length} Einträge)`,
              },
              {
                label: "Anlage E",
                value: `Vorfallregister (${incidents.length} Einträge, §32 BSIG bewertet)`,
              },
            ]}
          />

          <Callout tone="caution" title="Demodaten">
            Unternehmen, Personen, Lieferanten und alle Registereinträge sind frei
            erfunden und dienen ausschließlich der Veranschaulichung.
          </Callout>
        </View>

        <CoverFooter issuedByLabel="Erstellt mit" disclaimer="Vertraulich" />
      </Page>

      <AnnexPage title={"Stammdaten der Einrichtung"}>
        <DetailBlock
          title="Wertstoff Nordkreis GmbH"
          labels={[
            ["legalForm", "Rechtsform"],
            ["sector", "Sektor"],
            ["subSector", "Teilsektor"],
            ["entityTypeLabel", "Einstufung"],
            ["employeeCount", "Beschäftigte"],
            ["annualRevenueLabel", "Jahresumsatz"],
            ["registeredAddress", "Anschrift"],
            ["primaryLocations", "Standorte"],
            ["contactEmail", "Kontakt"],
            ["contactPhone", "Telefon"],
            ["cisoName", "IT-Sicherheitsverantwortliche"],
            ["cisoReportsTo", "Berichtsweg"],
            ["bsiContactName", "BSI-Kontaktstelle"],
            ["bsiContactEmail", "BSI-Kontakt E-Mail"],
            ["bsiContactPhone", "BSI-Kontakt Telefon"],
            ["bsiRegistrationId", "BSI-Registrierung"],
            ["activatedAtLabel", "NIS2-Programm seit"],
          ]}
          record={{
            ...co,
            entityTypeLabel:
              co.entityType === "important"
                ? "wichtige Einrichtung (§28 Abs. 2 BSIG)"
                : co.entityType,
            annualRevenueLabel: co.annualRevenue
              ? `${(Number(co.annualRevenue) / 1_000_000).toLocaleString("de-DE")} Mio. €`
              : null,
            activatedAtLabel: co.activatedAt
              ? new Date(co.activatedAt).toLocaleDateString("de-DE")
              : null,
          }}
        />
      </AnnexPage>

      <AnnexPage title={"Anlage A — Asset-Inventar"}>
        <Table
          columns={cols(
            [
              "Asset",
              "Typ",
              "Anz.",
              "Kritisch",
              "OT",
              "Verantwortlich",
              "Backup",
              "Letzter Patch",
            ],
            [2.7, 1.2, 0.45, 0.7, 0.45, 1.4, 0.7, 0.9],
          )}
          rows={assets.map((a) => [
            a.name,
            a.type,
            String(a.quantity ?? 1),
            yesNo(a.isCritical),
            yesNo(a.isOT),
            a.owner ?? "—",
            yesNo(a.hasBackup),
            fmtDate(a.lastPatchDate),
          ])}
        />
      </AnnexPage>

      <AnnexPage title={"Anlage A.2 — Asset-Stammblätter (alle erfassten Felder)"}>
        {assets.map((a, i) => (
          <DetailBlock
            key={i}
            title={a.name}
            record={a as unknown as Record<string, unknown>}
            labels={ASSET_LABELS}
          />
        ))}
      </AnnexPage>

      <AnnexPage title={"Anlage B — Lieferantenregister (§30 Abs. 2 Nr. 6 BSIG)"}>
        <Table
          columns={cols(
            [
              "Lieferant",
              "Leistung",
              "Risiko",
              "Kritisch",
              "IS-Klauseln",
              "AVV",
              "Vertrag seit",
              "Letzte Prüfung",
            ],
            [1.7, 2.1, 0.65, 0.65, 0.8, 0.5, 0.85, 0.85],
          )}
          rows={suppliers.map((s) => [
            s.name,
            s.serviceType ?? "—",
            s.riskLevel ?? "—",
            yesNo(s.isCritical),
            yesNo(s.hasSecurityClauses),
            yesNo(s.dpaAvailable),
            fmtDate(s.contractStartDate),
            fmtDate(s.lastReviewDate),
          ])}
        />
      </AnnexPage>

      <AnnexPage title={"Anlage B.2 — Lieferanten-Stammblätter (alle erfassten Felder)"}>
        {suppliers.map((s, i) => (
          <DetailBlock
            key={i}
            title={s.name}
            record={s as unknown as Record<string, unknown>}
            labels={SUPPLIER_LABELS}
          />
        ))}
      </AnnexPage>

      <AnnexPage title={"Anlage C — Risikoregister (§30 Abs. 2 Nr. 1 BSIG)"}>
        <Text style={styles.sectionNote}>
          Methodik: BSI-Standard 200-3, vereinfachte 5x5-Matrix (Risikomethodik-Richtlinie
          v1.1). Risikoakzeptanz durch die Geschäftsführung.
        </Text>
        {risks.map((r, i) => (
          <View key={i} style={styles.record} wrap={false}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordCode}>R-{String(i + 1).padStart(2, "0")}</Text>
              <Text style={styles.recordTitle}>{r.title}</Text>
            </View>
            <Text style={styles.prose}>{r.description}</Text>
            <Text style={styles.sectionNote}>
              Eintritt {r.likelihood}/5 · Auswirkung {r.impact}/5 · Score {r.riskScore}
              {r.residualRiskScore ? ` → Restrisiko ${r.residualRiskScore}` : ""}
              {" · "}Behandlung: {r.treatment}
              {r.riskOwner ? ` · Verantwortlich: ${r.riskOwner}` : ""}
            </Text>
            {r.treatmentDescription ? (
              <Text style={styles.sectionNote}>Maßnahmen: {r.treatmentDescription}</Text>
            ) : null}
          </View>
        ))}
      </AnnexPage>

      <AnnexPage title={"Anlage D — Schulungsnachweise (§38 Abs. 3 BSIG)"}>
        <Table
          columns={cols(
            [
              "Schulung",
              "Teilnehmer",
              "Rolle",
              "Anbieter",
              "Abschluss",
              "Nächste fällig",
            ],
            [2.4, 1.6, 1.2, 1.4, 0.9, 0.9],
          )}
          rows={trainings.map((t) => [
            t.title,
            t.participantName,
            t.participantRole ?? "—",
            t.providerName ?? "—",
            fmtDate(t.completedAt),
            fmtDate(t.nextTrainingDue),
          ])}
        />
      </AnnexPage>
      <AnnexPage title={"Anlage E — Vorfallregister (§32 BSIG)"}>
        <Text style={styles.sectionNote}>
          Geführt seit 03/2026. Jeder Eintrag wird auf Meldepflicht nach §32 BSIG
          bewertet. Bisher kein meldepflichtiger Vorfall.
        </Text>
        {incidents.map((inc, i) => (
          <View key={i} style={styles.record} wrap={false}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordCode}>{inc.internalRef ?? `VF-${i + 1}`}</Text>
              <Text style={styles.recordTitle}>{inc.title}</Text>
            </View>
            <Text style={styles.sectionNote}>
              Entdeckt {fmtDate(inc.discoveredAt)} · behoben {fmtDate(inc.resolvedAt)} ·
              Schweregrad:{" "}
              {inc.severity === "near_miss"
                ? "Beinahe-Vorfall"
                : inc.severity === "incident"
                  ? "Vorfall"
                  : "erheblich"}
            </Text>
            <Text style={styles.prose}>{inc.description}</Text>
            {inc.countermeasures ? (
              <Text style={styles.sectionNote}>
                Sofortmaßnahmen: {inc.countermeasures}
              </Text>
            ) : null}
            {inc.preventiveMeasures ? (
              <Text style={styles.sectionNote}>Prävention: {inc.preventiveMeasures}</Text>
            ) : null}
          </View>
        ))}
      </AnnexPage>
    </Document>
  );

  const annexBuffer = await renderToBuffer(annex);
  const annexPath = `${OUT_DIR}/pruefordner-2-anlagenband.pdf`;
  writeFileSync(annexPath, annexBuffer);
  console.log("annex: ", annexPath, `${(annexBuffer.length / 1024).toFixed(0)} kB`);

  // The same registers as machine-readable JSON. A PDF is the right shape for
  // the auditor holding the binder and the wrong one for pointing a model at
  // your own compliance data, which is the other half of why this exists. The
  // CSV route covers requirement rows only, so assets, suppliers, risks,
  // trainings and incidents have no machine-readable form anywhere else; they
  // are already in memory here.
  //
  // Projected, never the raw rows. `supplier.unsubscribeToken` is a bearer
  // token: whoever holds it can read that supplier's data and revoke the
  // relationship without an account. Writing whole rows to a file whose stated
  // purpose is "hand this to a model" would put it in the export, and the
  // Anlagenband beside it already curates its columns for exactly this reason.
  // Everything below is a field the PDF already prints.
  const pick = <T extends object, K extends keyof T>(rows: T[], keys: readonly K[]) =>
    rows.map((r) => Object.fromEntries(keys.map((k) => [k, r[k]])));

  const dataPath = `${OUT_DIR}/pruefordner-3-register.json`;
  writeFileSync(
    dataPath,
    JSON.stringify(
      {
        company: co?.name ?? null,
        exportedFor: "nis2",
        note: "Demodaten. Alle Einträge sind frei erfunden.",
        assets: pick(
          assets,
          ASSET_LABELS.map(([k]) => k) as Array<keyof (typeof assets)[number]>,
        ),
        suppliers: pick(
          suppliers,
          SUPPLIER_LABELS.map(([k]) => k) as Array<keyof (typeof suppliers)[number]>,
        ),
        risks: pick(risks, [
          "title",
          "description",
          "category",
          "likelihood",
          "impact",
          "riskScore",
          "treatment",
          "treatmentDescription",
          "riskOwner",
          "residualLikelihood",
          "residualImpact",
          "acceptedAt",
        ] as const),
        // The same columns the Anlagenband tables print, no more.
        trainings: pick(trainings, [
          "title",
          "participantName",
          "participantRole",
          "providerName",
          "completedAt",
          "nextTrainingDue",
        ] as const),
        incidents: pick(incidents, [
          "internalRef",
          "title",
          "description",
          "severity",
          "discoveredAt",
          "resolvedAt",
        ] as const),
      },
      null,
      2,
    ),
  );
  console.log("data:  ", dataPath);

  console.log("\nDONE — print both PDFs, one Ordner; the JSON is for querying.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
