import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { AssessmentScores, GapDomain, GapQuestion } from "@/lib/gap-assessment/schema";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a1a" },
  coverPage: { padding: 60, justifyContent: "center" },
  coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  coverSubtitle: { fontSize: 14, color: "#666", marginBottom: 40 },
  coverMeta: { fontSize: 11, color: "#444", marginBottom: 6 },
  heading: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 20, marginBottom: 8, paddingBottom: 4, borderBottom: "1 solid #ddd" },
  subheading: { fontSize: 11, fontFamily: "Helvetica-Bold", marginTop: 12, marginBottom: 4 },
  row: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottom: "1 solid #ccc", paddingVertical: 4, marginBottom: 2 },
  cell: { fontSize: 9 },
  cellBold: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  domainName: { width: "35%" },
  domainScore: { width: "15%", textAlign: "right" },
  domainMaturity: { width: "20%", textAlign: "center" },
  domainAnswered: { width: "15%", textAlign: "center" },
  bar: { height: 8, borderRadius: 2, marginTop: 2 },
  barBg: { width: "15%", backgroundColor: "#eee", borderRadius: 2 },
  gapRank: { width: "5%" },
  gapQuestion: { width: "45%" },
  gapDomain: { width: "15%" },
  gapConsequence: { width: "15%" },
  gapTime: { width: "10%" },
  gapFine: { width: "10%", textAlign: "center" },
  scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: "#333", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  scoreText: { fontSize: 24, fontFamily: "Helvetica-Bold" },
  scoreLabel: { fontSize: 8, color: "#666" },
  summaryRow: { flexDirection: "row", gap: 16, marginTop: 12, marginBottom: 20 },
  summaryCard: { flex: 1, padding: 8, backgroundColor: "#f8f8f8", borderRadius: 4 },
  summaryValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  summaryLabel: { fontSize: 7, color: "#666", marginTop: 2 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#999" },
});

const MATURITY_LABELS: Record<string, Record<string, string>> = {
  en: { critical: "Critical", initial: "Initial", developing: "Developing", managed: "Managed", optimized: "Optimized" },
  de: { critical: "Kritisch", initial: "Initial", developing: "In Entwicklung", managed: "Gesteuert", optimized: "Optimiert" },
};

const CONSEQUENCE_LABELS: Record<string, Record<number, string>> = {
  en: { 0: "Audit Finding", 1: "Operational Risk", 2: "Fine", 3: "Personal Liability" },
  de: { 0: "Audit-Feststellung", 1: "Operatives Risiko", 2: "Bussgeld", 3: "Persoenliche Haftung" },
};

const TIME_LABELS: Record<string, Record<number, string>> = {
  en: { 0: "Quick Win", 1: "Days", 2: "Weeks", 3: "Months" },
  de: { 0: "Sofort", 1: "Tage", 2: "Wochen", 3: "Monate" },
};

function barColor(pct: number) {
  if (pct >= 90) return "#22c55e";
  if (pct >= 75) return "#3b82f6";
  if (pct >= 50) return "#f59e0b";
  if (pct >= 25) return "#f97316";
  return "#ef4444";
}

function Footer({ companyName }: { companyName?: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{companyName ?? "NIS2 Gap Assessment"}</Text>
      <Text>Confidential</Text>
      <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  );
}

