import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Locale } from "@/lib/seo";
import { pickLocalized } from "@/lib/locale";
import { FONT, registerPdfFonts } from "./fonts";
import { BRAND, Logo, ShieldGlyph } from "./brand";

registerPdfFonts();

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
  /** Stable, non-reversible reference so a recipient and an auditor can talk
   *  about the same document. Computed by the route from the completion. */
  certificateRef: string;
  /** The obligation this course actually teaches, in the reader's locale, and
   *  the short mark on the seal. Both come from the course, because a single
   *  template constant meant the CRA course claimed §38(3) BSIG. */
  legalBasis: string;
  sealLabel: string;
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
  topics: string;
  disclaimer: string;
  issuer: string;
  issuedBy: string;
  refLabel: string;
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
    topics: "Behandelte Themen",
    disclaimer:
      "Diese Bescheinigung bestätigt die Teilnahme am Kurs. Sie stellt keine rechtliche Zertifizierung der Fachkompetenz dar.",
    issuer: "Ausgestellt von NISD2.eu",
    issuedBy: "Ausgestellt von",
    refLabel: "Bescheinigung Nr.",
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
    topics: "Topics Covered",
    disclaimer:
      "This certificate confirms course participation. It does not constitute a legal certification of competence.",
    issuer: "Issued by NISD2.eu",
    issuedBy: "Issued by",
    refLabel: "Certificate no.",
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
    topics: "Behandelde onderwerpen",
    disclaimer:
      "Dit certificaat bevestigt deelname aan de cursus. Het vormt geen wettelijke certificering van vakbekwaamheid.",
    issuer: "Uitgegeven door NISD2.eu",
    issuedBy: "Uitgegeven door",
    refLabel: "Certificaatnr.",
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
    topics: "Sujets abordés",
    disclaimer:
      "Ce certificat confirme la participation au cours. Il ne constitue pas une certification légale de compétence.",
    issuer: "Délivré par NISD2.eu",
    issuedBy: "Délivré par",
    refLabel: "Certificat n°",
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
    topics: "Argomenti trattati",
    disclaimer:
      "Questo certificato conferma la partecipazione al corso. Non costituisce una certificazione legale di competenza.",
    issuer: "Rilasciato da NISD2.eu",
    issuedBy: "Rilasciato da",
    refLabel: "Certificato n.",
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
    topics: "Temas tratados",
    disclaimer:
      "Este certificado confirma la participación en el curso. No constituye una certificación legal de competencia.",
    issuer: "Emitido por NISD2.eu",
    issuedBy: "Emitido por",
    refLabel: "Certificado n.º",
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
    topics: "Omawiane tematy",
    disclaimer:
      "Niniejszy certyfikat potwierdza udział w kursie. Nie stanowi prawnej certyfikacji kompetencji.",
    issuer: "Wydane przez NISD2.eu",
    issuedBy: "Wydane przez",
    refLabel: "Certyfikat nr",
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
    topics: "Probíraná témata",
    disclaimer:
      "Toto osvědčení potvrzuje účast v kurzu. Nepředstavuje právní certifikaci odborné způsobilosti.",
    issuer: "Vydáno společností NISD2.eu",
    issuedBy: "Vydáno společností",
    refLabel: "Osvědčení č.",
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
    topics: "Temas abordados",
    disclaimer:
      "Este certificado confirma a participação no curso. Não constitui uma certificação legal de competência.",
    issuer: "Emitido por NISD2.eu",
    issuedBy: "Emitido por",
    refLabel: "Certificado n.º",
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
    topics: "Subiecte abordate",
    disclaimer:
      "Acest certificat confirmă participarea la curs. Nu constituie o certificare legală a competenței.",
    issuer: "Emis de NISD2.eu",
    issuedBy: "Emis de",
    refLabel: "Certificat nr.",
    pageLabel: (n, total) => `Pagina ${n} din ${total}`,
  },
};

const LESSON_COLUMNS = 2;

