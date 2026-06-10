import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.1",
  passingScore: 75,
  questions: [
    {
      id: "2.1.1",
      question: {
        en: "What two factors does Article 21(1) use to measure a company's cybersecurity exposure?",
        de: "Welche zwei Faktoren verwendet Artikel 21 Absatz 1 zur Bewertung der Cybersicherheitsexposition eines Unternehmens?",
        nl: "Welke twee factoren gebruikt Artikel 21(1) om de cyberbeveiligingsblootstelling van een bedrijf te meten?",
      },
      options: [
        { en: "Budget and headcount", de: "Budget und Mitarbeiterzahl", nl: "Budget en personeelsomvang" },
        { en: "Likelihood and impact", de: "Eintrittswahrscheinlichkeit und Auswirkung", nl: "Waarschijnlijkheid en impact" },
        { en: "Revenue and employee count", de: "Umsatz und Mitarbeiterzahl", nl: "Omzet en aantal medewerkers" },
        { en: "Compliance score and audit grade", de: "Compliance-Bewertung und Audit-Ergebnis", nl: "Compliance-score en auditbeoordeling" },
      ],
      correctIndex: 1,
      explanation: {
        en: "Article 21(1) requires 'appropriate and proportionate' measures based on how likely a bad event is and how bad it would be - likelihood and impact.",
        de: "Artikel 21 Absatz 1 verlangt 'angemessene und verhältnismäßige' Maßnahmen basierend auf der Wahrscheinlichkeit eines Vorfalls und dessen Schwere - Eintrittswahrscheinlichkeit und Auswirkung.",
        nl: "Artikel 21(1) vereist 'passende en evenredige' maatregelen op basis van hoe waarschijnlijk een incident is en hoe ernstig de gevolgen zouden zijn - waarschijnlijkheid en impact.",
      },
    },
    {
      id: "2.1.2",
      question: {
        en: "Which part of the risk matrix should the management body focus on first?",
        de: "Auf welchen Teil der Risikomatrix sollte die Geschäftsleitung zuerst fokussieren?",
        nl: "Op welk deel van de risicomatrix moet het bestuur zich het eerst richten?",
      },
      options: [
        { en: "The bottom-left corner (low likelihood, low impact)", de: "Die untere linke Ecke (geringe Wahrscheinlichkeit, geringe Auswirkung)", nl: "De linkerbenedenhoek (lage waarschijnlijkheid, lage impact)" },
        { en: "The top-right corner (high likelihood, high impact)", de: "Die obere rechte Ecke (hohe Wahrscheinlichkeit, hohe Auswirkung)", nl: "De rechterbovenhoek (hoge waarschijnlijkheid, hoge impact)" },
        { en: "The centre of the matrix", de: "Die Mitte der Matrix", nl: "Het midden van de matrix" },
        { en: "The bottom-right corner (low likelihood, high impact)", de: "Die untere rechte Ecke (geringe Wahrscheinlichkeit, hohe Auswirkung)", nl: "De rechterbenedenhoek (lage waarschijnlijkheid, hoge impact)" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The top-right corner - where 'very likely' meets 'very serious' - is where the company faces the most exposure and where the management body's job begins.",
        de: "Die obere rechte Ecke - wo 'sehr wahrscheinlich' auf 'sehr schwerwiegend' trifft - ist der Bereich mit der größten Exposition und dort beginnt die Aufgabe der Geschäftsleitung.",
        nl: "De rechterbovenhoek - waar 'zeer waarschijnlijk' en 'zeer ernstig' samenkomen - is waar de blootstelling het grootst is en waar de taak van het bestuur begint.",
      },
    },
    {
      id: "2.1.3",
      question: {
        en: "What is the risk register's role in the budget conversation?",
        de: "Welche Rolle spielt das Risikoregister in der Budgetdiskussion?",
        nl: "Welke rol speelt het risicoregister in het budgetgesprek?",
      },
      options: [
        { en: "It replaces the need for a CFO's approval", de: "Es ersetzt die Notwendigkeit einer Genehmigung durch den CFO", nl: "Het vervangt de behoefte aan goedkeuring van de CFO" },
        { en: "It turns the budget argument from opinion into evidence", de: "Es verwandelt die Budgetdiskussion von Meinung in Evidenz", nl: "Het verandert het budgetdebat van mening in bewijs" },
        { en: "It sets the exact euro amount to spend on security", de: "Es legt den genauen Euro-Betrag für Sicherheitsausgaben fest", nl: "Het stelt het exacte bedrag vast dat aan beveiliging besteed moet worden" },
        { en: "It is only used after the budget is already approved", de: "Es wird erst nach der Budgetfreigabe verwendet", nl: "Het wordt pas gebruikt nadat het budget al is goedgekeurd" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The risk register is the document that turns the budget debate from opinion into a decision backed by evidence - scored risks with treatment plans.",
        de: "Das Risikoregister ist das Dokument, das die Budgetdebatte von einer Meinungsdiskussion in eine evidenzbasierte Entscheidung verwandelt - bewertete Risiken mit Behandlungsplänen.",
        nl: "Het risicoregister is het document dat het budgetdebat omzet van mening naar een beslissing onderbouwd door bewijs - beoordeelde risico's met behandelplannen.",
      },
    },
    {
      id: "2.1.4",
      question: {
        en: "Why does an uninformed sign-off on cybersecurity measures fail to protect the CEO under Article 20(1)?",
        de: "Warum schützt eine uninformierte Freigabe von Cybersicherheitsmaßnahmen den CEO nicht gemäß Artikel 20 Absatz 1?",
        nl: "Waarom biedt een ongeïnformeerde goedkeuring van cyberbeveiligingsmaatregelen de CEO geen bescherming onder Artikel 20(1)?",
      },
      options: [
        { en: "Because the CFO must co-sign every security decision", de: "Weil der CFO jede Sicherheitsentscheidung mitzeichnen muss", nl: "Omdat de CFO elke beveiligingsbeslissing moet medeondertekenen" },
        { en: "Because the sign-off must show the CEO understood the risk picture behind the measures", de: "Weil die Freigabe belegen muss, dass der CEO das Risikobild hinter den Maßnahmen verstanden hat", nl: "Omdat de goedkeuring moet aantonen dat de CEO het risicoprofiel achter de maatregelen heeft begrepen" },
        { en: "Because Article 20(1) only applies to the CISO", de: "Weil Artikel 20 Absatz 1 nur für den CISO gilt", nl: "Omdat Artikel 20(1) alleen van toepassing is op de CISO" },
        { en: "Because the auditor requires a separate budget document", de: "Weil der Auditor ein separates Budgetdokument verlangt", nl: "Omdat de auditor een apart budgetdocument vereist" },
      ],
      correctIndex: 1,
      explanation: {
        en: "A sign-off without understanding the risk picture is decorative - Article 20(1) requires the management body to understand what they are approving.",
        de: "Eine Freigabe ohne Verständnis des Risikobilds ist rein dekorativ - Artikel 20 Absatz 1 verlangt, dass die Geschäftsleitung versteht, was sie genehmigt.",
        nl: "Een goedkeuring zonder begrip van het risicoprofiel is louter decoratief - Artikel 20(1) vereist dat het bestuur begrijpt wat het goedkeurt.",
      },
    },
  ],
});

export default quiz;