export function GapAssessmentReport({
  scores,
  domains,
  questions,
  locale,
  companyName,
  date,
}: {
  scores: AssessmentScores;
  domains: GapDomain[];
  questions: GapQuestion[];
  locale: string;
  companyName?: string;
  date: string;
}) {
  const l = locale === "de" ? "de" : "en";
  const maturityLabels = MATURITY_LABELS[l];
  const consequenceLabels = CONSEQUENCE_LABELS[l];
  const timeLabels = TIME_LABELS[l];

  const criticalGaps = scores.gaps.filter((g) => g.criticality === 3).length;
  const fineExposed = scores.gaps.filter((g) => g.fineExposure).length;
  const personalLiability = scores.gaps.filter((g) => g.consequence === 3).length;
  const quickWins = scores.gaps.filter((g) => g.timeToFix === 0).length;

  function getDomainName(id: number) {
    const d = domains.find((dom) => dom.id === id);
    return d ? (l === "de" ? d.name.de : d.name.en) : `Domain ${id}`;
  }

  function getQuestionText(qid: string) {
    const q = questions.find((qu) => qu.id === qid);
    return q ? (l === "de" ? q.text.de : q.text.en) : qid;
  }

  return (
    <Document>
      {/* Cover */}
      <Page size="A4" style={[s.page, s.coverPage]}>
        <Text style={s.coverTitle}>NIS2 Gap Assessment</Text>
        <Text style={s.coverSubtitle}>
          {l === "de" ? "Bereitschaftsbewertung" : "Readiness Assessment"}
        </Text>
        {companyName && <Text style={s.coverMeta}>{companyName}</Text>}
        <Text style={s.coverMeta}>{date}</Text>
        <Text style={s.coverMeta}>
          {l === "de" ? "Gesamtergebnis" : "Overall Score"}: {scores.overall}%
        </Text>
        <Text style={s.coverMeta}>
          {scores.totalAnswered} / {scores.totalQuestions}{" "}
          {l === "de" ? "Fragen beantwortet" : "questions answered"}
        </Text>
        <Footer companyName={companyName} />
      </Page>

      {/* Domain scores */}
      <Page size="A4" style={s.page}>
        <Text style={s.heading}>
          {l === "de" ? "Ergebnisse pro Bereich" : "Domain Scores"}
        </Text>

        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryValue}>{scores.overall}%</Text>
            <Text style={s.summaryLabel}>{l === "de" ? "Gesamt" : "Overall"}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: "#ef4444" }]}>{criticalGaps}</Text>
            <Text style={s.summaryLabel}>{l === "de" ? "Kritische Luecken" : "Critical Gaps"}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: "#f59e0b" }]}>{fineExposed}</Text>
            <Text style={s.summaryLabel}>{l === "de" ? "Bussgeldrisiko" : "Fine Exposure"}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={[s.summaryValue, { color: "#22c55e" }]}>{quickWins}</Text>
            <Text style={s.summaryLabel}>{l === "de" ? "Sofort behebbar" : "Quick Wins"}</Text>
          </View>
        </View>

        {/* Header row */}
        <View style={s.headerRow}>
          <Text style={[s.cellBold, s.domainName]}>{l === "de" ? "Bereich" : "Domain"}</Text>
          <Text style={[s.cellBold, s.domainScore]}>{l === "de" ? "Ergebnis" : "Score"}</Text>
          <View style={s.barBg} />
          <Text style={[s.cellBold, s.domainMaturity]}>{l === "de" ? "Reifegrad" : "Maturity"}</Text>
          <Text style={[s.cellBold, s.domainAnswered]}>{l === "de" ? "Beantwortet" : "Answered"}</Text>
        </View>

        {scores.domains.map((d) => (
          <View key={d.domainId} style={s.row}>
            <Text style={[s.cell, s.domainName]}>{getDomainName(d.domainId)}</Text>
            <Text style={[s.cell, s.domainScore]}>{d.percentage}%</Text>
            <View style={s.barBg}>
              <View style={[s.bar, { width: `${d.percentage}%`, backgroundColor: barColor(d.percentage) }]} />
            </View>
            <Text style={[s.cell, s.domainMaturity]}>{maturityLabels[d.maturity] ?? d.maturity}</Text>
            <Text style={[s.cell, s.domainAnswered]}>{d.answeredCount}/{d.totalCount}</Text>
          </View>
        ))}
        <Footer companyName={companyName} />
      </Page>

      {/* Priority gaps */}
      <Page size="A4" style={s.page}>
        <Text style={s.heading}>
          {l === "de" ? "Prioritaere Luecken" : "Priority Gaps"}
        </Text>

        <View style={s.headerRow}>
          <Text style={[s.cellBold, s.gapRank]}>#</Text>
          <Text style={[s.cellBold, s.gapQuestion]}>{l === "de" ? "Feststellung" : "Finding"}</Text>
          <Text style={[s.cellBold, s.gapDomain]}>{l === "de" ? "Bereich" : "Domain"}</Text>
          <Text style={[s.cellBold, s.gapConsequence]}>{l === "de" ? "Konsequenz" : "Consequence"}</Text>
          <Text style={[s.cellBold, s.gapTime]}>{l === "de" ? "Aufwand" : "Effort"}</Text>
          <Text style={[s.cellBold, s.gapFine]}>{l === "de" ? "Bussgeld" : "Fine"}</Text>
        </View>

        {scores.gaps.slice(0, 30).map((gap, i) => (
          <View key={gap.questionId} style={s.row} wrap={false}>
            <Text style={[s.cell, s.gapRank]}>{i + 1}</Text>
            <Text style={[s.cell, s.gapQuestion]}>{getQuestionText(gap.questionId)}</Text>
            <Text style={[s.cell, s.gapDomain]}>{getDomainName(gap.domain)}</Text>
            <Text style={[s.cell, s.gapConsequence]}>{consequenceLabels[gap.consequence] ?? ""}</Text>
            <Text style={[s.cell, s.gapTime]}>{timeLabels[gap.timeToFix] ?? ""}</Text>
            <Text style={[s.cell, s.gapFine]}>{gap.fineExposure ? "!" : ""}</Text>
          </View>
        ))}
        <Footer companyName={companyName} />
      </Page>
    </Document>
  );
}