function chunk<T>(items: readonly T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, i) =>
    items.slice(i * size, (i + 1) * size),
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingBottom: 30,
    paddingHorizontal: 56,
    fontFamily: FONT.sans,
    color: BRAND.body,
  },

  // Full-bleed brand rules. Two segments in the house colours give the sheet an
  // identity at a glance without the doubled hairline frame of a clip-art
  // certificate.
  bandTop: { position: "absolute", top: 0, left: 0, right: 0, height: 7, flexDirection: "row" },
  bandBottom: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3, flexDirection: "row" },
  bandPrimary: { flex: 3, backgroundColor: BRAND.primary },
  bandAccent: { flex: 1, backgroundColor: BRAND.accent },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refBlock: { alignItems: "flex-end" },
  refLabel: {
    fontSize: 6.5,
    fontWeight: 500,
    letterSpacing: 1.3,
    marginRight: -1.3,
    textTransform: "uppercase",
    color: BRAND.faint,
  },
  refValue: { fontFamily: FONT.mono, fontSize: 8.5, color: BRAND.muted, marginTop: 3 },
  headerRule: { height: 0.75, backgroundColor: BRAND.rule, marginTop: 14 },

  // Cover body
  body: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingTop: 20 },
  eyebrow: {
    fontSize: 7.5,
    fontWeight: 600,
    letterSpacing: 1.7,
    textTransform: "uppercase",
    color: BRAND.accent,
    textAlign: "center",
  },
  title: {
    marginTop: 12,
    fontSize: 33,
    fontWeight: 700,
    letterSpacing: -0.5,
    color: BRAND.ink,
    textAlign: "center",
  },
  certifies: { marginTop: 26, fontSize: 10.5, color: BRAND.muted, textAlign: "center" },
  name: {
    marginTop: 9,
    fontSize: 29,
    fontWeight: 600,
    letterSpacing: -0.3,
    color: BRAND.primary,
    textAlign: "center",
  },
  email: { marginTop: 7, fontSize: 8.5, color: BRAND.faint, textAlign: "center" },
  identityRule: { width: 190, height: 0.75, backgroundColor: BRAND.ruleStrong, marginTop: 20 },
  completed: { marginTop: 20, fontSize: 10.5, color: BRAND.muted, textAlign: "center" },
  courseTitle: {
    marginTop: 7,
    fontSize: 17,
    fontWeight: 600,
    color: BRAND.ink,
    textAlign: "center",
  },

  // Stat plate
  stats: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.75,
    borderColor: BRAND.rule,
    borderRadius: 6,
    backgroundColor: BRAND.surface,
    paddingVertical: 12,
  },
  statCell: { paddingHorizontal: 28, alignItems: "center", minWidth: 128 },
  statDivider: { width: 1, height: 28, backgroundColor: BRAND.rule },
  statValue: { fontSize: 13, fontWeight: 600, color: BRAND.ink },
  statLabel: {
    marginTop: 5,
    fontSize: 6.5,
    fontWeight: 500,
    letterSpacing: 1.1,
    textTransform: "uppercase",
    color: BRAND.faint,
  },

  // Cover footer
  footer: {
    marginTop: 22,
    paddingTop: 15,
    borderTopWidth: 0.75,
    borderTopColor: BRAND.rule,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  footerSide: { width: 190 },
  issuerLabel: {
    fontSize: 6.5,
    fontWeight: 500,
    letterSpacing: 1.3,
    textTransform: "uppercase",
    color: BRAND.faint,
  },
  issuerName: { marginTop: 4, fontSize: 11, fontWeight: 600, color: BRAND.primary },
  issuerUrl: { marginTop: 2, fontSize: 8, color: BRAND.faint },
  disclaimer: {
    flex: 1,
    paddingHorizontal: 28,
    fontSize: 7,
    lineHeight: 1.5,
    color: BRAND.faint,
    textAlign: "center",
  },

  // Seal
  sealWrap: { width: 190, alignItems: "flex-end" },
  seal: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.1,
    borderColor: BRAND.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sealInner: {
    position: "absolute",
    top: 3.5,
    left: 3.5,
    right: 3.5,
    bottom: 3.5,
    borderRadius: 25,
    borderWidth: 0.5,
    borderColor: "#a8bcc9",
  },
  sealText: {
    marginTop: 3,
    fontSize: 6,
    fontWeight: 600,
    letterSpacing: 1.2,
    color: BRAND.primary,
  },

  // Appendix
  appendixTitle: { marginTop: 15, fontSize: 15, fontWeight: 700, color: BRAND.ink },
  appendixSub: { marginTop: 4, fontSize: 8.5, color: BRAND.muted },
  moduleBlock: { marginTop: 11 },
  moduleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingBottom: 4,
    borderBottomWidth: 0.75,
    borderBottomColor: BRAND.rule,
  },
  moduleMark: { width: 3, height: 12, borderRadius: 1.5, backgroundColor: BRAND.primary },
  moduleTitle: { fontSize: 10.5, fontWeight: 600, color: BRAND.ink, flex: 1 },
  lessonGrid: { marginTop: 5 },
  lessonRow: { flexDirection: "row", marginBottom: 2.5 },
  lessonCell: { width: "50%", flexDirection: "row", paddingRight: 20 },
  lessonId: { width: 22, fontFamily: FONT.mono, fontSize: 6.8, color: BRAND.faint, paddingTop: 0.7 },
  lessonTitle: { flex: 1, fontSize: 8.3, lineHeight: 1.35, color: BRAND.body },
  pageFooter: {
    position: "absolute",
    bottom: 20,
    left: 56,
    right: 56,
    paddingTop: 9,
    borderTopWidth: 0.75,
    borderTopColor: BRAND.rule,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: BRAND.faint,
  },
});

