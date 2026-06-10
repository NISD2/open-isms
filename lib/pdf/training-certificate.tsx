import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

type Locale = "de" | "en" | "nl";

interface TrainingCertificateData {
  courseTitle: string;
  userName: string;
  companyName: string | null;
  completionDate: string;
  totalHours: number;
  lessonLines: string[];
}

interface CertificateLabels {
  title: string;
  certifies: string;
  from: string;
  completed: string;
  dateLabel: string;
  durationLabel: string;
  durationValue: (hours: number) => string;
  legal: string;
  lessons: string;
  disclaimer: string;
  issuer: string;
}

const LABELS: Record<Locale, CertificateLabels> = {
  de: {
    title: "Teilnahmebescheinigung",
    certifies: "Hiermit wird bestätigt, dass",
    from: "von",
    completed: "den folgenden Kurs erfolgreich abgeschlossen hat:",
    dateLabel: "Abschlussdatum",
    durationLabel: "Dauer",
    durationValue: (h) => `ca. ${h} Std.`,
    legal: "Managementschulung gemäß §38(3) BSIG / Artikel 20(2) NIS2-Richtlinie",
    lessons: "Behandelte Themen",
    disclaimer:
      "Diese Bescheinigung bestätigt die Teilnahme am Kurs. Sie stellt keine rechtliche Zertifizierung der Fachkompetenz dar.",
    issuer: "Ausgestellt von NISD2.eu",
  },
  en: {
    title: "Certificate of Completion",
    certifies: "This certifies that",
    from: "from",
    completed: "has successfully completed the following course:",
    dateLabel: "Completion date",
    durationLabel: "Duration",
    durationValue: (h) => `approx. ${h} h`,
    legal: "Management training per §38(3) BSIG / Article 20(2) NIS2 Directive",
    lessons: "Topics Covered",
    disclaimer:
      "This certificate confirms course participation. It does not constitute a legal certification of competence.",
    issuer: "Issued by NISD2.eu",
  },
  nl: {
    title: "Certificaat van Afronding",
    certifies: "Hierbij wordt bevestigd dat",
    from: "van",
    completed: "de volgende cursus met succes heeft afgerond:",
    dateLabel: "Datum van afronding",
    durationLabel: "Duur",
    durationValue: (h) => `ca. ${h} uur`,
    legal: "Managementtraining volgens artikel 20(2) NIS2-richtlijn",
    lessons: "Behandelde onderwerpen",
    disclaimer:
      "Dit certificaat bevestigt deelname aan de cursus. Het vormt geen wettelijke certificering van vakbekwaamheid.",
    issuer: "Uitgegeven door NISD2.eu",
  },
};

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  border: {
    position: "absolute",
    top: 20,
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 1,
    borderColor: "#1e40af",
  },
  innerBorder: {
    position: "absolute",
    top: 28,
    bottom: 28,
    left: 28,
    right: 28,
    borderWidth: 0.5,
    borderColor: "#1e40af",
  },
  brand: {
    marginTop: 30,
    fontSize: 11,
    color: "#1e40af",
    letterSpacing: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  legal: {
    marginTop: 6,
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
  },
  title: {
    marginTop: 36,
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  certifies: {
    marginTop: 32,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  name: {
    marginTop: 12,
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  company: {
    marginTop: 6,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  completed: {
    marginTop: 24,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  courseTitle: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    textAlign: "center",
  },
  meta: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
  },
  metaLabel: {
    fontSize: 9,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginTop: 2,
  },
  metaBox: {
    alignItems: "center",
  },
  lessonsHeading: {
    marginTop: 36,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    marginBottom: 8,
  },
  lessonLine: {
    fontSize: 9,
    color: "#374151",
    marginBottom: 2,
  },
  lessonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
  },
  lessonCell: {
    width: "48%",
    paddingHorizontal: 4,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    left: 60,
    right: 60,
  },
  disclaimer: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
  },
  issuer: {
    marginTop: 6,
    fontSize: 9,
    color: "#1e40af",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
});

function pickLocale(locale: string): Locale {
  if (locale === "de" || locale === "nl") return locale;
  return "en";
}

export function TrainingCertificateDocument({
  data,
  locale,
}: {
  data: TrainingCertificateData;
  locale: string;
}) {
  const labels = LABELS[pickLocale(locale)];

  return (
    <Document
      title={`${labels.title}: ${data.userName}`}
      author="NISD2.eu"
      subject={labels.legal}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <Text style={styles.brand}>NISD2.eu</Text>
        <Text style={styles.legal}>{labels.legal}</Text>

        <Text style={styles.title}>{labels.title}</Text>

        <Text style={styles.certifies}>{labels.certifies}</Text>
        <Text style={styles.name}>{data.userName}</Text>
        {data.companyName && (
          <Text style={styles.company}>
            {labels.from} {data.companyName}
          </Text>
        )}

        <Text style={styles.completed}>{labels.completed}</Text>
        <Text style={styles.courseTitle}>{data.courseTitle}</Text>

        <View style={styles.meta}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{labels.dateLabel}</Text>
            <Text style={styles.metaValue}>{data.completionDate}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>{labels.durationLabel}</Text>
            <Text style={styles.metaValue}>{labels.durationValue(data.totalHours)}</Text>
          </View>
        </View>

        <Text style={styles.lessonsHeading}>{labels.lessons}</Text>
        <View style={styles.lessonGrid}>
          {data.lessonLines.map((line, i) => (
            <View key={i} style={styles.lessonCell}>
              <Text style={styles.lessonLine}>{line}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.disclaimer}>{labels.disclaimer}</Text>
          <Text style={styles.issuer}>{labels.issuer}</Text>
        </View>
      </Page>
    </Document>
  );
}

export type { TrainingCertificateData };
