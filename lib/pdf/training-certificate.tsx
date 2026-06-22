import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Locale } from "@/lib/seo";
import { pickLocalized } from "@/lib/locale";

interface CertModule {
  title: string;
  lessons: { id: string; title: string }[];
}

interface TrainingCertificateData {
  courseTitle: string;
  userName: string;
  userEmail: string;
  completionDate: string;
  totalHours: number;
  totalLessons: number;
  modules: CertModule[];
}

interface CertificateLabels {
  title: string;
  certifies: string;
  completed: string;
  dateLabel: string;
  durationLabel: string;
  lessonsLabel: string;
  durationValue: (hours: number) => string;
  legal: string;
  topics: string;
  disclaimer: string;
  issuer: string;
  pageLabel: (n: number, total: number) => string;
}

const LABELS: Record<Locale, CertificateLabels> = {
  de: {
    title: "Teilnahmebescheinigung",
    certifies: "Hiermit wird bestätigt, dass",
    completed: "den folgenden Kurs erfolgreich abgeschlossen hat:",
    dateLabel: "Abschlussdatum",
    durationLabel: "Dauer",
    lessonsLabel: "Lektionen",
    durationValue: (h) => `ca. ${h} Std.`,
    legal: "Managementschulung gemäß §38(3) BSIG / Artikel 20(2) NIS2-Richtlinie",
    topics: "Behandelte Themen",
    disclaimer:
      "Diese Bescheinigung bestätigt die Teilnahme am Kurs. Sie stellt keine rechtliche Zertifizierung der Fachkompetenz dar.",
    issuer: "Ausgestellt von NISD2.eu",
    pageLabel: (n, total) => `Seite ${n} von ${total}`,
  },
  en: {
    title: "Certificate of Completion",
    certifies: "This certifies that",
    completed: "has successfully completed the following course:",
    dateLabel: "Completion date",
    durationLabel: "Duration",
    lessonsLabel: "Lessons",
    durationValue: (h) => `approx. ${h} h`,
    legal: "Management training per §38(3) BSIG / Article 20(2) NIS2 Directive",
    topics: "Topics Covered",
    disclaimer:
      "This certificate confirms course participation. It does not constitute a legal certification of competence.",
    issuer: "Issued by NISD2.eu",
    pageLabel: (n, total) => `Page ${n} of ${total}`,
  },
  nl: {
    title: "Certificaat van Afronding",
    certifies: "Hierbij wordt bevestigd dat",
    completed: "de volgende cursus met succes heeft afgerond:",
    dateLabel: "Datum van afronding",
    durationLabel: "Duur",
    lessonsLabel: "Lessen",
    durationValue: (h) => `ca. ${h} uur`,
    legal: "Managementtraining volgens artikel 20(2) NIS2-richtlijn",
    topics: "Behandelde onderwerpen",
    disclaimer:
      "Dit certificaat bevestigt deelname aan de cursus. Het vormt geen wettelijke certificering van vakbekwaamheid.",
    issuer: "Uitgegeven door NISD2.eu",
    pageLabel: (n, total) => `Pagina ${n} van ${total}`,
  },
  fr: {
    title: "Certificat de Réussite",
    certifies: "Le présent document atteste que",
    completed: "a suivi avec succès le cours suivant :",
    dateLabel: "Date de réussite",
    durationLabel: "Durée",
    lessonsLabel: "Leçons",
    durationValue: (h) => `env. ${h} h`,
    legal: "Formation des dirigeants au titre du §38(3) BSIG / article 20(2) de la directive NIS2",
    topics: "Sujets abordés",
    disclaimer:
      "Ce certificat confirme la participation au cours. Il ne constitue pas une certification légale de compétence.",
    issuer: "Délivré par NISD2.eu",
    pageLabel: (n, total) => `Page ${n} sur ${total}`,
  },
  it: {
    title: "Certificato di Completamento",
    certifies: "Con il presente documento si attesta che",
    completed: "ha completato con successo il seguente corso:",
    dateLabel: "Data di completamento",
    durationLabel: "Durata",
    lessonsLabel: "Lezioni",
    durationValue: (h) => `circa ${h} h`,
    legal: "Formazione per il management ai sensi del §38(3) BSIG / articolo 20(2) della direttiva NIS2",
    topics: "Argomenti trattati",
    disclaimer:
      "Questo certificato conferma la partecipazione al corso. Non costituisce una certificazione legale di competenza.",
    issuer: "Rilasciato da NISD2.eu",
    pageLabel: (n, total) => `Pagina ${n} di ${total}`,
  },
  es: {
    title: "Certificado de Finalización",
    certifies: "Por la presente se certifica que",
    completed: "ha completado con éxito el siguiente curso:",
    dateLabel: "Fecha de finalización",
    durationLabel: "Duración",
    lessonsLabel: "Lecciones",
    durationValue: (h) => `aprox. ${h} h`,
    legal: "Formación de la dirección conforme al §38(3) BSIG / artículo 20(2) de la directiva NIS2",
    topics: "Temas tratados",
    disclaimer:
      "Este certificado confirma la participación en el curso. No constituye una certificación legal de competencia.",
    issuer: "Emitido por NISD2.eu",
    pageLabel: (n, total) => `Página ${n} de ${total}`,
  },
  pl: {
    title: "Certyfikat Ukończenia",
    certifies: "Niniejszym zaświadcza się, że",
    completed: "pomyślnie ukończył następujący kurs:",
    dateLabel: "Data ukończenia",
    durationLabel: "Czas trwania",
    lessonsLabel: "Lekcje",
    durationValue: (h) => `ok. ${h} godz.`,
    legal: "Szkolenie kierownictwa zgodnie z §38(3) BSIG / artykułem 20(2) dyrektywy NIS2",
    topics: "Omawiane tematy",
    disclaimer:
      "Niniejszy certyfikat potwierdza udział w kursie. Nie stanowi prawnej certyfikacji kompetencji.",
    issuer: "Wydane przez NISD2.eu",
    pageLabel: (n, total) => `Strona ${n} z ${total}`,
  },
  cs: {
    title: "Osvědčení o absolvování",
    certifies: "Tímto se potvrzuje, že",
    completed: "úspěšně absolvoval následující kurz:",
    dateLabel: "Datum absolvování",
    durationLabel: "Délka",
    lessonsLabel: "Lekce",
    durationValue: (h) => `přibl. ${h} h`,
    legal: "Školení vedení podle §38(3) BSIG / článku 20(2) směrnice NIS2",
    topics: "Probíraná témata",
    disclaimer:
      "Toto osvědčení potvrzuje účast v kurzu. Nepředstavuje právní certifikaci odborné způsobilosti.",
    issuer: "Vydáno společností NISD2.eu",
    pageLabel: (n, total) => `Strana ${n} z ${total}`,
  },
  pt: {
    title: "Certificado de Conclusão",
    certifies: "Pelo presente certifica-se que",
    completed: "concluiu com êxito o seguinte curso:",
    dateLabel: "Data de conclusão",
    durationLabel: "Duração",
    lessonsLabel: "Lições",
    durationValue: (h) => `aprox. ${h} h`,
    legal: "Formação da direção nos termos do §38(3) BSIG / artigo 20(2) da Diretiva NIS2",
    topics: "Temas abordados",
    disclaimer:
      "Este certificado confirma a participação no curso. Não constitui uma certificação legal de competência.",
    issuer: "Emitido por NISD2.eu",
    pageLabel: (n, total) => `Página ${n} de ${total}`,
  },
  ro: {
    title: "Certificat de Absolvire",
    certifies: "Prin prezenta se certifică faptul că",
    completed: "a finalizat cu succes următorul curs:",
    dateLabel: "Data absolvirii",
    durationLabel: "Durată",
    lessonsLabel: "Lecții",
    durationValue: (h) => `aprox. ${h} h`,
    legal: "Instruirea conducerii conform §38(3) BSIG / articolului 20(2) din Directiva NIS2",
    topics: "Subiecte abordate",
    disclaimer:
      "Acest certificat confirmă participarea la curs. Nu constituie o certificare legală a competenței.",
    issuer: "Emis de NISD2.eu",
    pageLabel: (n, total) => `Pagina ${n} din ${total}`,
  },
};