function BrandBands() {
  return (
    <>
      <View style={styles.bandTop} fixed>
        <View style={styles.bandPrimary} />
        <View style={styles.bandAccent} />
      </View>
      <View style={styles.bandBottom} fixed>
        <View style={styles.bandAccent} />
        <View style={styles.bandPrimary} />
      </View>
    </>
  );
}

function Header({ label, value }: { label: string; value: string }) {
  return (
    <>
      <View style={styles.header}>
        <Logo />
        <View style={styles.refBlock}>
          <Text style={styles.refLabel}>{label}</Text>
          <Text style={styles.refValue}>{value}</Text>
        </View>
      </View>
      <View style={styles.headerRule} />
    </>
  );
}

function Seal({ label }: { label: string }) {
  return (
    <View style={styles.seal}>
      <View style={styles.sealInner} />
      <ShieldGlyph size={17} color={BRAND.primary} strokeWidth={1.9} />
      <Text style={styles.sealText}>{label}</Text>
    </View>
  );
}

export function TrainingCertificateDocument({
  data,
  locale,
}: {
  data: TrainingCertificateData;
  locale: string;
}) {
  const labels = pickLocalized(LABELS, locale);

  // The verified email is the only identity the platform can stand behind: it
  // is confirmed at signup (OTP for email/password, email_verified for OAuth).
  // For email/password signups we never collect a name, so user.name is a
  // placeholder derived from the email. Only treat it as a real name when it is
  // something a person or OAuth provider actually supplied, otherwise anchor the
  // certificate on the verified email.
  const emailLocalPart = data.userEmail.split("@")[0];
  const hasRealName =
    data.userName.length > 0 &&
    data.userName !== "Participant" &&
    data.userName !== data.userEmail &&
    data.userName !== emailLocalPart;
  const identity = hasRealName ? data.userName : data.userEmail || data.userName;

  const stats = [
    { value: data.completionDate, label: labels.dateLabel },
    { value: labels.durationValue(data.totalHours), label: labels.durationLabel },
    { value: String(data.totalLessons), label: labels.lessonsLabel },
  ];

  return (
    <Document
      title={`${labels.title}: ${identity}`}
      author="NISD2.eu"
      subject={data.legalBasis}
      keywords="NIS2, BSIG, management training, certificate"
    >
      {/* Page 1: certificate cover */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <BrandBands />
        <Header label={labels.refLabel} value={data.certificateRef} />

        <View style={styles.body}>
          <Text style={styles.eyebrow}>{data.legalBasis}</Text>
          <Text style={styles.title}>{labels.title}</Text>

          <Text style={styles.certifies}>{labels.certifies}</Text>
          <Text style={styles.name}>{identity}</Text>
          {hasRealName && <Text style={styles.email}>{data.userEmail}</Text>}
          <View style={styles.identityRule} />

          <Text style={styles.completed}>{labels.completed}</Text>
          <Text style={styles.courseTitle}>{data.courseTitle}</Text>

          <View style={styles.stats}>
            {stats.map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerSide}>
            <Text style={styles.issuerLabel}>{labels.issuedBy}</Text>
            <Text style={styles.issuerName}>NISD2.eu</Text>
            <Text style={styles.issuerUrl}>www.nisd2.eu</Text>
          </View>
          <Text style={styles.disclaimer}>{labels.disclaimer}</Text>
          <View style={styles.sealWrap}>
            <Seal label={data.sealLabel} />
          </View>
        </View>
      </Page>

      {/* Page 2: curriculum appendix */}
      <Page size="A4" orientation="landscape" style={styles.page}>
        <BrandBands />
        <View fixed>
          <Header label={labels.refLabel} value={data.certificateRef} />
        </View>

        <Text style={styles.appendixTitle}>{labels.topics}</Text>
        <Text style={styles.appendixSub}>
          {data.courseTitle} · {identity}
        </Text>

        {data.modules.map((mod, mi) => (
          <View key={mi} style={styles.moduleBlock}>
            {/* The block itself splits between lesson rows; the heading stays
                whole and only starts a page it has rows to share with. */}
            <View style={styles.moduleHeader} wrap={false} minPresenceAhead={30}>
              <View style={styles.moduleMark} />
              <Text style={styles.moduleTitle}>{mod.title}</Text>
            </View>
            <View style={styles.lessonGrid}>
              {chunk(mod.lessons, LESSON_COLUMNS).map((row) => (
                <View key={row[0].id} style={styles.lessonRow} wrap={false}>
                  {row.map((lesson) => (
                    <View key={lesson.id} style={styles.lessonCell}>
                      <Text style={styles.lessonId}>{lesson.id}</Text>
                      <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    </View>
                  ))}
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
