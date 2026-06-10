import { quizSchema } from "@/lib/training/schemas";

const quiz = quizSchema.parse({
  lessonId: "2.5",
  passingScore: 75,
  questions: [
    {
      id: "2.5.1",
      question: {
        en: "What are the three components of the CIA triad?",
        de: "Was sind die drei Komponenten der CIA-Triade?",
        nl: "Wat zijn de drie componenten van de CIA-triade?",
      },
      options: [
        { en: "Cost, implementation, availability", de: "Kosten, Implementierung, Verfügbarkeit", nl: "Kosten, implementatie, beschikbaarheid" },
        { en: "Confidentiality, integrity, availability", de: "Vertraulichkeit, Integrität, Verfügbarkeit", nl: "Vertrouwelijkheid, integriteit, beschikbaarheid" },
        { en: "Compliance, insurance, accountability", de: "Compliance, Versicherung, Verantwortlichkeit", nl: "Naleving, verzekering, verantwoordelijkheid" },
        { en: "Continuity, incident response, auditing", de: "Kontinuität, Incident Response, Auditierung", nl: "Continuïteit, incidentrespons, auditing" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The CIA triad is confidentiality (data only accessible to authorised people), integrity (data is accurate and untampered), and availability (systems are accessible when needed).",
        de: "Die CIA-Triade besteht aus Vertraulichkeit (Daten nur für berechtigte Personen zugänglich), Integrität (Daten sind korrekt und unverändert) und Verfügbarkeit (Systeme sind bei Bedarf erreichbar).",
        nl: "De CIA-triade bestaat uit vertrouwelijkheid (gegevens alleen toegankelijk voor bevoegden), integriteit (gegevens zijn juist en ongewijzigd) en beschikbaarheid (systemen zijn bereikbaar wanneer nodig).",
      },
    },
    {
      id: "2.5.2",
      question: {
        en: "What is the purpose of a business impact analysis (BIA)?",
        de: "Wozu dient eine Business Impact Analyse (BIA)?",
        nl: "Wat is het doel van een business impact analyse (BIA)?",
      },
      options: [
        { en: "To calculate the company's annual revenue", de: "Zur Berechnung des Jahresumsatzes des Unternehmens", nl: "Om de jaarlijkse omzet van het bedrijf te berekenen" },
        { en: "To translate technical risk categories into business numbers for each critical asset", de: "Zur Übersetzung technischer Risikokategorien in betriebswirtschaftliche Kennzahlen für jedes kritische Asset", nl: "Om technische risicocategorieën te vertalen naar bedrijfscijfers voor elk kritiek asset" },
        { en: "To replace the risk matrix with financial projections", de: "Zum Ersetzen der Risikomatrix durch Finanzprognosen", nl: "Om de risicomatrix te vervangen door financiële prognoses" },
        { en: "To assign blame after a security incident", de: "Zur Schuldzuweisung nach einem Sicherheitsvorfall", nl: "Om verantwoordelijkheid toe te wijzen na een beveiligingsincident" },
      ],
      correctIndex: 1,
      explanation: {
        en: "The BIA translates CIA categories into business numbers - recovery targets and business consequences - making the risk matrix actionable.",
        de: "Die BIA übersetzt CIA-Kategorien in betriebswirtschaftliche Kennzahlen - Wiederherstellungsziele und geschäftliche Auswirkungen - und macht die Risikomatrix handlungsfähig.",
        nl: "De BIA vertaalt CIA-categorieën naar bedrijfscijfers - hersteldoelstellingen en bedrijfsgevolgen - waardoor de risicomatrix uitvoerbaar wordt.",
      },
    },
    {
      id: "2.5.3",
      question: {
        en: "What is the management body's specific role regarding the BIA?",
        de: "Welche konkrete Rolle hat die Geschäftsleitung bei der BIA?",
        nl: "Wat is de specifieke rol van het bestuur met betrekking tot de BIA?",
      },
      options: [
        { en: "To perform the technical analysis themselves", de: "Die technische Analyse selbst durchzuführen", nl: "De technische analyse zelf uitvoeren" },
        { en: "To delegate it entirely to the CISO without review", de: "Sie vollständig an den CISO zu delegieren ohne Überprüfung", nl: "Het volledig delegeren aan de CISO zonder beoordeling" },
        { en: "To validate the business assumptions in the BIA", de: "Die betriebswirtschaftlichen Annahmen in der BIA zu validieren", nl: "De bedrijfsaannames in de BIA valideren" },
        { en: "To sign it without reading it", de: "Sie zu unterschreiben ohne sie zu lesen", nl: "Het ondertekenen zonder het te lezen" },
      ],
      correctIndex: 2,
      explanation: {
        en: "The CEO's role is to validate the business assumptions - only the management body has the business context to check whether recovery targets match what the company can survive.",
        de: "Die Rolle des CEO ist die Validierung der betriebswirtschaftlichen Annahmen - nur die Geschäftsleitung hat den geschäftlichen Kontext, um zu prüfen, ob die Wiederherstellungsziele dem entsprechen, was das Unternehmen überstehen kann.",
        nl: "De rol van de CEO is het valideren van de bedrijfsaannames - alleen het bestuur heeft de bedrijfscontext om te controleren of de hersteldoelstellingen overeenkomen met wat het bedrijf kan overleven.",
      },
    },
    {
      id: "2.5.4",
      question: {
        en: "According to the lesson, what happens to risk matrix scores without a BIA?",
        de: "Was passiert laut der Lektion mit den Bewertungen der Risikomatrix ohne eine BIA?",
        nl: "Wat gebeurt er volgens de les met risicomatrixscores zonder een BIA?",
      },
      options: [
        { en: "They become legally binding", de: "Sie werden rechtlich bindend", nl: "Ze worden juridisch bindend" },
        { en: "They remain accurate but incomplete", de: "Sie bleiben korrekt, aber unvollständig", nl: "Ze blijven nauwkeurig maar onvolledig" },
        { en: "They are guesses", de: "Sie sind Schätzungen", nl: "Het zijn schattingen" },
        { en: "They are automatically generated by the auditor", de: "Sie werden automatisch vom Auditor generiert", nl: "Ze worden automatisch gegenereerd door de auditor" },
      ],
      correctIndex: 2,
      explanation: {
        en: "Without business-impact numbers attached to each asset, the risk matrix scores are guesses - the BIA is what makes the matrix actionable.",
        de: "Ohne betriebswirtschaftliche Auswirkungszahlen für jedes Asset sind die Bewertungen der Risikomatrix Schätzungen - die BIA macht die Matrix erst handlungsfähig.",
        nl: "Zonder bedrijfsimpactcijfers gekoppeld aan elk asset zijn de risicomatrixscores schattingen - de BIA is wat de matrix uitvoerbaar maakt.",
      },
    },
  ],
});

export default quiz;