const styles = StyleSheet.create({
  // Shared
  page: {
    padding: 60,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  pageNoFrame: {
    padding: 50,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  // Cover frame
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
  // Cover content
  brand: {
    marginTop: 20,
    fontSize: 11,
    color: "#1e40af",
    letterSpacing: 4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  legal: {
    marginTop: 4,
    fontSize: 9,
    color: "#6b7280",
    textAlign: "center",
  },
  title: {
    marginTop: 28,
    fontSize: 32,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  certifies: {
    marginTop: 28,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  name: {
    marginTop: 10,
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
  },
  email: {
    marginTop: 4,
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
  },
  completed: {
    marginTop: 22,
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
  },
  courseTitle: {
    marginTop: 6,
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#1e40af",
    textAlign: "center",
  },
  // Stat boxes (compliance-report style)
  statsRow: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  statBox: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    minWidth: 130,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 4,
  },
  // Cover footer (in-frame)
  coverFooter: {
    position: "absolute",
    bottom: 50,
    left: 60,
    right: 60,
  },
  disclaimer: {
    fontSize: 8,
    color: "#9ca3af",
    textAlign: "center",
    lineHeight: 1.4,
  },
  issuer: {
    marginTop: 6,
    fontSize: 9,
    color: "#1e40af",
    textAlign: "center",
    fontFamily: "Helvetica-Bold",
  },
  // Appendix page
  topicsHeading: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    marginBottom: 6,
  },
  topicsSubheading: {
    fontSize: 10,
    color: "#64748b",
    marginBottom: 18,
  },
  moduleBlock: {
    marginBottom: 10,
  },
  moduleHeader: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    paddingBottom: 3,
    marginBottom: 4,
    borderBottom: "0.5 solid #cbd5e1",
  },
  lessonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  lessonCell: {
    width: "50%",
    paddingRight: 8,
    paddingVertical: 0,
    flexDirection: "row",
  },
  lessonId: {
    fontSize: 8,
    fontFamily: "Courier",
    color: "#94a3b8",
    width: 28,
  },
  lessonTitle: {
    fontSize: 9,
    color: "#334155",
    flex: 1,
  },
  // Page-2 footer (running)
  pageFooter: {
    position: "absolute",
    bottom: 24,
    left: 50,
    right: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#94a3b8",
  },
});

export function TrainingCertificateDocument({
  data,
  locale,
}: {
  data: TrainingCertificateData;
  locale: string;
}) {
  const labels = pickLocalized(LABELS, locale);

  return (
    <Document
      title={`${labels.title}: ${data.userName}`}
      author="NISD2.eu"
      subject={labels.legal}
    >
      {/* Page 1: Certificate cover */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border} />
        <View style={styles.innerBorder} />

        <Text style={styles.brand}>NISD2.eu</Text>
        <Text style={styles.legal}>{labels.legal}</Text>

        <Text style={styles.title}>{labels.title}</Text>

        <Text style={styles.certifies}>{labels.certifies}</Text>
        <Text style={styles.name}>{data.userName}</Text>
        <Text style={styles.email}>{data.userEmail}</Text>

        <Text style={styles.completed}>{labels.completed}</Text>
        <Text style={styles.courseTitle}>{data.courseTitle}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.completionDate}</Text>
            <Text style={styles.statLabel}>{labels.dateLabel}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{labels.durationValue(data.totalHours)}</Text>
            <Text style={styles.statLabel}>{labels.durationLabel}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{data.totalLessons}</Text>
            <Text style={styles.statLabel}>{labels.lessonsLabel}</Text>
          </View>
        </View>

        <View style={styles.coverFooter}>
          <Text style={styles.disclaimer}>{labels.disclaimer}</Text>
          <Text style={styles.issuer}>{labels.issuer}</Text>
        </View>
      </Page>

      {/* Page 2: Curriculum appendix */}
      <Page size="A4" orientation="landscape" style={styles.pageNoFrame}>
        <Text style={styles.topicsHeading}>{labels.topics}</Text>
        <Text style={styles.topicsSubheading}>
          {data.courseTitle}, {data.userName}
        </Text>

        {data.modules.map((mod, mi) => (
          <View key={mi} style={styles.moduleBlock}>
            <Text style={styles.moduleHeader}>{mod.title}</Text>
            <View style={styles.lessonGrid}>
              {mod.lessons.map((lesson) => (
                <View key={lesson.id} style={styles.lessonCell} wrap={false}>
                  <Text style={styles.lessonId}>{lesson.id}</Text>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.pageFooter} fixed>
          <Text>{labels.issuer}</Text>
          <Text render={({ pageNumber, totalPages }) => labels.pageLabel(pageNumber, totalPages)} />
        </View>
      </Page>
    </Document>
  );
}

export type { TrainingCertificateData };
