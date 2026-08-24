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
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import {
  renderToBuffer,
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  user,
  companyAssessment,
  complianceFramework,
  company,
  asset,
  supplier,
  risk,
  trainingRecord,
  incident,
} from "@/schema";
import { loadReportData } from "@/lib/pdf/load-report-data";
import { ComplianceReport } from "@/lib/pdf/compliance-report";
import { styles } from "@/lib/pdf/styles";

const DEMO_EMAIL = "gf@wertstoff-nordkreis.example";

/**
 * Defaults to the Desktop for a developer running this locally, but a
 * container has no Desktop and often no HOME, so the path is overridable and
 * created if absent. Writing to `undefined/Desktop` was the previous outcome.
 */
const OUT_DIR = process.env.DEMO_ORDNER_OUT ?? join(process.env.HOME ?? process.cwd(), "Desktop");

const fmtDate = (d: Date | string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("de-DE") : "—";

const yesNo = (v: boolean | null | undefined) => (v ? "ja" : "nein");

// ── shared annex building blocks ─────────────────────────────────────────
const cell = { fontSize: 8.5, padding: 3, flex: 1 } as const;
const cellHead = {
  ...cell,
  fontFamily: "Helvetica-Bold",
  backgroundColor: "#f0f0f0",
} as const;
const row = {
  flexDirection: "row" as const,
  borderBottom: "0.5 solid #ddd",
};

function Table({
  head,
  widths,
  rows,
}: {
  head: string[];
  widths: number[];
  rows: string[][];
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View style={row}>
        {head.map((h, i) => (
          <Text key={i} style={{ ...cellHead, flex: widths[i] }}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, ri) => (
        <View key={ri} style={row} wrap={false}>
          {r.map((c, ci) => (
            <Text key={ci} style={{ ...cell, flex: widths[ci] }}>
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const ASSET_LABELS: Array<[string, string]> = [
  ["type", "Typ"], ["description", "Beschreibung"], ["quantity", "Anzahl"],
  ["isCritical", "Kritisch"], ["isOT", "OT-System"], ["owner", "Verantwortlich"],
  ["location", "Standort"], ["hostname", "Hostname"], ["ipAddress", "IP-Adresse"],
  ["operatingSystem", "Betriebssystem"], ["softwareVersion", "Software-Version"],
  ["accessManagement", "Zugriffsverwaltung"], ["privilegedAccountCount", "Privilegierte Konten"],
  ["hasMfa", "MFA"], ["encryptionAtRest", "Verschlüsselung (ruhend)"],
  ["encryptionInTransit", "Verschlüsselung (Übertragung)"],
  ["hasBackup", "Backup"], ["backupFrequency", "Backup-Turnus"],
  ["backupLocation", "Backup-Ablage"], ["lastBackupTestDate", "Letzter Restore-Test"],
  ["lastPatchDate", "Letzter Patch"], ["lastVulnScanDate", "Letzter Schwachstellenscan"],
  ["rto", "RTO (Stunden)"], ["rpo", "RPO (Stunden)"],
  ["processesPersonalData", "Personenbezogene Daten"], ["endOfLife", "End-of-Life"],
];

const SUPPLIER_LABELS: Array<[string, string]> = [
  ["serviceType", "Leistung"], ["description", "Beschreibung"],
  ["contactName", "Ansprechpartner"], ["contactEmail", "Kontakt-E-Mail"],
  ["riskLevel", "Risikoeinstufung"], ["isCritical", "Kritischer Lieferant"],
  ["hasAccessToSystems", "Zugriff auf Systeme"], ["hasAccessToData", "Zugriff auf Daten"],
  ["hasSecurityCertification", "Sicherheitszertifizierung"],
  ["securityCertificationType", "Zertifizierung"],
  ["contractStartDate", "Vertrag seit"], ["contractEndDate", "Vertrag bis"],
  ["hasSecurityClauses", "IS-Vertragsklauseln"], ["hasAuditRights", "Auditrechte"],
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
    <View style={styles.requirementBlock} wrap={false}>
      <Text style={{ fontSize: 10.5, fontFamily: "Helvetica-Bold", marginBottom: 4 }}>
        {title}
      </Text>
      {rows.map(([label, v], i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 1.5 }}>
          <Text style={{ fontSize: 8, color: "#888", width: 170 }}>{label}</Text>
          <Text style={{ fontSize: 8, color: "#333", flex: 1 }}>{v}</Text>
        </View>
      ))}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.categoryHeader}>{children}</Text>;
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
  const reportBuffer = await renderToBuffer(
    ComplianceReport({ data, locale: "de" }),
  );
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
      <Page size="A4" style={{ ...styles.page, ...styles.coverPage }}>
        <Text style={styles.coverTitle}>Anlagenband</Text>
        <Text style={{ fontSize: 9, marginTop: 4, color: "#b45309" }}>
          Demodaten. Unternehmen, Personen, Lieferanten und alle Registereinträge
          sind frei erfunden und dienen ausschließlich der Veranschaulichung.
        </Text>
        <Text style={styles.coverSubtitle}>
          NIS2-Dokumentation · Wertstoff Nordkreis GmbH
        </Text>
        <Text style={styles.coverMeta}>Stammdaten der Einrichtung</Text>
        <Text style={styles.coverMeta}>Anlage A — Asset-Inventar ({assets.length} Positionen, mit Stammblättern)</Text>
        <Text style={styles.coverMeta}>Anlage B — Lieferantenregister ({suppliers.length} Lieferanten, mit Stammblättern)</Text>
        <Text style={styles.coverMeta}>Anlage C — Risikoregister ({risks.length} Risiken)</Text>
        <Text style={styles.coverMeta}>Anlage D — Schulungsnachweise ({trainings.length} Einträge)</Text>
        <Text style={styles.coverMeta}>Anlage E — Vorfallregister ({incidents.length} Einträge, §32 BSIG bewertet)</Text>
        <Text style={{ ...styles.coverMeta, marginTop: 30 }}>
          Stand: {new Date().toLocaleDateString("de-DE")} · Erstellt mit nisd2.eu
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Stammdaten der Einrichtung</SectionTitle>
        <DetailBlock
          title="Wertstoff Nordkreis GmbH"
          labels={[
            ["legalForm", "Rechtsform"], ["sector", "Sektor"], ["subSector", "Teilsektor"],
            ["entityTypeLabel", "Einstufung"], ["employeeCount", "Beschäftigte"],
            ["annualRevenueLabel", "Jahresumsatz"], ["registeredAddress", "Anschrift"],
            ["primaryLocations", "Standorte"], ["contactEmail", "Kontakt"],
            ["contactPhone", "Telefon"], ["cisoName", "IT-Sicherheitsverantwortliche"],
            ["cisoReportsTo", "Berichtsweg"], ["bsiContactName", "BSI-Kontaktstelle"],
            ["bsiContactEmail", "BSI-Kontakt E-Mail"], ["bsiContactPhone", "BSI-Kontakt Telefon"],
            ["bsiRegistrationId", "BSI-Registrierung"], ["activatedAtLabel", "NIS2-Programm seit"],
          ]}
          record={{
            ...co,
            entityTypeLabel: co.entityType === "important" ? "wichtige Einrichtung (§28 Abs. 2 BSIG)" : co.entityType,
            annualRevenueLabel: co.annualRevenue ? `${(Number(co.annualRevenue) / 1_000_000).toLocaleString("de-DE")} Mio. €` : null,
            activatedAtLabel: co.activatedAt ? new Date(co.activatedAt).toLocaleDateString("de-DE") : null,
          }}
        />
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage A — Asset-Inventar</SectionTitle>
        <Table
          head={["Asset", "Typ", "Anz.", "Kritisch", "OT", "Verantwortlich", "Backup", "Letzter Patch"]}
          widths={[2.7, 1.2, 0.45, 0.7, 0.45, 1.4, 0.7, 0.9]}
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
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage A.2 — Asset-Stammblätter (alle erfassten Felder)</SectionTitle>
        {assets.map((a, i) => (
          <DetailBlock key={i} title={a.name} record={a as unknown as Record<string, unknown>} labels={ASSET_LABELS} />
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage B — Lieferantenregister (§30 Abs. 2 Nr. 6 BSIG)</SectionTitle>
        <Table
          head={["Lieferant", "Leistung", "Risiko", "Kritisch", "IS-Klauseln", "AVV", "Vertrag seit", "Letzte Prüfung"]}
          widths={[1.7, 2.1, 0.65, 0.65, 0.8, 0.5, 0.85, 0.85]}
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
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage B.2 — Lieferanten-Stammblätter (alle erfassten Felder)</SectionTitle>
        {suppliers.map((s, i) => (
          <DetailBlock key={i} title={s.name} record={s as unknown as Record<string, unknown>} labels={SUPPLIER_LABELS} />
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage C — Risikoregister (§30 Abs. 2 Nr. 1 BSIG)</SectionTitle>
        <Text style={{ fontSize: 8.5, color: "#666", marginBottom: 10 }}>
          Methodik: BSI-Standard 200-3, vereinfachte 5x5-Matrix (Risikomethodik-Richtlinie v1.1). Risikoakzeptanz durch die Geschäftsführung.
        </Text>
        {risks.map((r, i) => (
          <View key={i} style={styles.requirementBlock} wrap={false}>
            <View style={styles.requirementHeader}>
              <Text style={styles.requirementCode}>R-{String(i + 1).padStart(2, "0")}</Text>
              <Text style={styles.requirementTitle}>{r.title}</Text>
            </View>
            <Text style={{ fontSize: 9, color: "#444", marginBottom: 3 }}>{r.description}</Text>
            <Text style={{ fontSize: 8.5, color: "#666" }}>
              Eintritt {r.likelihood}/5 · Auswirkung {r.impact}/5 · Score {r.riskScore}
              {r.residualRiskScore ? ` → Restrisiko ${r.residualRiskScore}` : ""}
              {" · "}Behandlung: {r.treatment}
              {r.riskOwner ? ` · Verantwortlich: ${r.riskOwner}` : ""}
            </Text>
            {r.treatmentDescription ? (
              <Text style={{ fontSize: 8.5, color: "#666", marginTop: 2 }}>
                Maßnahmen: {r.treatmentDescription}
              </Text>
            ) : null}
          </View>
        ))}
      </Page>

      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage D — Schulungsnachweise (§38 Abs. 3 BSIG)</SectionTitle>
        <Table
          head={["Schulung", "Teilnehmer", "Rolle", "Anbieter", "Abschluss", "Nächste fällig"]}
          widths={[2.4, 1.6, 1.2, 1.4, 0.9, 0.9]}
          rows={trainings.map((t) => [
            t.title,
            t.participantName,
            t.participantRole ?? "—",
            t.providerName ?? "—",
            fmtDate(t.completedAt),
            fmtDate(t.nextTrainingDue),
          ])}
        />
      </Page>
      <Page size="A4" style={styles.page}>
        <SectionTitle>Anlage E — Vorfallregister (§32 BSIG)</SectionTitle>
        <Text style={{ fontSize: 8.5, color: "#666", marginBottom: 10 }}>
          Geführt seit 03/2026. Jeder Eintrag wird auf Meldepflicht nach §32 BSIG bewertet. Bisher kein meldepflichtiger Vorfall.
        </Text>
        {incidents.map((inc, i) => (
          <View key={i} style={styles.requirementBlock} wrap={false}>
            <View style={styles.requirementHeader}>
              <Text style={styles.requirementCode}>{inc.internalRef ?? `VF-${i + 1}`}</Text>
              <Text style={styles.requirementTitle}>{inc.title}</Text>
            </View>
            <Text style={{ fontSize: 8.5, color: "#666", marginBottom: 3 }}>
              Entdeckt {fmtDate(inc.discoveredAt)} · behoben {fmtDate(inc.resolvedAt)} · Schweregrad: {inc.severity === "near_miss" ? "Beinahe-Vorfall" : inc.severity === "incident" ? "Vorfall" : "erheblich"}
            </Text>
            <Text style={{ fontSize: 9, color: "#444", marginBottom: 3 }}>{inc.description}</Text>
            {inc.countermeasures ? (
              <Text style={{ fontSize: 8.5, color: "#666" }}>Sofortmaßnahmen: {inc.countermeasures}</Text>
            ) : null}
            {inc.preventiveMeasures ? (
              <Text style={{ fontSize: 8.5, color: "#666" }}>Prävention: {inc.preventiveMeasures}</Text>
            ) : null}
          </View>
        ))}
      </Page>
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
  const dataPath = `${OUT_DIR}/pruefordner-3-register.json`;
  writeFileSync(
    dataPath,
    JSON.stringify(
      { company: co?.name ?? null, exportedFor: "nis2", assets, suppliers, risks, trainings, incidents },
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
